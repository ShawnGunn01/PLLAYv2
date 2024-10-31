const { PLLAYError } = require('../utils/errors');
const logger = require('../utils/logger');
const db = require('../db/knex');
const { transaction } = require('objection');

class WalletService {
  async getWallet(userId) {
    try {
      const wallet = await db('wallets')
        .where('user_id', userId)
        .first();

      if (!wallet) {
        return this.createWallet(userId);
      }

      return wallet;
    } catch (error) {
      logger.error('Get wallet error:', error);
      throw new PLLAYError('Failed to get wallet', error);
    }
  }

  async createWallet(userId) {
    try {
      const [wallet] = await db('wallets')
        .insert({
          user_id: userId,
          balance: 0,
          pending_balance: 0
        })
        .returning('*');

      return wallet;
    } catch (error) {
      logger.error('Create wallet error:', error);
      throw new PLLAYError('Failed to create wallet', error);
    }
  }

  async addTransaction(walletId, {
    type,
    amount,
    status = 'pending',
    paymentMethod,
    paymentId,
    metadata = {}
  }) {
    const trx = await transaction.start(db);

    try {
      // Create transaction record
      const [transaction] = await db('transactions')
        .transacting(trx)
        .insert({
          wallet_id: walletId,
          type,
          amount,
          status,
          payment_method: paymentMethod,
          payment_id: paymentId,
          metadata
        })
        .returning('*');

      // Update wallet balances
      if (status === 'completed') {
        await this.updateWalletBalance(walletId, type, amount, trx);
      } else if (status === 'pending') {
        await this.updatePendingBalance(walletId, type, amount, trx);
      }

      await trx.commit();
      return transaction;
    } catch (error) {
      await trx.rollback();
      logger.error('Add transaction error:', error);
      throw new PLLAYError('Failed to add transaction', error);
    }
  }

  async updateTransactionStatus(transactionId, status) {
    const trx = await transaction.start(db);

    try {
      const [updatedTransaction] = await db('transactions')
        .transacting(trx)
        .where('id', transactionId)
        .update({
          status,
          processed_at: status === 'completed' ? new Date() : null
        })
        .returning('*');

      if (status === 'completed') {
        await this.updateWalletBalance(
          updatedTransaction.wallet_id,
          updatedTransaction.type,
          updatedTransaction.amount,
          trx
        );
      }

      await trx.commit();
      return updatedTransaction;
    } catch (error) {
      await trx.rollback();
      logger.error('Update transaction status error:', error);
      throw new PLLAYError('Failed to update transaction status', error);
    }
  }

  async getTransactionHistory(userId, options = {}) {
    try {
      const query = db('transactions')
        .join('wallets', 'transactions.wallet_id', 'wallets.id')
        .where('wallets.user_id', userId)
        .select('transactions.*')
        .orderBy('transactions.created_at', 'desc');

      if (options.type) {
        query.where('type', options.type);
      }

      if (options.status) {
        query.where('status', options.status);
      }

      if (options.startDate) {
        query.where('transactions.created_at', '>=', options.startDate);
      }

      if (options.endDate) {
        query.where('transactions.created_at', '<=', options.endDate);
      }

      if (options.limit) {
        query.limit(options.limit);
      }

      if (options.offset) {
        query.offset(options.offset);
      }

      return await query;
    } catch (error) {
      logger.error('Get transaction history error:', error);
      throw new PLLAYError('Failed to get transaction history', error);
    }
  }

  // Private methods
  async updateWalletBalance(walletId, type, amount, trx) {
    const updateData = {};

    switch (type) {
      case 'deposit':
        updateData.balance = db.raw('balance + ?', [amount]);
        updateData.lifetime_deposits = db.raw('lifetime_deposits + ?', [amount]);
        break;
      case 'withdrawal':
        updateData.balance = db.raw('balance - ?', [amount]);
        updateData.lifetime_withdrawals = db.raw('lifetime_withdrawals + ?', [amount]);
        break;
      case 'wager':
        updateData.balance = db.raw('balance - ?', [amount]);
        break;
      case 'winning':
        updateData.balance = db.raw('balance + ?', [amount]);
        updateData.lifetime_winnings = db.raw('lifetime_winnings + ?', [amount]);
        break;
    }

    await db('wallets')
      .transacting(trx)
      .where('id', walletId)
      .update(updateData);
  }

  async updatePendingBalance(walletId, type, amount, trx) {
    if (['deposit', 'withdrawal'].includes(type)) {
      await db('wallets')
        .transacting(trx)
        .where('id', walletId)
        .update({
          pending_balance: db.raw('pending_balance + ?', [amount])
        });
    }
  }
}

module.exports = new WalletService();