const { PLLAYError } = require('../utils/errors');
const logger = require('../utils/logger');
const db = require('../db/knex');
const { transaction } = require('objection');

class AdminService {
  async getDashboardStats() {
    try {
      const [
        userStats,
        tournamentStats,
        paymentStats,
        kycStats
      ] = await Promise.all([
        this.getUserStats(),
        this.getTournamentStats(),
        this.getPaymentStats(),
        this.getKYCStats()
      ]);

      return {
        users: userStats,
        tournaments: tournamentStats,
        payments: paymentStats,
        kyc: kycStats,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Dashboard stats error:', error);
      throw new PLLAYError('Failed to get dashboard stats', error);
    }
  }

  async getUserStats() {
    const stats = await db('users')
      .select(
        db.raw('COUNT(*) as total_users'),
        db.raw('COUNT(CASE WHEN risk_level = \'high\' THEN 1 END) as high_risk_users'),
        db.raw('COUNT(CASE WHEN created_at >= NOW() - INTERVAL \'24 hours\' THEN 1 END) as new_users_24h')
      )
      .first();

    const activeUsers = await db('user_activities')
      .where('performed_at', '>=', db.raw('NOW() - INTERVAL \'24 hours\''))
      .countDistinct('user_id as count')
      .first();

    return {
      ...stats,
      active_users_24h: activeUsers.count
    };
  }

  async getTournamentStats() {
    return await db('tournaments')
      .select(
        db.raw('COUNT(*) as total_tournaments'),
        db.raw('COUNT(CASE WHEN status = \'active\' THEN 1 END) as active_tournaments'),
        db.raw('COUNT(CASE WHEN created_at >= NOW() - INTERVAL \'24 hours\' THEN 1 END) as new_tournaments_24h')
      )
      .first();
  }

  async getPaymentStats() {
    return await db('transactions')
      .where('created_at', '>=', db.raw('NOW() - INTERVAL \'24 hours\''))
      .select(
        db.raw('COUNT(*) as total_transactions_24h'),
        db.raw('SUM(CASE WHEN type = \'deposit\' THEN amount ELSE 0 END) as total_deposits_24h'),
        db.raw('SUM(CASE WHEN type = \'withdrawal\' THEN amount ELSE 0 END) as total_withdrawals_24h'),
        db.raw('COUNT(CASE WHEN status = \'failed\' THEN 1 END) as failed_transactions_24h')
      )
      .first();
  }

  async getKYCStats() {
    return await db('kyc_verifications')
      .select(
        db.raw('COUNT(*) as total_verifications'),
        db.raw('COUNT(CASE WHEN status = \'pending\' THEN 1 END) as pending_verifications'),
        db.raw('COUNT(CASE WHEN status = \'rejected\' THEN 1 END) as rejected_verifications'),
        db.raw('COUNT(CASE WHEN created_at >= NOW() - INTERVAL \'24 hours\' THEN 1 END) as new_verifications_24h')
      )
      .first();
  }

  async manageUser(userId, action, data = {}) {
    const trx = await transaction.start(db);

    try {
      switch (action) {
        case 'suspend':
          await this.suspendUser(userId, data.reason, trx);
          break;
        case 'reinstate':
          await this.reinstateUser(userId, trx);
          break;
        case 'updateRisk':
          await this.updateUserRisk(userId, data.riskLevel, data.reason, trx);
          break;
        default:
          throw new PLLAYError('Invalid user management action');
      }

      await trx.commit();
      return await this.getUserDetails(userId);
    } catch (error) {
      await trx.rollback();
      logger.error('User management error:', error);
      throw new PLLAYError('Failed to manage user', error);
    }
  }

  async manageTournament(tournamentId, action, data = {}) {
    const trx = await transaction.start(db);

    try {
      switch (action) {
        case 'cancel':
          await this.cancelTournament(tournamentId, data.reason, trx);
          break;
        case 'pause':
          await this.pauseTournament(tournamentId, trx);
          break;
        case 'resume':
          await this.resumeTournament(tournamentId, trx);
          break;
        default:
          throw new PLLAYError('Invalid tournament management action');
      }

      await trx.commit();
      return await this.getTournamentDetails(tournamentId);
    } catch (error) {
      await trx.rollback();
      logger.error('Tournament management error:', error);
      throw new PLLAYError('Failed to manage tournament', error);
    }
  }

  async reviewKYC(verificationId, decision, notes = '') {
    const trx = await transaction.start(db);

    try {
      const [verification] = await db('kyc_verifications')
        .transacting(trx)
        .where('id', verificationId)
        .update({
          status: decision,
          reviewer_notes: notes,
          reviewed_at: new Date()
        })
        .returning('*');

      if (decision === 'approved') {
        await this.updateUserVerificationStatus(verification.user_id, true, trx);
      }

      await trx.commit();
      return verification;
    } catch (error) {
      await trx.rollback();
      logger.error('KYC review error:', error);
      throw new PLLAYError('Failed to review KYC', error);
    }
  }

  // Private methods
  async suspendUser(userId, reason, trx) {
    await db('users')
      .transacting(trx)
      .where('id', userId)
      .update({
        status: 'suspended',
        suspended_at: new Date(),
        suspension_reason: reason
      });
  }

  async reinstateUser(userId, trx) {
    await db('users')
      .transacting(trx)
      .where('id', userId)
      .update({
        status: 'active',
        suspended_at: null,
        suspension_reason: null
      });
  }

  async updateUserRisk(userId, riskLevel, reason, trx) {
    await db('users')
      .transacting(trx)
      .where('id', userId)
      .update({
        risk_level: riskLevel,
        risk_updated_at: new Date()
      });

    await db('risk_assessments')
      .transacting(trx)
      .insert({
        user_id: userId,
        risk_level: riskLevel,
        reason,
        assessed_at: new Date()
      });
  }

  async cancelTournament(tournamentId, reason, trx) {
    await db('tournaments')
      .transacting(trx)
      .where('id', tournamentId)
      .update({
        status: 'cancelled',
        cancelled_at: new Date(),
        cancellation_reason: reason
      });

    // Process refunds if necessary
    await this.processTournamentRefunds(tournamentId, trx);
  }

  async pauseTournament(tournamentId, trx) {
    await db('tournaments')
      .transacting(trx)
      .where('id', tournamentId)
      .update({
        status: 'paused',
        paused_at: new Date()
      });
  }

  async resumeTournament(tournamentId, trx) {
    await db('tournaments')
      .transacting(trx)
      .where('id', tournamentId)
      .update({
        status: 'active',
        paused_at: null
      });
  }

  async processTournamentRefunds(tournamentId, trx) {
    const participants = await db('tournament_participants')
      .transacting(trx)
      .where('tournament_id', tournamentId)
      .select('user_id');

    for (const participant of participants) {
      await this.refundParticipant(tournamentId, participant.user_id, trx);
    }
  }

  async refundParticipant(tournamentId, userId, trx) {
    // Implement refund logic
  }

  async updateUserVerificationStatus(userId, verified, trx) {
    await db('users')
      .transacting(trx)
      .where('id', userId)
      .update({
        is_verified: verified,
        verified_at: verified ? new Date() : null
      });
  }
}

module.exports = new AdminService();