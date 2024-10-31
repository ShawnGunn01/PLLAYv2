const { PLLAYError } = require('../utils/errors');
const logger = require('../utils/logger');
const db = require('../db/knex');
const { transaction } = require('objection');
const strikeService = require('./strike.service');
const walletService = require('./wallet.service');
const geoService = require('./geo.service');
const smsService = require('./sms.service');

class SweepstakesService {
  constructor() {
    this.cacheTTL = 3600;
    this.restrictedCountries = [
      'AF', 'BY', 'CU', 'CD', 'IR', 'IQ', 'LB', 'LY', 'NK', 'SO', 
      'SS', 'SD', 'SY', 'VE', 'YE', 'ZW'
    ];
    
    this.restrictedStates = {
      fullRestriction: ['HI', 'NV', 'UT'],
      paidRestriction: ['AL', 'AR', 'CT', 'DE', 'FL', 'LA', 'MT', 'SC', 'SD', 'TN'],
      specialRequirements: {
        'NY': { maxPrizeValue: 5000 },
        'CA': { maxEntryFee: 50 },
        'MA': { maxEntriesPerUser: 100 },
        'RI': { minAge: 21 }
      }
    };

    // AMOE (Alternative Method of Entry) settings
    this.amoeSettings = {
      maxEntriesPerMail: 1,
      mailInDeadlineDays: 3, // Must be received 3 days before end date
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zip: '10001'
      }
    };
  }

  async createSweepstakes({
    name,
    description,
    startDate,
    endDate,
    prizePool,
    maxEntries,
    entryFee = 0,
    entryRequirements = {},
    drawingRules = {},
    countryRestrictions = [],
    stateRestrictions = [],
    officialRules = null
  }) {
    const trx = await transaction.start(db);

    try {
      if (new Date(startDate) >= new Date(endDate)) {
        throw new PLLAYError('End date must be after start date');
      }

      await this.validatePrizePool(prizePool);
      await this.validateEntryFee(entryFee);

      const finalCountryRestrictions = [
        ...this.restrictedCountries,
        ...countryRestrictions
      ];

      const finalStateRestrictions = [
        ...this.restrictedStates.fullRestriction,
        ...(entryFee > 0 ? this.restrictedStates.paidRestriction : []),
        ...stateRestrictions
      ];

      // Generate official rules if not provided
      const rules = officialRules || await this.generateOfficialRules({
        name,
        description,
        startDate,
        endDate,
        prizePool,
        entryFee,
        restrictions: {
          countries: finalCountryRestrictions,
          states: finalStateRestrictions
        }
      });

      const [sweepstakes] = await db('sweepstakes')
        .transacting(trx)
        .insert({
          name,
          description,
          start_date: startDate,
          end_date: endDate,
          prize_pool: prizePool,
          max_entries: maxEntries,
          entry_fee: entryFee,
          entry_requirements: {
            ...entryRequirements,
            restricted_countries: finalCountryRestrictions,
            restricted_states: finalStateRestrictions,
            special_requirements: this.restrictedStates.specialRequirements
          },
          drawing_rules: drawingRules,
          official_rules: rules,
          status: 'pending',
          created_at: new Date()
        })
        .returning('*');

      await trx.commit();
      return sweepstakes;
    } catch (error) {
      await trx.rollback();
      logger.error('Create sweepstakes error:', error);
      throw new PLLAYError('Failed to create sweepstakes', error);
    }
  }

  async submitMailInEntry(sweepstakesId, {
    fullName,
    email,
    phone,
    address,
    postmarkDate,
    receivedDate
  }) {
    const trx = await transaction.start(db);

    try {
      const sweepstakes = await db('sweepstakes')
        .where('id', sweepstakesId)
        .first();

      if (!sweepstakes) {
        throw new PLLAYError('Sweepstakes not found');
      }

      // Validate postmark date
      if (new Date(postmarkDate) > new Date(sweepstakes.end_date)) {
        throw new PLLAYError('Entry postmarked after sweepstakes end date');
      }

      // Validate received date against deadline
      const deadline = new Date(sweepstakes.end_date);
      deadline.setDate(deadline.getDate() - this.amoeSettings.mailInDeadlineDays);
      if (new Date(receivedDate) > deadline) {
        throw new PLLAYError('Entry received after mail-in deadline');
      }

      // Create mail-in entry record
      const [mailEntry] = await db('sweepstakes_mail_entries')
        .transacting(trx)
        .insert({
          sweepstakes_id: sweepstakesId,
          full_name: fullName,
          email,
          phone,
          address,
          postmark_date: postmarkDate,
          received_date: receivedDate,
          status: 'verified',
          created_at: new Date()
        })
        .returning('*');

      // Create corresponding sweepstakes entry
      const [entry] = await db('sweepstakes_entries')
        .transacting(trx)
        .insert({
          sweepstakes_id: sweepstakesId,
          mail_entry_id: mailEntry.id,
          entry_number: await this.generateEntryNumber(sweepstakesId, trx),
          created_at: new Date()
        })
        .returning('*');

      await trx.commit();
      return entry;
    } catch (error) {
      await trx.rollback();
      logger.error('Mail-in entry error:', error);
      throw new PLLAYError('Failed to process mail-in entry', error);
    }
  }

  async enterSweepstakes(sweepstakesId, userId, entries = 1) {
    const trx = await transaction.start(db);

    try {
      const sweepstakes = await db('sweepstakes')
        .where('id', sweepstakesId)
        .first();

      if (!sweepstakes) {
        throw new PLLAYError('Sweepstakes not found');
      }

      if (sweepstakes.status !== 'active') {
        throw new PLLAYError('Sweepstakes is not active');
      }

      const now = new Date();
      if (now < new Date(sweepstakes.start_date) || now > new Date(sweepstakes.end_date)) {
        throw new PLLAYError('Sweepstakes is not open for entries');
      }

      await this.validateUserEligibility(userId, sweepstakes, entries, trx);

      const userEntries = await this.getUserEntries(sweepstakesId, userId, trx);
      if (userEntries + entries > sweepstakes.max_entries) {
        throw new PLLAYError('Maximum entries limit reached');
      }

      // Verify entry attempt for fraud prevention
      await this.verifyEntryAttempt(userId, sweepstakes, entries);

      if (sweepstakes.entry_fee > 0) {
        const totalFee = sweepstakes.entry_fee * entries;
        await this.processPaidEntry(userId, sweepstakes, totalFee, trx);
      }

      const entryRecords = Array(entries).fill().map(() => ({
        sweepstakes_id: sweepstakesId,
        user_id: userId,
        entry_number: await this.generateEntryNumber(sweepstakesId, trx),
        created_at: new Date()
      }));

      await db('sweepstakes_entries')
        .transacting(trx)
        .insert(entryRecords);

      await trx.commit();
      return {
        success: true,
        entries: entryRecords.map(e => e.entry_number)
      };
    } catch (error) {
      await trx.rollback();
      logger.error('Enter sweepstakes error:', error);
      throw new PLLAYError('Failed to enter sweepstakes', error);
    }
  }

  async verifyEntryAttempt(userId, sweepstakes, entries) {
    // Check for suspicious patterns
    const recentAttempts = await db('sweepstakes_entries')
      .where({
        user_id: userId,
        sweepstakes_id: sweepstakes.id
      })
      .where('created_at', '>', new Date(Date.now() - 3600000)) // Last hour
      .count('id as count')
      .first();

    if (parseInt(recentAttempts.count) > 50) {
      throw new PLLAYError('Too many entry attempts. Please try again later.');
    }

    // Check for multiple accounts
    const userAccounts = await db('sweepstakes_entries')
      .join('users', 'sweepstakes_entries.user_id', 'users.id')
      .where('sweepstakes_entries.sweepstakes_id', sweepstakes.id)
      .whereRaw('users.ip_address = (SELECT ip_address FROM users WHERE id = ?)', [userId])
      .countDistinct('sweepstakes_entries.user_id as count')
      .first();

    if (parseInt(userAccounts.count) > 1) {
      throw new PLLAYError('Multiple accounts detected');
    }
  }

  async drawWinners(sweepstakesId) {
    const trx = await transaction.start(db);

    try {
      const sweepstakes = await db('sweepstakes')
        .where('id', sweepstakesId)
        .first();

      if (!sweepstakes || sweepstakes.status !== 'active') {
        throw new PLLAYError('Invalid sweepstakes for drawing');
      }

      const entries = await db('sweepstakes_entries')
        .where('sweepstakes_id', sweepstakesId)
        .select('id', 'user_id', 'entry_number');

      const winners = await this.selectWinners(entries, sweepstakes.drawing_rules);

      await Promise.all(winners.map(async (winner, index) => {
        const prizeAmount = this.calculatePrize(sweepstakes.prize_pool, index + 1);
        
        await db('sweepstakes_winners')
          .transacting(trx)
          .insert({
            sweepstakes_id: sweepstakesId,
            entry_id: winner.entryId,
            user_id: winner.userId,
            prize_rank: index + 1,
            prize_amount: prizeAmount,
            notification_status: 'pending',
            created_at: new Date()
          });

        const wallet = await walletService.getWallet(winner.userId);
        await walletService.addTransaction(wallet.id, {
          type: 'prize',
          amount: prizeAmount,
          status: 'completed',
          metadata: {
            sweepstakes_id: sweepstakesId,
            prize_rank: index + 1
          }
        });

        // Queue winner notification
        await this.queueWinnerNotification(winner.userId, sweepstakes, prizeAmount);
      }));

      await db('sweepstakes')
        .transacting(trx)
        .where('id', sweepstakesId)
        .update({
          status: 'completed',
          completed_at: new Date()
        });

      await trx.commit();
      return winners;
    } catch (error) {
      await trx.rollback();
      logger.error('Draw winners error:', error);
      throw new PLLAYError('Failed to draw winners', error);
    }
  }

  async queueWinnerNotification(userId, sweepstakes, prizeAmount) {
    try {
      const user = await db('users')
        .where('id', userId)
        .first();

      // Queue email notification
      await db('notification_queue').insert({
        user_id: userId,
        type: 'winner_email',
        data: {
          sweepstakes_name: sweepstakes.name,
          prize_amount: prizeAmount,
          claim_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        status: 'pending'
      });

      // Queue SMS notification if phone available
      if (user.phone) {
        await smsService.sendMessage(
          user.phone,
          `Congratulations! You've won ${prizeAmount} in the ${sweepstakes.name} sweepstakes! Check your email for details.`
        );
      }
    } catch (error) {
      logger.error('Winner notification error:', error);
      // Don't throw - we don't want to roll back the drawing if notification fails
    }
  }

  async generateOfficialRules({
    name,
    description,
    startDate,
    endDate,
    prizePool,
    entryFee,
    restrictions
  }) {
    const rules = {
      name,
      sponsor: 'PLLAY Gaming',
      dates: {
        start: startDate,
        end: endDate,
        drawingDate: new Date(endDate).toISOString()
      },
      eligibility: {
        minAge: 18,
        countries: restrictions.countries,
        states: restrictions.states,
        employees: false
      },
      howToEnter: {
        online: {
          method: 'Register and submit entry through PLLAY platform',
          fee: entryFee
        },
        mailIn: {
          method: 'Send a 3x5 card with required information',
          address: this.amoeSettings.address,
          deadline: `Must be received by ${new Date(endDate).toISOString()}`
        }
      },
      prizes: {
        total: prizePool,
        breakdown: {
          first: prizePool * 0.5,
          second: prizePool * 0.3,
          third: prizePool * 0.2
        },
        odds: 'Dependent on number of eligible entries received'
      },
      limitations: {
        maxEntries: 'See state-specific requirements',
        transferability: 'Prizes not transferable',
        substitutions: 'No prize substitutions except at sponsor\'s discretion'
      },
      conditions: {
        privacyPolicy: 'URL_TO_PRIVACY_POLICY',
        taxLiability: 'Winners responsible for all taxes',
        verification: 'Winners may be required to sign affidavit of eligibility'
      }
    };

    return rules;
  }

  async getActiveSweepstakes() {
    try {
      const sweepstakes = await db('sweepstakes')
        .where('status', 'active')
        .where('end_date', '>', new Date())
        .orderBy('end_date', 'asc');

      return sweepstakes.map(s => ({
        ...s,
        isFree: s.entry_fee === 0,
        hasAMOE: true
      }));
    } catch (error) {
      logger.error('Get active sweepstakes error:', error);
      throw new PLLAYError('Failed to get active sweepstakes', error);
    }
  }

  // ... [Previous methods remain unchanged: validateUserEligibility, validatePrizePool, 
  //     validateEntryFee, processPaidEntry, waitForPayment, getUserEntries, 
  //     generateEntryNumber, selectWinners, calculatePrize]
}

module.exports = new SweepstakesService();