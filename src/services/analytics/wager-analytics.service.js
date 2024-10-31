const { PLLAYError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const db = require('../../db/knex');
const metrics = require('../../utils/metrics');

class WagerAnalyticsService {
  async getWagerMetrics(startDate, endDate) {
    try {
      const [
        volumeMetrics,
        userMetrics,
        performanceMetrics,
        riskMetrics
      ] = await Promise.all([
        this.getVolumeMetrics(startDate, endDate),
        this.getUserMetrics(startDate, endDate),
        this.getPerformanceMetrics(startDate, endDate),
        this.getRiskMetrics(startDate, endDate)
      ]);

      return {
        timestamp: new Date(),
        period: { startDate, endDate },
        volume: volumeMetrics,
        users: userMetrics,
        performance: performanceMetrics,
        risk: riskMetrics
      };
    } catch (error) {
      logger.error('Wager metrics error:', error);
      throw new PLLAYError('Failed to get wager metrics', error);
    }
  }

  async getVolumeMetrics(startDate, endDate) {
    return await db('wager_history')
      .whereBetween('created_at', [startDate, endDate])
      .select(
        db.raw('COUNT(*) as total_wagers'),
        db.raw('SUM(amount) as total_volume'),
        db.raw('AVG(amount) as average_wager'),
        db.raw('COUNT(CASE WHEN status = \'won\' THEN 1 END) as total_wins'),
        db.raw('COUNT(CASE WHEN status = \'lost\' THEN 1 END) as total_losses'),
        db.raw('SUM(CASE WHEN status = \'won\' THEN actual_win ELSE 0 END) as total_payouts'),
        db.raw('SUM(CASE WHEN status = \'won\' THEN actual_win - amount ELSE -amount END) as net_revenue')
      )
      .first();
  }

  async getUserMetrics(startDate, endDate) {
    return await db('wager_history')
      .whereBetween('created_at', [startDate, endDate])
      .select(
        db.raw('COUNT(DISTINCT user_id) as unique_users'),
        db.raw('AVG(wagers_per_user.wager_count) as avg_wagers_per_user'),
        db.raw('MAX(wagers_per_user.wager_count) as max_wagers_per_user')
      )
      .crossJoin(db.raw(`
        (SELECT user_id, COUNT(*) as wager_count 
         FROM wager_history 
         WHERE created_at BETWEEN ? AND ?
         GROUP BY user_id) as wagers_per_user
      `, [startDate, endDate]))
      .first();
  }

  async getPerformanceMetrics(startDate, endDate) {
    return await db('wager_history')
      .whereBetween('created_at', [startDate, endDate])
      .select(
        db.raw('AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration'),
        db.raw('percentile_cont(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - created_at))) as p95_duration'),
        db.raw('COUNT(CASE WHEN status = \'cancelled\' THEN 1 END) as cancelled_wagers'),
        db.raw('COUNT(CASE WHEN status = \'disputed\' THEN 1 END) as disputed_wagers')
      )
      .first();
  }

  async getRiskMetrics(startDate, endDate) {
    return await db('wager_history')
      .whereBetween('created_at', [startDate, endDate])
      .select(
        db.raw('COUNT(CASE WHEN amount >= 1000 THEN 1 END) as high_value_wagers'),
        db.raw('COUNT(DISTINCT CASE WHEN win_rate.rate >= 0.8 THEN user_id END) as high_win_rate_users'),
        db.raw('COUNT(DISTINCT CASE WHEN rapid_wagers.count >= 10 THEN user_id END) as rapid_wagering_users')
      )
      .crossJoin(db.raw(`
        (SELECT user_id, 
         COUNT(CASE WHEN status = 'won' THEN 1 END)::float / COUNT(*) as rate
         FROM wager_history 
         WHERE created_at BETWEEN ? AND ?
         GROUP BY user_id) as win_rate
      `, [startDate, endDate]))
      .crossJoin(db.raw(`
        (SELECT user_id, COUNT(*) as count
         FROM wager_history 
         WHERE created_at BETWEEN ? AND ?
         GROUP BY user_id, DATE_TRUNC('hour', created_at)) as rapid_wagers
      `, [startDate, endDate]))
      .first();
  }

  async getUserAnalytics(userId) {
    try {
      const [wagerStats, trends, patterns] = await Promise.all([
        this.getUserWagerStats(userId),
        this.getUserTrends(userId),
        this.getUserPatterns(userId)
      ]);

      return {
        userId,
        timestamp: new Date(),
        stats: wagerStats,
        trends,
        patterns
      };
    } catch (error) {
      logger.error('User analytics error:', error);
      throw new PLLAYError('Failed to get user analytics', error);
    }
  }

  async getUserWagerStats(userId) {
    return await db('wager_stats')
      .where('user_id', userId)
      .first();
  }

  async getUserTrends(userId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return await db('wager_history')
      .where('user_id', userId)
      .where('created_at', '>', thirtyDaysAgo)
      .select(
        db.raw('DATE_TRUNC(\'day\', created_at) as date'),
        db.raw('COUNT(*) as wager_count'),
        db.raw('SUM(amount) as total_amount'),
        db.raw('COUNT(CASE WHEN status = \'won\' THEN 1 END) as wins'),
        db.raw('SUM(CASE WHEN status = \'won\' THEN actual_win - amount ELSE -amount END) as net_profit')
      )
      .groupBy('date')
      .orderBy('date');
  }

  async getUserPatterns(userId) {
    const patterns = {
      timeOfDay: await this.getTimeOfDayPattern(userId),
      wagerSizes: await this.getWagerSizePattern(userId),
      gamePreferences: await this.getGamePreferences(userId),
      riskProfile: await this.calculateRiskProfile(userId)
    };

    return patterns;
  }

  async getTimeOfDayPattern(userId) {
    return await db('wager_history')
      .where('user_id', userId)
      .select(
        db.raw('EXTRACT(HOUR FROM created_at) as hour'),
        db.raw('COUNT(*) as count')
      )
      .groupBy('hour')
      .orderBy('hour');
  }

  async getWagerSizePattern(userId) {
    return await db('wager_history')
      .where('user_id', userId)
      .select(
        db.raw('CASE WHEN amount < 10 THEN \'small\' WHEN amount < 50 THEN \'medium\' ELSE \'large\' END as size'),
        db.raw('COUNT(*) as count'),
        db.raw('AVG(CASE WHEN status = \'won\' THEN 1 ELSE 0 END) as win_rate')
      )
      .groupBy('size');
  }

  async getGamePreferences(userId) {
    return await db('wager_history')
      .where('user_id', userId)
      .join('games', 'wager_history.game_id', 'games.id')
      .select(
        'games.name',
        db.raw('COUNT(*) as count'),
        db.raw('SUM(amount) as total_wagered'),
        db.raw('AVG(CASE WHEN status = \'won\' THEN 1 ELSE 0 END) as win_rate')
      )
      .groupBy('games.id', 'games.name')
      .orderBy('count', 'desc')
      .limit(5);
  }

  async calculateRiskProfile(userId) {
    const metrics = await db('wager_history')
      .where('user_id', userId)
      .select(
        db.raw('AVG(amount) as avg_wager'),
        db.raw('MAX(amount) as max_wager'),
        db.raw('STDDEV(amount) as wager_volatility'),
        db.raw('AVG(CASE WHEN status = \'won\' THEN 1 ELSE 0 END) as win_rate'),
        db.raw('COUNT(*) / EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) * 86400 as daily_frequency')
      )
      .first();

    return {
      riskLevel: this.calculateRiskLevel(metrics),
      metrics
    };
  }

  calculateRiskLevel(metrics) {
    let riskScore = 0;

    // High average wager
    if (metrics.avg_wager > 100) riskScore += 2;
    if (metrics.avg_wager > 500) riskScore += 3;

    // High volatility
    if (metrics.wager_volatility > metrics.avg_wager) riskScore += 2;

    // Extreme win rate (could indicate cheating)
    if (metrics.win_rate > 0.8) riskScore += 3;

    // High frequency
    if (metrics.daily_frequency > 10) riskScore += 2;
    if (metrics.daily_frequency > 20) riskScore += 3;

    if (riskScore >= 8) return 'high';
    if (riskScore >= 5) return 'medium';
    return 'low';
  }
}

module.exports = new WagerAnalyticsService();