const { PLLAYError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const db = require('../../db/knex');

class WagerRiskService {
  constructor() {
    this.riskThresholds = {
      maxExposurePerGame: 100000,
      maxExposurePerUser: 10000,
      maxWinningsPerDay: 25000,
      suspiciousWinRate: 0.80,
      rapidWagerThreshold: 10, // wagers per hour
      unusualPatternThreshold: 0.95
    };
  }

  async validateWagerRisk(userId, gameId, amount) {
    await Promise.all([
      this.checkExposureLimits(userId, gameId, amount),
      this.checkUserRiskProfile(userId),
      this.checkGameRiskProfile(gameId),
      this.checkCollusion(userId, gameId)
    ]);
  }

  async checkExposureLimits(userId, gameId, amount) {
    const [gameExposure, userExposure] = await Promise.all([
      this.calculateGameExposure(gameId),
      this.calculateUserExposure(userId)
    ]);

    if (gameExposure + amount > this.riskThresholds.maxExposurePerGame) {
      throw new PLLAYError('Game exposure limit exceeded');
    }

    if (userExposure + amount > this.riskThresholds.maxExposurePerUser) {
      throw new PLLAYError('User exposure limit exceeded');
    }
  }

  async checkUserRiskProfile(userId) {
    const [winRate, rapidWagers, unusualPatterns] = await Promise.all([
      this.calculateWinRate(userId),
      this.checkRapidWagers(userId),
      this.detectUnusualPatterns(userId)
    ]);

    if (winRate > this.riskThresholds.suspiciousWinRate) {
      await this.flagSuspiciousActivity(userId, 'high_win_rate', { winRate });
    }

    if (rapidWagers) {
      await this.flagSuspiciousActivity(userId, 'rapid_wagers', { wagerCount: rapidWagers });
    }

    if (unusualPatterns) {
      await this.flagSuspiciousActivity(userId, 'unusual_patterns', { patterns: unusualPatterns });
    }
  }

  async checkGameRiskProfile(gameId) {
    const [volatility, profitability] = await Promise.all([
      this.calculateGameVolatility(gameId),
      this.calculateGameProfitability(gameId)
    ]);

    if (volatility > 0.7) {
      await this.adjustGameOdds(gameId, volatility);
    }

    if (profitability < -0.1) {
      await this.flagGameRisk(gameId, 'negative_profitability', { profitability });
    }
  }

  async checkCollusion(userId, gameId) {
    const collusionIndicators = await Promise.all([
      this.checkIPAddressPatterns(userId),
      this.checkDevicePatterns(userId),
      this.checkPlayerInteractions(userId, gameId)
    ]);

    if (collusionIndicators.some(indicator => indicator)) {
      await this.flagSuspiciousActivity(userId, 'potential_collusion', { 
        indicators: collusionIndicators 
      });
    }
  }

  async calculateWinRate(userId) {
    const stats = await db('wager_stats')
      .where('user_id', userId)
      .first();
    
    return stats ? stats.wagers_won / stats.total_wagers : 0;
  }

  async checkRapidWagers(userId) {
    const recentWagers = await db('wager_history')
      .where('user_id', userId)
      .where('created_at', '>', new Date(Date.now() - 3600000))
      .count('id as count')
      .first();

    return parseInt(recentWagers.count);
  }

  async detectUnusualPatterns(userId) {
    const patterns = [];
    const wagers = await db('wager_history')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(100);

    // Check for consistent win amounts
    const winAmounts = wagers
      .filter(w => w.status === 'won')
      .map(w => w.actual_win);
    
    if (this.hasUniformDistribution(winAmounts)) {
      patterns.push('uniform_wins');
    }

    // Check for timing patterns
    const wagerTimes = wagers.map(w => new Date(w.created_at).getMinutes());
    if (this.hasUniformDistribution(wagerTimes)) {
      patterns.push('uniform_timing');
    }

    return patterns;
  }

  hasUniformDistribution(values) {
    if (values.length < 5) return false;

    const frequencies = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    const maxFreq = Math.max(...Object.values(frequencies));
    return maxFreq / values.length > this.riskThresholds.unusualPatternThreshold;
  }

  async calculateGameVolatility(gameId) {
    const results = await db('wager_history')
      .where('game_id', gameId)
      .where('created_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
      .select('amount', 'actual_win', 'status');

    if (results.length === 0) return 0;

    const outcomes = results.map(r => r.status === 'won' ? r.actual_win / r.amount : -1);
    return this.calculateStandardDeviation(outcomes);
  }

  calculateStandardDeviation(values) {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  async adjustGameOdds(gameId, volatility) {
    const adjustmentFactor = Math.max(0.8, 1 - volatility);
    
    await db('games')
      .where('id', gameId)
      .update({
        odds_multiplier: adjustmentFactor,
        updated_at: new Date()
      });
  }

  async flagSuspiciousActivity(userId, type, details) {
    await db('suspicious_activities').insert({
      user_id: userId,
      type,
      severity: this.calculateSeverity(type, details),
      details,
      status: 'pending',
      detected_at: new Date()
    });
  }

  calculateSeverity(type, details) {
    const severityMap = {
      high_win_rate: details.winRate > 0.9 ? 'high' : 'medium',
      rapid_wagers: details.wagerCount > 20 ? 'high' : 'medium',
      unusual_patterns: details.patterns.length > 2 ? 'high' : 'medium',
      potential_collusion: 'high'
    };

    return severityMap[type] || 'medium';
  }
}

module.exports = new WagerRiskService();