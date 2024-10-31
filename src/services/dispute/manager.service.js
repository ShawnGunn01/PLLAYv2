const { PLLAYError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const db = require('../../db/knex');
const { transaction } = require('objection');

class DisputeManager {
  constructor() {
    this.disputeWindow = 7 * 24 * 60 * 60 * 1000; // 7 days
    this.evidenceTypes = ['replay', 'chat_logs', 'screenshots', 'server_logs'];
    this.maxEvidenceSize = 10 * 1024 * 1024; // 10MB
  }

  async createDispute(userId, wagerId, reason, evidence) {
    const trx = await transaction.start(db);

    try {
      const wager = await db('wager_history')
        .where('id', wagerId)
        .first();

      if (!wager) {
        throw new PLLAYError('Wager not found');
      }

      // Check dispute window
      if (!this.isWithinDisputeWindow(wager.created_at)) {
        throw new PLLAYError('Dispute window has expired');
      }

      // Validate evidence
      await this.validateEvidence(evidence);

      // Create dispute record
      const [dispute] = await db('disputes')
        .transacting(trx)
        .insert({
          user_id: userId,
          wager_id: wagerId,
          reason,
          status: 'pending',
          created_at: new Date()
        })
        .returning('*');

      // Store evidence
      await this.storeEvidence(dispute.id, evidence, trx);

      // Freeze wager
      await db('wager_history')
        .transacting(trx)
        .where('id', wagerId)
        .update({
          status: 'disputed',
          updated_at: new Date()
        });

      await trx.commit();
      return dispute;
    } catch (error) {
      await trx.rollback();
      logger.error('Dispute creation error:', error);
      throw new PLLAYError('Failed to create dispute', error);
    }
  }

  async resolveDispute(disputeId, resolution, notes) {
    const trx = await transaction.start(db);

    try {
      const dispute = await db('disputes')
        .where('id', disputeId)
        .first();

      if (!dispute) {
        throw new PLLAYError('Dispute not found');
      }

      // Update dispute status
      await db('disputes')
        .transacting(trx)
        .where('id', disputeId)
        .update({
          status: 'resolved',
          resolution,
          resolution_notes: notes,
          resolved_at: new Date()
        });

      // Handle wager based on resolution
      await this.handleDisputeResolution(dispute, resolution, trx);

      // Notify parties
      await this.notifyDisputeResolution(dispute, resolution);

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      logger.error('Dispute resolution error:', error);
      throw new PLLAYError('Failed to resolve dispute', error);
    }
  }

  async collectEvidence(wagerId) {
    try {
      const evidence = {
        replay: await this.getGameReplay(wagerId),
        chatLogs: await this.getChatLogs(wagerId),
        serverLogs: await this.getServerLogs(wagerId),
        systemEvents: await this.getSystemEvents(wagerId)
      };

      await db('dispute_evidence').insert({
        wager_id: wagerId,
        evidence_data: evidence,
        collected_at: new Date()
      });

      return evidence;
    } catch (error) {
      logger.error('Evidence collection error:', error);
      throw new PLLAYError('Failed to collect evidence', error);
    }
  }

  private async validateEvidence(evidence) {
    if (!evidence || typeof evidence !== 'object') {
      throw new PLLAYError('Invalid evidence format');
    }

    for (const [type, data] of Object.entries(evidence)) {
      if (!this.evidenceTypes.includes(type)) {
        throw new PLLAYError(`Invalid evidence type: ${type}`);
      }

      if (this.getDataSize(data) > this.maxEvidenceSize) {
        throw new PLLAYError(`Evidence size exceeds limit for type: ${type}`);
      }
    }
  }

  private async handleDisputeResolution(dispute, resolution, trx) {
    const wager = await db('wager_history')
      .where('id', dispute.wager_id)
      .first();

    switch (resolution) {
      case 'upheld':
        // Refund wager
        await this.processRefund(wager, trx);
        break;
      case 'denied':
        // Restore original wager status
        await db('wager_history')
          .transacting(trx)
          .where('id', wager.id)
          .update({
            status: wager.original_status,
            updated_at: new Date()
          });
        break;
      case 'partial':
        // Process partial refund
        await this.processPartialRefund(wager, trx);
        break;
    }
  }

  private async processRefund(wager, trx) {
    // Implement refund logic
  }

  private async processPartialRefund(wager, trx) {
    // Implement partial refund logic
  }

  private isWithinDisputeWindow(timestamp) {
    return Date.now() - new Date(timestamp).getTime() <= this.disputeWindow;
  }

  private getDataSize(data) {
    return Buffer.from(JSON.stringify(data)).length;
  }

  private async notifyDisputeResolution(dispute, resolution) {
    // Implement notification logic
  }

  private async getGameReplay(wagerId) {
    // Implement replay retrieval
  }

  private async getChatLogs(wagerId) {
    // Implement chat log retrieval
  }

  private async getServerLogs(wagerId) {
    // Implement server log retrieval
  }

  private async getSystemEvents(wagerId) {
    // Implement system event retrieval
  }
}

module.exports = new DisputeManager();