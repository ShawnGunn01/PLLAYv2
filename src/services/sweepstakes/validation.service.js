const { PLLAYError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const db = require('../../db/knex');
const geoService = require('../geo.service');

class SweepstakesValidationService {
  async validatePrizePool(prizePool) {
    if (prizePool <= 0) {
      throw new PLLAYError('Prize pool must be greater than zero');
    }

    if (prizePool > 1000000) {
      throw new PLLAYError('Prize pool exceeds maximum allowed amount');
    }

    // Check for sufficient escrow funds
    const escrowBalance = await this.getEscrowBalance();
    if (escrowBalance < prizePool) {
      throw new PLLAYError('Insufficient funds in prize escrow account');
    }
  }

  async validateEntryFee(entryFee) {
    if (entryFee < 0) {
      throw new PLLAYError('Entry fee cannot be negative');
    }

    if (entryFee > 100) {
      throw new PLLAYError('Entry fee exceeds maximum allowed amount');
    }
  }

  async validateUserEligibility(userId, sweepstakes, entries, trx) {
    const user = await db('users')
      .where('id', userId)
      .first();

    if (!user) {
      throw new PLLAYError('User not found');
    }

    // Age verification
    const userAge = this.calculateAge(user.date_of_birth);
    const minAge = sweepstakes.entry_requirements?.special_requirements?.[user.state]?.minAge || 18;
    if (userAge < minAge) {
      throw new PLLAYError(`Must be ${minAge} years or older to enter`);
    }

    // Location restrictions
    const locationCheck = await geoService.checkLocation(user.ip_address);
    if (!locationCheck.allowed) {
      throw new PLLAYError('Entry not allowed from your location');
    }

    if (sweepstakes.entry_requirements.restricted_countries.includes(locationCheck.location.country)) {
      throw new PLLAYError('Sweepstakes not available in your country');
    }

    if (sweepstakes.entry_requirements.restricted_states.includes(locationCheck.location.region)) {
      throw new PLLAYError('Sweepstakes not available in your state');
    }

    // Check state-specific entry limits
    const stateReqs = sweepstakes.entry_requirements.special_requirements[locationCheck.location.region];
    if (stateReqs?.maxEntriesPerUser) {
      const userEntries = await this.getUserEntries(sweepstakes.id, userId, trx);
      if (userEntries + entries > stateReqs.maxEntriesPerUser) {
        throw new PLLAYError(`Maximum ${stateReqs.maxEntriesPerUser} entries allowed in your state`);
      }
    }

    // Employee verification
    const isEmployee = await this.checkIfEmployee(userId);
    if (isEmployee) {
      throw new PLLAYError('Employees are not eligible to participate');
    }

    // Previous winner cooldown
    const recentWin = await this.checkRecentWin(userId);
    if (recentWin) {
      throw new PLLAYError('Must wait 30 days between winning and new entries');
    }
  }

  async checkIfEmployee(userId) {
    const employeeCheck = await db('employee_verification')
      .where('user_id', userId)
      .first();
    return !!employeeCheck;
  }

  async checkRecentWin(userId) {
    const recentWin = await db('sweepstakes_winners')
      .where('user_id', userId)
      .where('created_at', '>', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .first();
    return !!recentWin;
  }

  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  async getEscrowBalance() {
    const escrowAccount = await db('escrow_accounts')
      .where('type', 'prize_pool')
      .first();
    return escrowAccount?.balance || 0;
  }
}

module.exports = new SweepstakesValidationService();