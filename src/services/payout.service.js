const { PLLAYError } = require('../utils/errors');
const logger = require('../utils/logger');
const db = require('../db/knex');
const { transaction } = require('objection');
const walletService = require('./wallet.service');

class PayoutService {
  async requestPayout(userId, {
    amount,
    payoutMethod,
    payoutDetails
  }) {
    const trx = await transaction.start(db);

    try {
      // Get user's wallet
      const wallet = await walletService.getWallet(userId);
      
      // Verify sufficient balance
      if (wallet.balance < amount) {
        throw new PLLAYError('Insufficient balance');
      }

      // Create payout request
      const [payout] = await db('payouts')
        .transacting(trx)
        .insert({
          user_id: userId,
          amount,
          status: 'pending',
          payout_method: payoutMethod,
          payout_details: payoutDetails
        })
        .returning('*');

      // Create pending withdrawal transaction
      await walletService.addTransaction(wallet.id, {
        type: 'withdrawal',
        amount,
        status: 'pending',
        paymentMethod: payoutMethod,
        metadata: {
          payout_id: payout.id
        }
      });

      await trx.commit();
      return payout;
    } catch (error) {
      await trx.rollback();
      logger.error('Payout request error:', error);
      throw new PLLAYError('Failed to request payout', error);
    }
  }

  async processPayout(payoutId, {
    approved,
    transactionId = null,
    reason = null
  }) {
    const trx = await transaction.start(db);

    try {
      const payout = await db('payouts')
        .where('id', payoutId)
        .first();

      if (!payout || payout.status !== 'pending') {
        throw new PLLAYError('Invalid payout request');
      }

      const status = approved ? 'completed' : 'failed';
      const [updatedPayout] = await db('payouts')
        .transacting(trx)
        .where('id', payoutId)
        .update({
          status,
          transaction_id: transactionId,
          processed_at: new Date(),
          payout_details: {
            ...payout.payout_details,
            reason
          }
        })
        .returning('*');

      // Update corresponding transaction
      const transaction = await db('transactions')
        .where({
          type: 'withdrawal',
          status: 'pending',
          'metadata->payout_id': payoutId
        })
        .first();

      if (transaction) {
        await walletService.updateTransactionStatus(transaction.id, status);
      }

      await trx.commit();
      return updatedPayout;
    } catch (error) {
      await trx.rollback();
      logger.error('Process payout error:', error);
      throw new PLLAYError('Failed to process payout', error);
    }
  }

  async getPayoutHistory(userId, options = {}) {
    try {
      const query = db('payouts')
        .where('user_id', userId)
        .orderBy('created_at', 'desc');

      if (options.status) {
        query.where('status', options.status);
      }

      if (options.payoutMethod) {
        query.where('payout_method', options.payoutMethod);
      }

      if (options.startDate) {
        query.where('created_at', '>=', options.startDate);
      }

      if (options.endDate) {
        query.where('created_at', '<=', options.endDate);
      }

      if (options.limit) {
        query.limit(options.limit);
      }

      if (options.offset) {
        query.offset(options.offset);
      }

      return await query;
    } catch (error) {
      logger.error('Get payout history error:', error);
      throw new PLLAYError('Failed to get payout history', error);
    }
  }

  async getPayoutStats(userId) {
    try {
      const stats = await db('payouts')
        .where('user_id', userId)
        .select(
          db.raw('COUNT(*) as total_payouts'),
          db.raw('SUM(CASE WHEN status = \'completed\' THEN amount ELSE 0 END) as total_paid'),
          db.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as successful_payouts'),
          db.raw('COUNT(CASE WHEN status = \'failed\' THEN 1 END) as failed_payouts'),
          db.raw('MAX(amount) as largest_payout')
        )
        .first();

      return stats;
    } catch (error) {
      logger.error('Get payout stats error:', error);
      throw new PLLAYError('Failed to get payout stats', error);
    }
  }
}

module.exports = new PayoutService();