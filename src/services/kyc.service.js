const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const { PLLAYError } = require('../utils/errors');
const logger = require('../utils/logger');
const db = require('../db/knex');
const { transaction } = require('objection');

class KYCService {
  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV] || PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    });

    this.client = new PlaidApi(configuration);
  }

  async createLinkToken(userId) {
    try {
      const configs = {
        user: { client_user_id: userId },
        client_name: 'PLLAY Gaming',
        country_codes: ['US'],
        language: 'en',
        products: ['identity', 'identity_verification'],
        webhook: process.env.PLAID_WEBHOOK_URL
      };

      const response = await this.client.linkTokenCreate(configs);
      return response.data.link_token;
    } catch (error) {
      logger.error('Link token creation error:', error);
      throw new PLLAYError('Failed to create identity verification session', error);
    }
  }

  async verifyIdentity(userId, publicToken) {
    const trx = await transaction.start(db);

    try {
      // Exchange public token for access token
      const exchangeResponse = await this.client.itemPublicTokenExchange({
        public_token: publicToken
      });

      const accessToken = exchangeResponse.data.access_token;

      // Get identity information
      const identityResponse = await this.client.identityGet({
        access_token: accessToken
      });

      const identity = identityResponse.data.accounts[0].owners[0];

      // Create identity verification
      const verificationResponse = await this.client.identityVerificationCreate({
        client_user_id: userId,
        template_id: process.env.PLAID_TEMPLATE_ID,
        is_shareable: true,
        gave_consent: true,
        user: {
          client_user_id: userId,
          email_address: identity.emails[0],
          phone_number: identity.phone_numbers[0].data,
          date_of_birth: identity.phone_numbers[0].data,
          name: {
            given_name: identity.names[0],
            family_name: identity.names[1]
          }
        }
      });

      // Store verification record
      const [verification] = await db('kyc_verifications')
        .transacting(trx)
        .insert({
          user_id: userId,
          verification_id: verificationResponse.data.id,
          status: verificationResponse.data.status,
          identity_data: identity,
          created_at: new Date()
        })
        .returning('*');

      await trx.commit();

      return {
        verificationId: verification.verification_id,
        status: verification.status,
        identity: {
          name: identity.names[0],
          email: identity.emails[0],
          phone: identity.phone_numbers[0].data
        }
      };
    } catch (error) {
      await trx.rollback();
      logger.error('Identity verification error:', error);
      throw new PLLAYError('Identity verification failed', error);
    }
  }

  async getVerificationStatus(verificationId) {
    try {
      const response = await this.client.identityVerificationGet({
        identity_verification_id: verificationId
      });

      return {
        status: response.data.status,
        steps: response.data.steps,
        documentary_verification: response.data.documentary_verification,
        selfie_check: response.data.selfie_check
      };
    } catch (error) {
      logger.error('Get verification status error:', error);
      throw new PLLAYError('Failed to get verification status', error);
    }
  }

  async retryVerification(verificationId, template) {
    try {
      const response = await this.client.identityVerificationRetry({
        identity_verification_id: verificationId,
        template,
        steps: ['documentary_verification', 'selfie_check']
      });

      await db('kyc_verifications')
        .where('verification_id', verificationId)
        .update({
          status: response.data.status,
          updated_at: new Date()
        });

      return {
        verificationId: response.data.id,
        status: response.data.status
      };
    } catch (error) {
      logger.error('Retry verification error:', error);
      throw new PLLAYError('Failed to retry verification', error);
    }
  }

  async handleWebhook(payload) {
    const trx = await transaction.start(db);

    try {
      const { verification_id, status, webhook_code } = payload;

      await db('kyc_verifications')
        .transacting(trx)
        .where('verification_id', verification_id)
        .update({
          status,
          updated_at: new Date()
        });

      if (status === 'completed') {
        await this.processCompletedVerification(verification_id, trx);
      }

      await trx.commit();
      return { success: true };
    } catch (error) {
      await trx.rollback();
      logger.error('Webhook handling error:', error);
      throw new PLLAYError('Failed to handle webhook', error);
    }
  }

  async processCompletedVerification(verificationId, trx) {
    const verification = await db('kyc_verifications')
      .where('verification_id', verificationId)
      .first();

    if (!verification) {
      throw new PLLAYError('Verification not found');
    }

    await db('users')
      .transacting(trx)
      .where('id', verification.user_id)
      .update({
        kyc_verified: true,
        kyc_verified_at: new Date()
      });
  }
}

module.exports = new KYCService();