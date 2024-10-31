const { PLLAYError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const db = require('../../db/knex');
const { transaction } = require('objection');

class WagerTaxService {
  constructor() {
    this.thresholds = {
      form1099MISC: 600, // Report winnings of $600 or more
      w2g: 1200, // For certain gambling winnings
      backupWithholding: 5000 // 24% withholding required above this
    };

    this.withholdingRate = 0.24; // 24% federal backup withholding
  }

  async generateAnnualReports(year) {
    const trx = await transaction.start(db);

    try {
      const winners = await this.getReportableWinners(year, trx);
      const reports = await this.processWinners(winners, year, trx);
      
      await this.generateIRSFiles(reports, year, trx);
      await this.notifyWinners(reports, trx);

      await trx.commit();
      return reports;
    } catch (error) {
      await trx.rollback();
      logger.error('Tax report generation error:', error);
      throw new PLLAYError('Failed to generate tax reports', error);
    }
  }

  async getReportableWinners(year, trx) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    return await db('wager_history')
      .transacting(trx)
      .join('users', 'wager_history.user_id', 'users.id')
      .where('wager_history.status', 'won')
      .whereBetween('wager_history.created_at', [startDate, endDate])
      .select(
        'users.id as user_id',
        'users.full_name',
        'users.tax_id',
        'users.address',
        db.raw('SUM(actual_win) as total_winnings'),
        db.raw('COUNT(*) as winning_transactions')
      )
      .groupBy('users.id', 'users.full_name', 'users.tax_id', 'users.address')
      .having('total_winnings', '>=', this.thresholds.form1099MISC);
  }

  async processWinners(winners, year, trx) {
    const reports = [];

    for (const winner of winners) {
      const withholdingAmount = this.calculateWithholding(winner.total_winnings);
      const reportType = this.determineReportType(winner.total_winnings);

      const report = {
        year,
        userId: winner.user_id,
        recipientInfo: {
          name: winner.full_name,
          tin: winner.tax_id,
          address: winner.address
        },
        payerInfo: {
          name: 'PLLAY Gaming Inc',
          tin: process.env.COMPANY_TAX_ID,
          address: {
            street: '123 Gaming Street',
            city: 'Las Vegas',
            state: 'NV',
            zip: '89101'
          }
        },
        amounts: {
          totalWinnings: winner.total_winnings,
          federalWithholding: withholdingAmount,
          stateWithholding: 0 // Calculate based on state requirements
        },
        transactions: winner.winning_transactions,
        formType: reportType
      };

      // Store report in database
      const [taxReport] = await db('tax_reports')
        .transacting(trx)
        .insert({
          user_id: winner.user_id,
          year,
          report_type: reportType,
          total_amount: winner.total_winnings,
          withholding_amount: withholdingAmount,
          report_data: report,
          created_at: new Date()
        })
        .returning('*');

      reports.push(taxReport);
    }

    return reports;
  }

  async generateIRSFiles(reports, year, trx) {
    // Generate 1099-MISC file
    const form1099Data = reports
      .filter(r => r.report_type === 'form1099MISC')
      .map(this.formatFor1099MISC);

    // Generate W-2G file
    const w2gData = reports
      .filter(r => r.report_type === 'w2g')
      .map(this.formatForW2G);

    // Store generated files
    await db('tax_files')
      .transacting(trx)
      .insert([
        {
          year,
          type: 'form1099MISC',
          file_data: form1099Data,
          created_at: new Date()
        },
        {
          year,
          type: 'w2g',
          file_data: w2gData,
          created_at: new Date()
        }
      ]);
  }

  async notifyWinners(reports, trx) {
    for (const report of reports) {
      await db('notifications')
        .transacting(trx)
        .insert({
          user_id: report.user_id,
          type: 'tax_form_available',
          data: {
            year: report.year,
            formType: report.report_type,
            amount: report.total_amount
          },
          status: 'pending',
          created_at: new Date()
        });
    }
  }

  calculateWithholding(amount) {
    if (amount >= this.thresholds.backupWithholding) {
      return amount * this.withholdingRate;
    }
    return 0;
  }

  determineReportType(amount) {
    if (amount >= this.thresholds.w2g) {
      return 'w2g';
    }
    return 'form1099MISC';
  }

  formatFor1099MISC(report) {
    return {
      recordType: 'A', // Payer record
      paymentYear: report.year,
      payerTIN: report.report_data.payerInfo.tin,
      payerNameControl: this.generateNameControl(report.report_data.payerInfo.name),
      lastFilingIndicator: '0',
      typeOfReturn: '7', // Form 1099-MISC
      amountCodes: '7', // Other income
      foreignEntityIndicator: '0',
      payerName: report.report_data.payerInfo.name,
      payerAddress: report.report_data.payerInfo.address,
      payerCity: report.report_data.payerInfo.address.city,
      payerState: report.report_data.payerInfo.address.state,
      payerZIP: report.report_data.payerInfo.address.zip,
      payerTelephoneNumber: process.env.COMPANY_PHONE,
      recordSequence: '1',
      // Payee record follows
      recipientTIN: report.report_data.recipientInfo.tin,
      recipientNameControl: this.generateNameControl(report.report_data.recipientInfo.name),
      recipientName: report.report_data.recipientInfo.name,
      recipientAddress: report.report_data.recipientInfo.address,
      recipientCity: report.report_data.recipientInfo.address.city,
      recipientState: report.report_data.recipientInfo.address.state,
      recipientZIP: report.report_data.recipientInfo.address.zip,
      otherIncome: report.report_data.amounts.totalWinnings.toFixed(2),
      federalTaxWithheld: report.report_data.amounts.federalWithholding.toFixed(2)
    };
  }

  formatForW2G(report) {
    return {
      recordType: 'A', // Payer record
      paymentYear: report.year,
      payerTIN: report.report_data.payerInfo.tin,
      payerNameControl: this.generateNameControl(report.report_data.payerInfo.name),
      lastFilingIndicator: '0',
      typeOfWager: '1', // Other
      typeOfReturn: 'W2G',
      amountWon: report.report_data.amounts.totalWinnings.toFixed(2),
      federalTaxWithheld: report.report_data.amounts.federalWithholding.toFixed(2),
      stateTaxWithheld: report.report_data.amounts.stateWithholding.toFixed(2),
      payerName: report.report_data.payerInfo.name,
      payerAddress: report.report_data.payerInfo.address,
      payerCity: report.report_data.payerInfo.address.city,
      payerState: report.report_data.payerInfo.address.state,
      payerZIP: report.report_data.payerInfo.address.zip,
      winnerTIN: report.report_data.recipientInfo.tin,
      winnerName: report.report_data.recipientInfo.name,
      winnerAddress: report.report_data.recipientInfo.address,
      winnerCity: report.report_data.recipientInfo.address.city,
      winnerState: report.report_data.recipientInfo.address.state,
      winnerZIP: report.report_data.recipientInfo.address.zip,
      transactionCount: report.report_data.transactions
    };
  }

  generateNameControl(name) {
    // Generate IRS name control (first 4 characters of surname)
    const surname = name.split(' ').pop().toUpperCase();
    return surname.slice(0, 4).padEnd(4, ' ');
  }

  async generateTaxStatement(userId, year) {
    try {
      const [user, winnings] = await Promise.all([
        db('users').where('id', userId).first(),
        this.getAnnualWinnings(userId, year)
      ]);

      return {
        year,
        recipient: {
          name: user.full_name,
          taxId: user.tax_id,
          address: user.address
        },
        summary: {
          totalWinnings: winnings.total,
          reportableWinnings: winnings.reportable,
          federalWithholding: winnings.withholding,
          transactions: winnings.count
        },
        detail: await this.getWinningDetails(userId, year),
        notices: [
          'Gambling losses may be deducted up to the amount of gambling winnings',
          'Report all gambling winnings on Form 1040, Schedule 1',
          'Keep accurate records of all gambling wins and losses'
        ]
      };
    } catch (error) {
      logger.error('Tax statement generation error:', error);
      throw new PLLAYError('Failed to generate tax statement', error);
    }
  }

  async getAnnualWinnings(userId, year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const result = await db('wager_history')
      .where('user_id', userId)
      .where('status', 'won')
      .whereBetween('created_at', [startDate, endDate])
      .select(
        db.raw('SUM(actual_win) as total'),
        db.raw('SUM(CASE WHEN actual_win >= ? THEN actual_win ELSE 0 END) as reportable', [this.thresholds.form1099MISC]),
        db.raw('SUM(CASE WHEN actual_win >= ? THEN actual_win * ? ELSE 0 END) as withholding', [this.thresholds.backupWithholding, this.withholdingRate]),
        db.raw('COUNT(*) as count')
      )
      .first();

    return {
      total: parseFloat(result.total) || 0,
      reportable: parseFloat(result.reportable) || 0,
      withholding: parseFloat(result.withholding) || 0,
      count: parseInt(result.count) || 0
    };
  }

  async getWinningDetails(userId, year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    return await db('wager_history')
      .where('user_id', userId)
      .where('status', 'won')
      .whereBetween('created_at', [startDate, endDate])
      .select(
        'created_at as date',
        'game_id',
        'amount as wager',
        'actual_win as winnings',
        db.raw('CASE WHEN actual_win >= ? THEN actual_win * ? ELSE 0 END as withholding', [this.thresholds.backupWithholding, this.withholdingRate])
      )
      .orderBy('created_at');
  }
}

module.exports = new WagerTaxService();