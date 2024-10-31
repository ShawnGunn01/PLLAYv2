const { PLLAYError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const db = require('../../db/knex');
const crypto = require('crypto');

class SweepstakesDrawingService {
  async generateEntryNumber(sweepstakesId, trx) {
    let entryNumber;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      entryNumber = this.generateRandomEntryNumber();
      const exists = await db('sweepstakes_entries')
        .where({
          sweepstakes_id: sweepstakesId,
          entry_number: entryNumber
        })
        .first()
        .transacting(trx);

      if (!exists) break;
      attempts++;

      if (attempts >= maxAttempts) {
        throw new PLLAYError('Failed to generate unique entry number');
      }
    } while (true);

    return entryNumber;
  }

  generateRandomEntryNumber() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  async selectWinners(entries, rules) {
    // Record random seed for audit
    const randomSeed = crypto.randomBytes(16).toString('hex');
    await this.recordDrawingSeed(randomSeed);

    // Shuffle entries using Fisher-Yates with audit trail
    const shuffled = await this.auditedShuffle(entries, randomSeed);

    const numWinners = rules.numWinners || 1;
    return shuffled.slice(0, numWinners).map(entry => ({
      entryId: entry.id,
      userId: entry.user_id,
      entryNumber: entry.entry_number
    }));
  }

  async auditedShuffle(entries, seed) {
    const prng = crypto.createHash('sha256').update(seed).digest();
    const shuffled = [...entries];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = prng[i % prng.length] % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];

      // Record swap for audit
      await this.recordDrawingStep({
        step: shuffled.length - i,
        swap: [i, j],
        entries: [shuffled[i].entry_number, shuffled[j].entry_number]
      });
    }

    return shuffled;
  }

  async recordDrawingSeed(seed) {
    await db('drawing_audit').insert({
      type: 'seed',
      data: { seed },
      created_at: new Date()
    });
  }

  async recordDrawingStep(step) {
    await db('drawing_audit').insert({
      type: 'step',
      data: step,
      created_at: new Date()
    });
  }

  calculatePrize(prizePool, rank) {
    const distribution = {
      1: 0.5,  // 50% for first place
      2: 0.3,  // 30% for second place
      3: 0.2   // 20% for third place
    };

    return Math.floor(prizePool * (distribution[rank] || 0));
  }

  async generateAffidavit(winnerId, sweepstakesId) {
    const [winner, sweepstakes] = await Promise.all([
      db('users').where('id', winnerId).first(),
      db('sweepstakes').where('id', sweepstakesId).first()
    ]);

    return {
      type: 'AFFIDAVIT_OF_ELIGIBILITY',
      sweepstakes: {
        name: sweepstakes.name,
        sponsor: 'PLLAY Gaming',
        drawDate: new Date().toISOString()
      },
      winner: {
        name: winner.full_name,
        address: winner.address,
        phone: winner.phone,
        email: winner.email,
        taxId: winner.tax_id
      },
      declarations: [
        'I am of legal age in my jurisdiction',
        'I am not an employee or family member of sponsor',
        'I am eligible to participate under all applicable laws',
        'I understand I am responsible for all applicable taxes',
        'I grant permission to use my name and likeness'
      ],
      signature: {
        name: '_____________________',
        date: '_____________________'
      },
      notary: {
        statement: 'Subscribed and sworn to before me this ___ day of _____, 20__',
        seal: '[NOTARY SEAL]',
        signature: '_____________________',
        commission: 'My commission expires: _____________'
      }
    };
  }
}

module.exports = new SweepstakesDrawingService();