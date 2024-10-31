const { PLLAYError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const db = require('../../db/knex');
const crypto = require('crypto');

class SessionManager {
  constructor() {
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.maxConcurrentSessions = 1;
    this.recoveryWindow = 5 * 60 * 1000; // 5 minutes
  }

  async createSession(userId, deviceInfo) {
    const trx = await db.transaction();

    try {
      // Check concurrent sessions
      await this.enforceConcurrentLimit(userId, trx);

      // Generate session token
      const sessionToken = this.generateSessionToken();

      // Create session record
      const [session] = await db('game_sessions')
        .transacting(trx)
        .insert({
          user_id: userId,
          session_token: sessionToken,
          device_info: deviceInfo,
          device_fingerprint: await this.generateDeviceFingerprint(deviceInfo),
          started_at: new Date(),
          last_activity: new Date(),
          status: 'active'
        })
        .returning('*');

      await trx.commit();
      return session;
    } catch (error) {
      await trx.rollback();
      logger.error('Session creation error:', error);
      throw new PLLAYError('Failed to create session', error);
    }
  }

  async validateSession(sessionToken) {
    const session = await db('game_sessions')
      .where('session_token', sessionToken)
      .first();

    if (!session) {
      throw new PLLAYError('Invalid session');
    }

    if (session.status !== 'active') {
      throw new PLLAYError('Session is not active');
    }

    if (this.isSessionExpired(session)) {
      await this.expireSession(session.id);
      throw new PLLAYError('Session expired');
    }

    await this.updateLastActivity(session.id);
    return session;
  }

  async recoverSession(userId, deviceInfo) {
    const recentSession = await db('game_sessions')
      .where('user_id', userId)
      .where('status', 'disconnected')
      .where('last_activity', '>', new Date(Date.now() - this.recoveryWindow))
      .orderBy('last_activity', 'desc')
      .first();

    if (!recentSession) {
      throw new PLLAYError('No recoverable session found');
    }

    // Verify device fingerprint
    if (!await this.verifyDeviceFingerprint(recentSession, deviceInfo)) {
      throw new PLLAYError('Device verification failed');
    }

    // Reactivate session
    await db('game_sessions')
      .where('id', recentSession.id)
      .update({
        status: 'active',
        last_activity: new Date()
      });

    return recentSession;
  }

  async syncSession(sessionId, gameState) {
    const session = await db('game_sessions')
      .where('id', sessionId)
      .first();

    if (!session) {
      throw new PLLAYError('Session not found');
    }

    // Store game state
    await db('game_states').insert({
      session_id: sessionId,
      state_data: gameState,
      timestamp: new Date()
    });

    // Notify other devices
    await this.notifyDevices(session.user_id, {
      type: 'state_update',
      sessionId,
      gameState
    });
  }

  private async enforceConcurrentLimit(userId, trx) {
    const activeSessions = await db('game_sessions')
      .transacting(trx)
      .where('user_id', userId)
      .where('status', 'active')
      .count('id as count')
      .first();

    if (parseInt(activeSessions.count) >= this.maxConcurrentSessions) {
      throw new PLLAYError('Maximum concurrent sessions reached');
    }
  }

  private generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  private async generateDeviceFingerprint(deviceInfo) {
    const fingerprint = crypto.createHash('sha256')
      .update(JSON.stringify({
        userAgent: deviceInfo.userAgent,
        screen: deviceInfo.screen,
        timezone: deviceInfo.timezone,
        language: deviceInfo.language,
        platform: deviceInfo.platform
      }))
      .digest('hex');

    return fingerprint;
  }

  private isSessionExpired(session) {
    const lastActivity = new Date(session.last_activity).getTime();
    return Date.now() - lastActivity > this.sessionTimeout;
  }

  private async updateLastActivity(sessionId) {
    await db('game_sessions')
      .where('id', sessionId)
      .update({
        last_activity: new Date()
      });
  }

  private async verifyDeviceFingerprint(session, deviceInfo) {
    const currentFingerprint = await this.generateDeviceFingerprint(deviceInfo);
    return session.device_fingerprint === currentFingerprint;
  }

  private async notifyDevices(userId, message) {
    // Implement WebSocket notification to other devices
  }
}

module.exports = new SessionManager();