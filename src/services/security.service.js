const { PLLAYError } = require('../utils/errors');
const logger = require('../utils/logger');
const db = require('../db/knex');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { transaction } = require('objection');

class SecurityService {
  async setup2FA(userId) {
    try {
      const secret = speakeasy.generateSecret({
        name: `PLLAY:${userId}`
      });

      const qrCode = await QRCode.toDataURL(secret.otpauth_url);

      await db('user_security')
        .insert({
          user_id: userId,
          tfa_secret: secret.base32,
          tfa_status: 'pending'
        })
        .onConflict('user_id')
        .merge();

      return {
        secret: secret.base32,
        qrCode
      };
    } catch (error) {
      logger.error('2FA setup error:', error);
      throw new PLLAYError('Failed to setup 2FA', error);
    }
  }

  async verify2FA(userId, token) {
    try {
      const security = await db('user_security')
        .where('user_id', userId)
        .first();

      if (!security?.tfa_secret) {
        throw new PLLAYError('2FA not set up');
      }

      const verified = speakeasy.totp.verify({
        secret: security.tfa_secret,
        encoding: 'base32',
        token
      });

      if (verified) {
        await db('user_security')
          .where('user_id', userId)
          .update({
            tfa_status: 'active',
            last_verified: new Date()
          });
      }

      return verified;
    } catch (error) {
      logger.error('2FA verification error:', error);
      throw new PLLAYError('Failed to verify 2FA', error);
    }
  }

  async detectFraud(userId, activity) {
    try {
      const patterns = await this.analyzePatterns(userId);
      const riskScore = await this.calculateRiskScore(userId, activity);
      const locationCheck = await this.validateLocation(userId, activity);

      const isFraudulent = riskScore > 0.7 || patterns.suspicious || !locationCheck.valid;

      if (isFraudulent) {
        await this.flagFraudulentActivity(userId, {
          activity,
          riskScore,
          patterns,
          locationCheck
        });
      }

      return {
        isFraudulent,
        riskScore,
        patterns,
        locationCheck
      };
    } catch (error) {
      logger.error('Fraud detection error:', error);
      throw new PLLAYError('Failed to detect fraud', error);
    }
  }

  async monitorTransaction(userId, transaction) {
    try {
      const thresholds = await this.getTransactionThresholds(userId);
      const recentActivity = await this.getRecentActivity(userId);
      
      const alerts = [];

      // Check transaction amount
      if (transaction.amount > thresholds.maxAmount) {
        alerts.push('AMOUNT_EXCEEDS_THRESHOLD');
      }

      // Check transaction frequency
      if (recentActivity.frequency > thresholds.maxFrequency) {
        alerts.push('HIGH_FREQUENCY');
      }

      // Check for unusual patterns
      if (this.isUnusualPattern(transaction, recentActivity.patterns)) {
        alerts.push('UNUSUAL_PATTERN');
      }

      if (alerts.length > 0) {
        await this.createTransactionAlert(userId, transaction, alerts);
      }

      return {
        allowed: alerts.length === 0,
        alerts
      };
    } catch (error) {
      logger.error('Transaction monitoring error:', error);
      throw new PLLAYError('Failed to monitor transaction', error);
    }
  }

  // Private methods
  async analyzePatterns(userId) {
    const recentActivity = await db('user_activity')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(100);

    return {
      suspicious: false, // Implement pattern analysis logic
      patterns: []
    };
  }

  async calculateRiskScore(userId, activity) {
    // Implement risk scoring logic
    return 0.0;
  }

  async validateLocation(userId, activity) {
    // Implement location validation logic
    return { valid: true };
  }

  async flagFraudulentActivity(userId, details) {
    await db('fraud_alerts').insert({
      user_id: userId,
      details,
      status: 'pending',
      detected_at: new Date()
    });
  }

  async getTransactionThresholds(userId) {
    const userLevel = await db('users')
      .where('id', userId)
      .select('risk_level')
      .first();

    // Return thresholds based on user's risk level
    return {
      maxAmount: 1000,
      maxFrequency: 10
    };
  }

  async getRecentActivity(userId) {
    const activity = await db('transactions')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(50);

    return {
      frequency: activity.length,
      patterns: this.extractPatterns(activity)
    };
  }

  isUnusualPattern(transaction, patterns) {
    // Implement pattern matching logic
    return false;
  }

  extractPatterns(activity) {
    // Implement pattern extraction logic
    return [];
  }

  async createTransactionAlert(userId, transaction, alerts) {
    await db('transaction_alerts').insert({
      user_id: userId,
      transaction_id: transaction.id,
      alerts,
      status: 'pending',
      created_at: new Date()
    });
  }
}

module.exports = new SecurityService();