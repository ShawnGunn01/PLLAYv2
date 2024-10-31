const { PLLAYError } = require('../utils/errors');
const logger = require('../utils/logger');
const db = require('../db/knex');
const metrics = require('../utils/metrics');

class AnalyticsService {
  async trackUserActivity(userId, activity) {
    try {
      const [record] = await db('user_activities').insert({
        user_id: userId,
        type: activity.type,
        metadata: activity.metadata,
        performed_at: new Date()
      }).returning('*');

      metrics.metrics.userActivityCounter.inc({
        activity_type: activity.type
      });

      return record;
    } catch (error) {
      logger.error('Activity tracking error:', error);
      throw new PLLAYError('Failed to track activity', error);
    }
  }

  async getTournamentAnalytics(tournamentId) {
    try {
      const stats = await db('tournament_participants')
        .where('tournament_id', tournamentId)
        .select(
          db.raw('COUNT(*) as total_participants'),
          db.raw('COUNT(CASE WHEN status = \'active\' THEN 1 END) as active_participants'),
          db.raw('AVG(score) as average_score'),
          db.raw('MAX(score) as highest_score'),
          db.raw('MIN(score) as lowest_score')
        )
        .first();

      const timeStats = await db('tournament_matches')
        .where('tournament_id', tournamentId)
        .select(
          db.raw('AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) as avg_match_duration'),
          db.raw('COUNT(*) as total_matches'),
          db.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed_matches')
        )
        .first();

      return {
        participation: stats,
        matches: timeStats,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Tournament analytics error:', error);
      throw new PLLAYError('Failed to get tournament analytics', error);
    }
  }

  async getPaymentAnalytics(startDate, endDate) {
    try {
      const stats = await db('transactions')
        .whereBetween('created_at', [startDate, endDate])
        .select(
          'type',
          db.raw('COUNT(*) as count'),
          db.raw('SUM(amount) as total_amount'),
          db.raw('AVG(amount) as average_amount'),
          db.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as successful_count'),
          db.raw('COUNT(CASE WHEN status = \'failed\' THEN 1 END) as failed_count')
        )
        .groupBy('type');

      const volumeByDay = await db('transactions')
        .whereBetween('created_at', [startDate, endDate])
        .select(
          db.raw('DATE(created_at) as date'),
          db.raw('COUNT(*) as count'),
          db.raw('SUM(amount) as total_amount')
        )
        .groupBy('date')
        .orderBy('date');

      return {
        byType: stats,
        dailyVolume: volumeByDay,
        period: { startDate, endDate }
      };
    } catch (error) {
      logger.error('Payment analytics error:', error);
      throw new PLLAYError('Failed to get payment analytics', error);
    }
  }

  async getPerformanceMetrics(timeframe = '1h') {
    try {
      const metrics = await this.collectPerformanceMetrics(timeframe);
      await this.storeMetrics(metrics);
      return metrics;
    } catch (error) {
      logger.error('Performance metrics error:', error);
      throw new PLLAYError('Failed to get performance metrics', error);
    }
  }

  async collectPerformanceMetrics(timeframe) {
    const endTime = new Date();
    const startTime = new Date(endTime - this.parseTimeframe(timeframe));

    return {
      api: await this.getAPIMetrics(startTime, endTime),
      system: await this.getSystemMetrics(),
      database: await this.getDatabaseMetrics(),
      cache: await this.getCacheMetrics(),
      errors: await this.getErrorMetrics(startTime, endTime)
    };
  }

  parseTimeframe(timeframe) {
    const unit = timeframe.slice(-1);
    const value = parseInt(timeframe.slice(0, -1));
    
    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000; // Default 1 hour
    }
  }

  async getAPIMetrics(startTime, endTime) {
    return await db('api_metrics')
      .whereBetween('timestamp', [startTime, endTime])
      .select(
        db.raw('AVG(response_time) as avg_response_time'),
        db.raw('MAX(response_time) as max_response_time'),
        db.raw('COUNT(*) as total_requests'),
        db.raw('COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count')
      )
      .first();
  }

  async getSystemMetrics() {
    // Collect system metrics (CPU, memory, etc.)
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  async getDatabaseMetrics() {
    const metrics = await db.raw(`
      SELECT 
        (SELECT count(*) FROM pg_stat_activity) as active_connections,
        pg_database_size(current_database()) as database_size,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_queries
    `);
    return metrics.rows[0];
  }

  async getCacheMetrics() {
    // Implement cache metrics collection
    return {};
  }

  async getErrorMetrics(startTime, endTime) {
    return await db('error_logs')
      .whereBetween('timestamp', [startTime, endTime])
      .select(
        'type',
        db.raw('COUNT(*) as count')
      )
      .groupBy('type');
  }

  async storeMetrics(metrics) {
    await db('performance_metrics').insert({
      metrics_data: metrics,
      collected_at: new Date()
    });
  }
}

module.exports = new AnalyticsService();