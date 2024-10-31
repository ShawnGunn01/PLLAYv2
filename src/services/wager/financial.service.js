const { PLLAYError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const db = require('../../db/knex');
const { transaction } = require('objection');

class WagerFinancialService {
  constructor() {
    this.supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
    this.exchangeRateRefreshInterval = 3600000; // 1 hour
    this.lastExchangeRateUpdate = 0;
    this.exchangeRates = new Map();
  }

  async processWagerTransaction(userId, amount, currency = 'USD') {
    const trx = await transaction.start(db);

    try {
      if (!this.supportedCurrencies.includes(currency)) {
        throw new PLLAYError('Unsupported currency');
      }

      // Convert to USD if necessary
      const usdAmount = await this.convertToUSD(amount, currency);

      // Create escrow transaction
      await this.createEscrowTransaction(userId, usdAmount, trx);

      // Create wager transaction
      const wagerTx = await this.createWagerTransaction(userId, usdAmount, currency, trx);

      // Update user balance
      await this.updateUserBalance(userId, -usdAmount, trx);

      await trx.commit();
      return wagerTx;
    } catch (error) {
      await trx.rollback();
      logger.error('Wager transaction error:', error);
      throw new PLLAYError('Failed to process wager transaction', error);
    }
  }

  async processWinningTransaction(userId, amount, currency = 'USD') {
    const trx = await transaction.start(db);

    try {
      const usdAmount = await this.convertToUSD(amount, currency);

      // Release from escrow
      await this.releaseFromEscrow(userId, usdAmount, trx);

      // Create winning transaction
      const winningTx = await this.createWinningTransaction(userId, usdAmount, currency, trx);

      // Update user balance
      await this.updateUserBalance(userId, usdAmount, trx);

      // Update progressive jackpot if applicable
      await this.updateProgressiveJackpot(usdAmount, trx);

      await trx.commit();
      return winningTx;
    } catch (error) {
      await trx.rollback();
      logger.error('Winning transaction error:', error);
      throw new PLLAYError('Failed to process winning transaction', error);
    }
  }

  async handleChargeback(transactionId) {
    const trx = await transaction.start(db);

    try {
      const transaction = await db('transactions')
        .where('id', transactionId)
        .first();

      if (!transaction) {
        throw new PLLAYError('Transaction not found');
      }

      // Create chargeback record
      await db('chargebacks')
        .transacting(trx)
        .insert({
          transaction_id: transactionId,
          amount: transaction.amount,
          status: 'pending',
          created_at: new Date()
        });

      // Update transaction status
      await db('transactions')
        .transacting(trx)
        .where('id', transactionId)
        .update({
          status: 'chargeback_pending',
          updated_at: new Date()
        });

      // Freeze associated wagers
      await db('wager_history')
        .transacting(trx)
        .where('transaction_id', transactionId)
        .update({
          status: 'frozen',
          updated_at: new Date()
        });

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      logger.error('Chargeback handling error:', error);
      throw new PLLAYError('Failed to handle chargeback', error);
    }
  }

  async updateProgressiveJackpot(amount, trx) {
    const contributionRate = 0.02; // 2% of each wager
    const contribution = amount * contributionRate;

    await db('progressive_jackpots')
      .transacting(trx)
      .increment('current_amount', contribution);

    await db('jackpot_contributions')
      .transacting(trx)
      .insert({
        amount: contribution,
        created_at: new Date()
      });
  }

  async convertToUSD(amount, fromCurrency) {
    if (fromCurrency === 'USD') return amount;

    await this.updateExchangeRates();
    const rate = this.exchangeRates.get(fromCurrency);
    
    if (!rate) {
      throw new PLLAYError('Exchange rate not available');
    }

    return amount * rate;
  }

  async updateExchangeRates() {
    const now = Date.now();
    if (now - this.lastExchangeRateUpdate < this.exchangeRateRefreshInterval) {
      return;
    }

    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();

      this.supportedCurrencies.forEach(currency => {
        if (currency !== 'USD') {
          this.exchangeRates.set(currency, data.rates[currency]);
        }
      });

      this.lastExchangeRateUpdate = now;
    } catch (error) {
      logger.error('Exchange rate update error:', error);
      throw new PLLAYError('Failed to update exchange rates', error);
    }
  }

  async reconcileAccounts() {
    const trx = await transaction.start(db);

    try {
      const [userBalances, transactions, escrowBalance] = await Promise.all([
        this.getUserBalances(trx),
        this.getTransactionTotals(trx),
        this.getEscrowBalance(trx)
      ]);

      const discrepancies = this.findDiscrepancies(
        userBalances,
        transactions,
        escrowBalance
      );

      if (discrepancies.length > 0) {
        await this.logDiscrepancies(discrepancies, trx);
        throw new PLLAYError('Account reconciliation failed');
      }

      await trx.commit();
      return { success: true, message: 'Accounts reconciled successfully' };
    } catch (error) {
      await trx.rollback();
      logger.error('Reconciliation error:', error);
      throw new PLLAYError('Failed to reconcile accounts', error);
    }
  }

  findDiscrepancies(userBalances, transactions, escrowBalance) {
    const discrepancies = [];

    // Check if user balances match transaction history
    const expectedBalances = this.calculateExpectedBalances(transactions);
    
    for (const [userId, balance] of Object.entries(userBalances)) {
      const expected = expectedBalances[userId] || 0;
      if (Math.abs(balance - expected) > 0.01) {
        discrepancies.push({
          type: 'user_balance',
          userId,
          actual: balance,
          expected,
          difference: balance - expected
        });
      }
    }

    // Check if escrow balance matches active wagers
    const expectedEscrow = this.calculateExpectedEscrow(transactions);
    if (Math.abs(escrowBalance - expectedEscrow) > 0.01) {
      discrepancies.push({
        type: 'escrow_balance',
        actual: escrowBalance,
        expected: expectedEscrow,
        difference: escrowBalance - expectedEscrow
      });
    }

    return discrepancies;
  }

  calculateExpectedBalances(transactions) {
    return transactions.reduce((acc, tx) => {
      const userId = tx.user_id;
      acc[userId] = (acc[userId] || 0) + this.getTransactionEffect(tx);
      return acc;
    }, {});
  }

  getTransactionEffect(transaction) {
    const effects = {
      deposit: 1,
      withdrawal: -1,
      wager: -1,
      winning: 1,
      refund: 1
    };
    return transaction.amount * (effects[transaction.type] || 0);
  }

  async logDiscrepancies(discrepancies, trx) {
    await db('reconciliation_logs')
      .transacting(trx)
      .insert({
        discrepancies,
        severity: this.calculateDiscrepancySeverity(discrepancies),
        created_at: new Date()
      });
  }

  calculateDiscrepancySeverity(discrepancies) {
    const totalAmount = discrepancies.reduce((sum, d) => sum + Math.abs(d.difference), 0);
    if (totalAmount > 10000) return 'critical';
    if (totalAmount > 1000) return 'high';
    if (totalAmount > 100) return 'medium';
    return 'low';
  }
}

module.exports = new WagerFinancialService();