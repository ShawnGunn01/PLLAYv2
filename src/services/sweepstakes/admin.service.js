const { PLLAYError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const db = require('../../db/knex');
const { transaction } = require('objection');
const paymentService = require('./payment.service');

class SweepstakesAdminService {
  async cancelSweepstakes(sweepstakesId, reason) {
    const trx = await transaction.start(db);

    try {
      const sweepstakes = await db('sweepstakes')
        .where('id', sweepstakesId)
        .first();

      if (!sweepstakes || sweepstakes.status !== 'active') {
        throw new PLLAYError('Invalid sweepstakes for cancellation');
      }

      // Process refunds for all entries
      const entries = await db('sweepstakes_entries')
        .where('sweepstakes_id', sweepstakesId)
        .whereNot('status', 'refunded')
        .select();

      for (const entry of entries) {
        await paymentService.processRefund(entry.id, reason);
      }

      // Update sweepstakes status
      await db('sweepstakes')
        .where('id', sweepstakesId)
        .update({
          status: 'cancelled',
          cancelled_at: new Date(),
          cancellation_reason: reason
        })
        .transacting(trx);

      // Log cancellation
      await db('admin_actions')
        .insert({
          action_type: 'sweepstakes_cancelled',
          target_type: 'sweepstakes',
          target_id: sweepstakesId,
          reason,
          created_at: new Date()
        })
        .transacting(trx);

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      logger.error('Sweepstakes cancellation error:', error);
      throw new PLLAYError('Failed to cancel sweepstakes', error);
    }
  }

  async modifySweepstakes(sweepstakesId, updates) {
    const trx = await transaction.start(db);

    try {
      const sweepstakes = await db('sweepstakes')
        .where('id', sweepstakesId)
        .first();

      if (!sweepstakes || sweepstakes.status !== 'active') {
        throw new PLLAYError('Invalid sweepstakes for modification');
      }

      // Validate modifications
      if (updates.end_date && new Date(updates.end_date) <= new Date()) {
        throw new PLLAYError('End date must be in the future');
      }

      if (updates.prize_pool && updates.prize_pool < sweepstakes.prize_pool) {
        throw new PLLAYError('Cannot decrease prize pool');
      }

      // Update sweepstakes
      await db('sweepstakes')
        .where('id', sweepstakesId)
        .update({
          ...updates,
          updated_at: new Date()
        })
        .transacting(trx);

      // Log modification
      await db('admin_actions')
        .insert({
          action_type: 'sweepstakes_modified',
          target_type: 'sweepstakes',
          target_id: sweepstakesId,
          changes: updates,
          created_at: new Date()
        })
        .transacting(trx);

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      logger.error('Sweepstakes modification error:', error);
      throw new PLLAYError('Failed to modify sweepstakes', error);
    }
  }

  async generateComplianceReport(sweepstakesId, reportType) {
    try {
      const sweepstakes = await db('sweepstakes')
        .where('id', sweepstakesId)
        .first();

      if (!sweepstakes) {
        throw new PLLAYError('Sweepstakes not found');
      }

      let reportData;
      switch (reportType) {
        case 'winners':
          reportData = await this.generateWinnersReport(sweepstakesId);
          break;
        case 'entries':
          reportData = await this.generateEntriesReport(sweepstakesId);
          break;
        case 'tax':
          reportData = await this.generateTaxReport(sweepstakesId);
          break;
        default:
          throw new PLLAYError('Invalid report type');
      }

      // Log report generation
      await db('admin_actions').insert({
        action_type: 'report_generated',
        target_type: 'sweepstakes',
        target_id: sweepstakesId,
        metadata: { reportType },
        created_at: new Date()
      });

      return reportData;
    } catch (error) {
      logger.error('Report generation error:', error);
      throw new PLLAYError('Failed to generate report', error);
    }
  }

  async generateWinnersReport(sweepstakesId) {
    const winners = await db('sweepstakes_winners')
      .join('users', 'sweepstakes_winners.user_id', 'users.id')
      .where('sweepstakes_id', sweepstakesId)
      .select(
        'users.full_name',
        'users.email',
        'users.address',
        'sweepstakes_winners.prize_rank',
        'sweepstakes_winners.prize_amount',
        'sweepstakes_winners.created_at as won_at'
      );

    return {
      type: 'winners',
      timestamp: new Date(),
      data: winners
    };
  }

  async generateEntriesReport(sweepstakesId) {
    const entries = await db('sweepstakes_entries')
      .join('users', 'sweepstakes_entries.user_id', 'users.id')
      .where('sweepstakes_id', sweepstakesId)
      .select(
        'users.full_name',
        'users.email',
        'users.ip_address',
        'sweepstakes_entries.entry_number',
        'sweepstakes_entries.created_at as entered_at'
      );

    return {
      type: 'entries',
      timestamp: new Date(),
      data: entries
    };
  }

  async generateTaxReport(sweepstakesId) {
    const winners = await db('sweepstakes_winners')
      .join('users', 'sweepstakes_winners.user_id', 'users.id')
      .where('sweepstakes_id', sweepstakesId)
      .where('prize_amount', '>=', 600)
      .select(
        'users.full_name',
        'users.tax_id',
        'users.address',
        'sweepstakes_winners.prize_amount',
        'sweepstakes_winners.created_at as won_at'
      );

    return {
      type: 'tax',
      timestamp: new Date(),
      data: winners.map(winner => ({
        ...winner,
        form: '1099-MISC',
        year: new Date(winner.won_at).getFullYear()
      }))
    };
  }
}

module.exports = new SweepstakesAdminService();