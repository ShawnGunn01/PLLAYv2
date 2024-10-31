const { PLLAYError } = require('../utils/errors');
const logger = require('../utils/logger');
const db = require('../db/knex');
const { transaction } = require('objection');

class ComplianceService {
  async generateComplianceReport(startDate, endDate) {
    try {
      const report = await db.transaction(async trx => {
        const kycStats = await this.getKYCStats(startDate, endDate, trx);
        const amlStats = await this.getAMLStats(startDate, endDate, trx);
        const riskAssessments = await this.getRiskAssessments(startDate, endDate, trx);
        const suspiciousActivities = await this.getSuspiciousActivities(startDate, endDate, trx);

        return {
          period: { startDate, endDate },
          timestamp: new Date().toISOString(),
          kycStats,
          amlStats,
          riskAssessments,
          suspiciousActivities
        };
      });

      await this.saveComplianceReport(report);
      return report;
    } catch (error) {
      logger.error('Compliance report generation error:', error);
      throw new PLLAYError('Failed to generate compliance report', error);
    }
  }

  async getKYCStats(startDate, endDate, trx) {
    const stats = await db('kyc_verifications')
      .transacting(trx)
      .whereBetween('created_at', [startDate, endDate])
      .select(
        db.raw('COUNT(*) as total_verifications'),
        db.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed_verifications'),
        db.raw('COUNT(CASE WHEN status = \'failed\' THEN 1 END) as failed_verifications'),
        db.raw('AVG(EXTRACT(EPOCH FROM (verified_at - created_at))/3600) as avg_completion_time')
      )
      .first();

    return stats;
  }

  async getAMLStats(startDate, endDate, trx) {
    const stats = await db('watchlist_screenings')
      .transacting(trx)
      .whereBetween('created_at', [startDate, endDate])
      .select(
        db.raw('COUNT(*) as total_screenings'),
        db.raw('COUNT(CASE WHEN status = \'flagged\' THEN 1 END) as flagged_screenings'),
        db.raw('COUNT(CASE WHEN hits IS NOT NULL THEN 1 END) as screenings_with_hits')
      )
      .first();

    return stats;
  }

  async getRiskAssessments(startDate, endDate, trx) {
    return await db('risk_assessments')
      .transacting(trx)
      .whereBetween('created_at', [startDate, endDate])
      .select(
        'risk_level',
        db.raw('COUNT(*) as count')
      )
      .groupBy('risk_level');
  }

  async getSuspiciousActivities(startDate, endDate, trx) {
    return await db('suspicious_activities')
      .transacting(trx)
      .whereBetween('detected_at', [startDate, endDate])
      .select(
        'type',
        'severity',
        'status',
        'detected_at',
        'resolved_at'
      )
      .orderBy('detected_at', 'desc');
  }

  async saveComplianceReport(report) {
    await db('compliance_reports').insert({
      report_data: report,
      generated_at: new Date(),
      period_start: report.period.startDate,
      period_end: report.period.endDate
    });
  }

  async flagSuspiciousActivity(userId, {
    type,
    severity,
    details
  }) {
    try {
      const [activity] = await db('suspicious_activities')
        .insert({
          user_id: userId,
          type,
          severity,
          details,
          status: 'pending',
          detected_at: new Date()
        })
        .returning('*');

      // Notify compliance team
      await this.notifyComplianceTeam(activity);

      return activity;
    } catch (error) {
      logger.error('Flag suspicious activity error:', error);
      throw new PLLAYError('Failed to flag suspicious activity', error);
    }
  }

  async updateRiskLevel(userId, riskLevel, reason) {
    const trx = await transaction.start(db);

    try {
      // Update user's risk level
      await db('users')
        .transacting(trx)
        .where('id', userId)
        .update({
          risk_level: riskLevel,
          risk_updated_at: new Date()
        });

      // Create risk assessment record
      const [assessment] = await db('risk_assessments')
        .transacting(trx)
        .insert({
          user_id: userId,
          risk_level: riskLevel,
          reason,
          assessed_at: new Date()
        })
        .returning('*');

      await trx.commit();
      return assessment;
    } catch (error) {
      await trx.rollback();
      logger.error('Risk level update error:', error);
      throw new PLLAYError('Failed to update risk level', error);
    }
  }

  async notifyComplianceTeam(activity) {
    // Implement notification logic (email, Slack, etc.)
    logger.info('Suspicious activity detected:', activity);
  }
}

module.exports = new ComplianceService();