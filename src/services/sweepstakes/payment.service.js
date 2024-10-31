const { PLLAYError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const db = require('../../db/knex');
const walletService = require('../wallet.service');
const strikeService = require('../strike.service');

class SweepstakesPaymentService {
  async processPaidEntry(userId, sweepstakes, totalFee, trx) {
    const wallet = await walletService.getWallet(userId);
    
    if (wallet.balance < totalFee) {
      throw new PLLAYError('Insufficient funds');
    }

    // Create payment transaction
    await walletService.addTransaction(wallet.id, {
      type: 'sweepstakes_entry',
      amount: totalFee,
      status: 'completed',
      metadata: {
        sweepstakes_id: sweepstakes.id,
        entries: totalFee / sweepstakes.entry_fee
      }
    }, trx);

    // Add to escrow
    await this.addToEscrow(totalFee, sweepstakes.id, trx);
  }

  async processRefund(entryId, reason) {
    const trx = await db.transaction();

    try {
      const entry = await db('sweepstakes_entries')
        .where('id', entryId)
        .first();

      const sweepstakes = await db('sweepstakes')
        .where('id', entry.sweepstakes_id)
        .first();

      if (sweepstakes.entry_fee > 0) {
        const wallet = await walletService.getWallet(entry.user_id);
        
        // Process refund
        await walletService.addTransaction(wallet.id, {
          type: 'sweepstakes_refund',
          amount: sweepstakes.entry_fee,
          status: 'completed',
          metadata: {
            sweepstakes_id: sweepstakes.id,
            entry_id: entryId,
            reason
          }
        }, trx);

        // Remove from escrow
        await this.removeFromEscrow(sweepstakes.entry_fee, sweepstakes.id, trx);
      }

      // Mark entry as refunded
      await db('sweepstakes_entries')
        .where('id', entryId)
        .update({
          status: 'refunded',
          refund_reason: reason,
          refunded_at: new Date()
        })
        .transacting(trx);

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      logger.error('Refund processing error:', error);
      throw new PLLAYError('Failed to process refund', error);
    }
  }

  async addToEscrow(amount, sweepstakesId, trx) {
    await db('escrow_accounts')
      .where('type', 'prize_pool')
      .increment('balance', amount)
      .transacting(trx);

    await db('escrow_transactions')
      .insert({
        type: 'deposit',
        amount,
        sweepstakes_id: sweepstakesId,
        created_at: new Date()
      })
      .transacting(trx);
  }

  async removeFromEscrow(amount, sweepstakesId, trx) {
    await db('escrow_accounts')
      .where('type', 'prize_pool')
      .decrement('balance', amount)
      .transacting(trx);

    await db('escrow_transactions')
      .insert({
        type: 'withdrawal',
        amount,
        sweepstakes_id: sweepstakesId,
        created_at: new Date()
      })
      .transacting(trx);
  }
}

module.exports = new SweepstakesPaymentService();