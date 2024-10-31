const { PLLAYError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const db = require('../../db/knex');
const axios = require('axios');

class IdentityVerificationService {
  constructor() {
    this.verificationLevels = {
      basic: ['email', 'phone'],
      standard: ['id_document', 'address'],
      enhanced: ['video_selfie', 'liveness']
    };
    
    this.providers = {
      idv: process.env.IDV_PROVIDER,
      aml: process.env.AML_PROVIDER,
      deviceRisk: process.env.DEVICE_RISK_PROVIDER
    };
  }

  async verifyIdentity(userId, level = 'standard') {
    const trx = await db.transaction();

    try {
      const user = await db('users')
        .where('id', userId)
        .first();

      if (!user) {
        throw new PLLAYError('User not found');
      }

      // Check existing verification
      const existing = await this.getExistingVerification(userId);
      if (existing && this.isVerificationValid(existing, level)) {
        return existing;
      }

      // Perform required verifications
      const verificationResults = await this.performVerifications(user, level);

      // Store verification results
      const verification = await this.storeVerificationResults(
        userId,
        level,
        verificationResults,
        trx
      );

      await trx.commit();
      return verification;
    } catch (error) {
      await trx.rollback();
      logger.error('Identity verification error:', error);
      throw new PLLAYError('Identity verification failed', error);
    }
  }

  async verifyDevice(userId, deviceInfo) {
    try {
      // Get device risk score
      const riskScore = await this.assessDeviceRisk(deviceInfo);

      // Check device history
      const deviceHistory = await this.getDeviceHistory(deviceInfo.fingerprint);

      // Verify IP reputation
      const ipReputation = await this.checkIPReputation(deviceInfo.ip);

      // Store device verification
      await this.storeDeviceVerification(userId, {
        deviceInfo,
        riskScore,
        ipReputation
      });

      return {
        verified: riskScore.score < 0.7 && ipReputation.risk < 0.7,
        riskLevel: this.calculateRiskLevel(riskScore, ipReputation),
        restrictions: this.determineRestrictions(riskScore, ipReputation)
      };
    } catch (error) {
      logger.error('Device verification error:', error);
      throw new PLLAYError('Device verification failed', error);
    }
  }

  private async performVerifications(user, level) {
    const requiredChecks = this.verificationLevels[level];
    const results = {};

    for (const check of requiredChecks) {
      results[check] = await this.performCheck(check, user);
    }

    return results;
  }

  private async performCheck(checkType, user) {
    switch (checkType) {
      case 'email':
        return await this.verifyEmail(user.email);
      case 'phone':
        return await this.verifyPhone(user.phone);
      case 'id_document':
        return await this.verifyIDDocument(user.id_document);
      case 'address':
        return await this.verifyAddress(user.address);
      case 'video_selfie':
        return await this.verifyVideoSelfie(user.video_selfie);
      case 'liveness':
        return await this.verifyLiveness(user.liveness_data);
      default:
        throw new PLLAYError(`Unknown verification check: ${checkType}`);
    }
  }

  private async verifyEmail(email) {
    // Implement email verification
    return { verified: true };
  }

  private async verifyPhone(phone) {
    // Implement phone verification
    return { verified: true };
  }

  private async verifyIDDocument(document) {
    // Implement ID document verification
    return { verified: true };
  }

  private async verifyAddress(address) {
    // Implement address verification
    return { verified: true };
  }

  private async verifyVideoSelfie(video) {
    // Implement video selfie verification
    return { verified: true };
  }

  private async verifyLiveness(livenessData) {
    // Implement liveness verification
    return { verified: true };
  }

  private async assessDeviceRisk(deviceInfo) {
    const response = await axios.post(
      `${this.providers.deviceRisk}/assess`,
      deviceInfo
    );
    return response.data;
  }

  private async checkIPReputation(ip) {
    const response = await axios.get(
      `${this.providers.deviceRisk}/ip/${ip}/reputation`
    );
    return response.data;
  }

  private async getDeviceHistory(fingerprint) {
    return await db('device_history')
      .where('device_fingerprint', fingerprint)
      .orderBy('created_at', 'desc')
      .limit(10);
  }

  private calculateRiskLevel(deviceRisk, ipRisk) {
    const combinedRisk = (deviceRisk.score + ipRisk.risk) / 2;
    if (combinedRisk > 0.8) return 'high';
    if (combinedRisk > 0.5) return 'medium';
    return 'low';
  }

  private determineRestrictions(deviceRisk, ipRisk) {
    const restrictions = [];

    if (deviceRisk.score > 0.8) {
      restrictions.push('requires_enhanced_verification');
    }

    if (ipRisk.risk > 0.8) {
      restrictions.push('requires_location_verification');
    }

    if (deviceRisk.score > 0.9 || ipRisk.risk > 0.9) {
      restrictions.push('blocked');
    }

    return restrictions;
  }

  private async storeVerificationResults(userId, level, results, trx) {
    return await db('identity_verifications')
      .transacting(trx)
      .insert({
        user_id: userId,
        level,
        results,
        status: this.calculateVerificationStatus(results),
        verified_at: new Date()
      })
      .returning('*');
  }

  private async storeDeviceVerification(userId, verification) {
    await db('device_verifications').insert({
      user_id: userId,
      device_info: verification.deviceInfo,
      risk_score: verification.riskScore,
      ip_reputation: verification.ipReputation,
      created_at: new Date()
    });
  }

  private calculateVerificationStatus(results) {
    return Object.values(results).every(r => r.verified)
      ? 'verified'
      : 'failed';
  }

  private async getExistingVerification(userId) {
    return await db('identity_verifications')
      .where('user_id', userId)
      .orderBy('verified_at', 'desc')
      .first();
  }

  private isVerificationValid(verification, requiredLevel) {
    const levelHierarchy = ['basic', 'standard', 'enhanced'];
    const existingLevel = levelHierarchy.indexOf(verification.level);
    const requiredLevelIndex = levelHierarchy.indexOf(requiredLevel);

    return (
      verification.status === 'verified' &&
      existingLevel >= requiredLevelIndex &&
      this.isVerificationRecent(verification)
    );
  }

  private isVerificationRecent(verification) {
    const verificationAge = Date.now() - new Date(verification.verified_at).getTime();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    return verificationAge < maxAge;
  }
}

module.exports = new IdentityVerificationService();