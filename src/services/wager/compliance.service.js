const { PLLAYError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const db = require('../../db/knex');

class WagerComplianceService {
  constructor() {
    this.limits = {
      deposit: {
        daily: 1000,
        weekly: 5000,
        monthly: 20000
      },
      loss: {
        daily: 500,
        weekly: 2000,
        monthly: 8000
      },
      time: {
        daily: 4 * 60 * 60, // 4 hours
        sessionMax: 60 * 60 // 1 hour
      },
      wager: {
        min: 1,
        max: 1000
      }
    };
  }

  async validateWagerCompliance(userId, amount) {
    await Promise.all([
      this.checkResponsibleGamingLimits(userId, amount),
      this.checkSelfExclusion(userId),
      this.checkCoolingOff(userId),
      this.checkTimeLimits(userId)
    ]);
  }

  async checkResponsibleGamingLimits(userId, amount) {
    const [depositLimits, lossLimits] = await Promise.all([
      this.checkDepositLimits(userId, amount),
      this.checkLossLimits(userId, amount)
    ]);

    if (!depositLimits.allowed) {
      throw new PLLAYError(depositLimits.reason);
    }

    if (!lossLimits.allowed) {
      throw new PLLAYError(lossLimits.reason);
    }
  }

  async checkDepositLimits(userId, amount) {
    const periods = ['daily', 'weekly', 'monthly'];
    const now = new Date();

    for (const period of periods) {
      const startDate = new Date(now - this.getPeriodMilliseconds(period));
      
      const deposits = await db('transactions')
        .where('user_id', userId)
        .where('type', 'deposit')
        .where('created_at', '>', startDate)
        .sum('amount as total')
        .first();

      const total = parseFloat(deposits.total) || 0;
      if (total + amount > this.limits.deposit[period]) {
        return {
          allowed: false,
          reason: `${period} deposit limit exceeded`
        };
      }
    }

    return { allowed: true };
  }

  async checkLossLimits(userId, amount) {
    const periods = ['daily', 'weekly', 'monthly'];
    const now = new Date();

    for (const period of periods) {
      const startDate = new Date(now - this.getPeriodMilliseconds(period));
      
      const losses = await db('wager_history')
        .where('user_id', userId)
        .where('status', 'lost')
        .where('created_at', '>', startDate)
        .sum('amount as total')
        .first();

      const total = parseFloat(losses.total) || 0;
      if (total + amount > this.limits.loss[period]) {
        return {
          allowed: false,
          reason: `${period} loss limit exceeded`
        };
      }
    }

    return { allowed: true };
  }

  async checkSelfExclusion(userId) {
    const exclusion = await db('self_exclusions')
      .where('user_id', userId)
      .where('end_date', '>', new Date())
      .first();

    if (exclusion) {
      throw new PLLAYError('Account is currently self-excluded');
    }
  }

  async checkCoolingOff(userId) {
    const coolOff = await db('cooling_off_periods')
      .where('user_id', userId)
      .where('end_date', '>', new Date())
      .first();

    if (coolOff) {
      throw new PLLAYError('Account is in cooling-off period');
    }
  }

  async checkTimeLimits(userId) {
    const [dailyTime, currentSession] = await Promise.all([
      this.getDailyPlayTime(userId),
      this.getCurrentSessionTime(userId)
    ]);

    if (dailyTime >= this.limits.time.daily) {
      throw new PLLAYError('Daily play time limit reached');
    }

    if (currentSession >= this.limits.time.sessionMax) {
      throw new PLLAYError('Session time limit reached');
    }
  }

  async getDailyPlayTime(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = await db('gaming_sessions')
      .where('user_id', userId)
      .where('start_time', '>', today)
      .select('start_time', 'end_time');

    return sessions.reduce((total, session) => {
      const end = session.end_time || new Date();
      return total + (end - new Date(session.start_time)) / 1000;
    }, 0);
  }

  async getCurrentSessionTime(userId) {
    const session = await db('gaming_sessions')
      .where('user_id', userId)
      .whereNull('end_time')
      .orderBy('start_time', 'desc')
      .first();

    if (!session) return 0;

    return (new Date() - new Date(session.start_time)) / 1000;
  }

  getPeriodMilliseconds(period) {
    const periods = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    };
    return periods[period];
  }

  async generateComplianceReport(startDate, endDate) {
    const [wagerStats, limitBreaches, exclusions] = await Promise.all([
      this.getWagerStatistics(startDate, endDate),
      this.getLimitBreaches(startDate, endDate),
      this.getExclusionStats(startDate, endDate)
    ]);

    return {
      period: { startDate, endDate },
      timestamp: new Date(),
      wagerStats,
      limitBreaches,
      exclusions,
      responsibleGaming: {
        totalSelfExclusions: exclusions.length,
        averageExclusionDuration: this.calculateAverageExclusionDuration(exclusions),
        limitBreachRate: limitBreaches.length / wagerStats.totalUsers
      }
    };
  }

  async getWagerStatistics(startDate, endDate) {
    return await db('wager_history')
      .whereBetween('created_at', [startDate, endDate])
      .select(
        db.raw('COUNT(DISTINCT user_id) as total_users'),
        db.raw('COUNT(*) as total_wagers'),
        db.raw('SUM(amount) as total_wagered'),
        db.raw('AVG(amount) as average_wager'),
        db.raw('COUNT(CASE WHEN status = \'won\' THEN 1 END) as total_wins'),
        db.raw('SUM(CASE WHEN status = \'won\' THEN actual_win ELSE 0 END) as total_payouts')
      )
      .first();
  }

  async getLimitBreaches(startDate, endDate) {
    return await db('limit_breaches')
      .whereBetween('created_at', [startDate, endDate])
      .select('type', 'user_id', 'amount', 'limit_value', 'created_at');
  }

  async getExclusionStats(startDate, endDate) {
    return await db('self_exclusions')
      .whereBetween('created_at', [startDate, endDate])
      .select('user_id', 'start_date', 'end_date', 'reason');
  }

  calculateAverageExclusionDuration(exclusions) {
    if (exclusions.length === 0) return 0;

    const totalDuration = exclusions.reduce((sum, exclusion) => {
      return sum + (new Date(exclusion.end_date) - new Date(exclusion.start_date));
    }, 0);

    return totalDuration / exclusions.length / (24 * 60 * 60 * 1000); // Convert to days
  }
}

module.exports = new WagerComplianceService();