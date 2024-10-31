const { PLLAYError } = require('../utils/errors');
const logger = require('../utils/logger');
const db = require('../db/knex');
const { transaction } = require('objection');
const walletService = require('./wallet.service');

class WagerService {
  async getWagerStats(userId) {
    try {
      let stats = await db('wager_stats')
        .where('user_id', userId)
        .first();

      if (!stats) {
        stats = await this.initializeWagerStats(userId);
      }

      return stats;
    } catch (error) {
      logger.error('Get wager stats error:', error);
      throw new PLLAYError('Failed to get wager stats', error);
    }
  }

  async createWager(userId, {
    gameId,
    amount,
    gameData = {}
  }) {
    const trx = await transaction.start(db);

    try {
      // Get user's wallet
      const wallet = await walletService.getWallet(userId);
      
      // Verify sufficient balance
      if (wallet.balance < amount) {
        throw new PLLAYError('Insufficient balance');
      }

      // Create wager record
      const [wager] = await db('wager_history')
        .transacting(trx)
        .insert({
          user_id: userId,
          game_id: gameId,
          amount,
          status: 'active',
          potential_win: amount * 2, // Example multiplier
          game_data: gameData
        })
        .returning('*');

      // Create transaction for wager amount
      await walletService.addTransaction(wallet.id, {
        type: 'wager',
        amount,
        status: 'completed',
        metadata: {
          wager_id: wager.id,
          game_id: gameId
        }
      });

      await trx.commit();
      return wager;
    } catch (error) {
      await trx.rollback();
      logger.error('Create wager error:', error);
      throw new PLLAYError('Failed to create wager', error);
    }
  }

  async completeWager(wagerId, {
    won,
    actualWin,
    gameData = {}
  }) {
    const trx = await transaction.start(db);

    try {
      // Get wager details
      const wager = await db('wager_history')
        .where('id', wagerId)
        .first();

      if (!wager || wager.status !== 'active') {
        throw new PLLAYError('Invalid wager');
      }

      // Update wager record
      const [updatedWager] = await db('wager_history')
        .transacting(trx)
        .where('id', wagerId)
        .update({
          status: won ? 'won' : 'lost',
          actual_win: actualWin,
          game_data: {
            ...wager.game_data,
            ...gameData
          },
          completed_at: new Date()
        })
        .returning('*');

      // Update user's wallet if won
      if (won) {
        const wallet = await walletService.getWallet(wager.user_id);
        await walletService.addTransaction(wallet.id, {
          type: 'winning',
          amount: actualWin,
          status: 'completed',
          metadata: {
            wager_id: wagerId,
            game_id: wager.game_id
          }
        });
      }

      // Update wager stats
      await this.updateWagerStats(wager.user_id, {
        won,
        amount: wager.amount,
        winAmount: actualWin
      }, trx);

      await trx.commit();
      return updatedWager;
    } catch (error) {
      await trx.rollback();
      logger.error('Complete wager error:', error);
      throw new PLLAYError('Failed to complete wager', error);
    }
  }

  async getWagerHistory(userId, options = {}) {
    try {
      const query = db('wager_history')
        .where('user_id', userId)
        .orderBy('created_at', 'desc');

      if (options.status) {
        query.where('status', options.status);
      }

      if (options.gameId) {
        query.where('game_id', options.gameId);
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
      logger.error('Get wager history error:', error);
      throw new PLLAYError('Failed to get wager history', error);
    }
  }

  // Private methods
  async initializeWagerStats(userId) {
    const [stats] = await db('wager_stats')
      .insert({
        user_id: userId
      })
      .returning('*');

    return stats;
  }

  async updateWagerStats(userId, {
    won,
    amount,
    winAmount
  }, trx) {
    const updates = {
      total_wagers: db.raw('total_wagers + 1'),
      total_wagered: db.raw('total_wagered + ?', [amount])
    };

    if (won) {
      updates.wagers_won = db.raw('wagers_won + 1');
      updates.total_won = db.raw('total_won + ?', [winAmount]);
      updates.biggest_win = db.raw('GREATEST(biggest_win, ?)', [winAmount]);
    } else {
      updates.wagers_lost = db.raw('wagers_lost + 1');
      updates.total_lost = db.raw('total_lost + ?', [amount]);
      updates.biggest_loss = db.raw('GREATEST(biggest_loss, ?)', [amount]);
    }

    // Update win rate
    updates.win_rate = db.raw(`
      CASE 
        WHEN total_wagers + 1 > 0 
        THEN ROUND(((wagers_won + ?) * 100.0) / (total_wagers + 1), 2)
        ELSE 0 
      END
    `, [won ? 1 : 0]);

    await db('wager_stats')
      .transacting(trx)
      .where('user_id', userId)
      .update(updates);
  }
}

module.exports = new WagerService();