const { PLLAYError } = require('../utils/errors');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

class ProfileService {
  constructor() {
    this.cacheTTL = 3600; // 1 hour cache for profiles
  }

  async getProfile(userId) {
    try {
      const cacheKey = `profile:${userId}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      const profile = await this.fetchProfile(userId);
      
      await cache.set(cacheKey, profile, this.cacheTTL);
      return profile;
    } catch (error) {
      logger.error('Profile fetch error:', error);
      throw new PLLAYError('Failed to get user profile', error);
    }
  }

  async updateProfile(userId, updates) {
    try {
      const profile = await this.saveProfile(userId, updates);
      await cache.del(`profile:${userId}`);
      return profile;
    } catch (error) {
      logger.error('Profile update error:', error);
      throw new PLLAYError('Failed to update profile', error);
    }
  }

  async getStats(userId) {
    try {
      const cacheKey = `stats:${userId}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      const stats = await this.fetchStats(userId);
      
      await cache.set(cacheKey, stats, this.cacheTTL);
      return stats;
    } catch (error) {
      logger.error('Stats fetch error:', error);
      throw new PLLAYError('Failed to get user stats', error);
    }
  }

  async getAchievements(userId) {
    try {
      const cacheKey = `achievements:${userId}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      const achievements = await this.fetchAchievements(userId);
      
      await cache.set(cacheKey, achievements, this.cacheTTL);
      return achievements;
    } catch (error) {
      logger.error('Achievements fetch error:', error);
      throw new PLLAYError('Failed to get achievements', error);
    }
  }

  async updateAvatar(userId, avatarData) {
    try {
      const avatar = await this.saveAvatar(userId, avatarData);
      await cache.del(`profile:${userId}`);
      return avatar;
    } catch (error) {
      logger.error('Avatar update error:', error);
      throw new PLLAYError('Failed to update avatar', error);
    }
  }

  // Private methods for database operations
  async fetchProfile(userId) {
    // Implement database query for user profile
    return {
      id: userId,
      username: '',
      avatar: '',
      bio: '',
      level: 1,
      joinedAt: new Date()
    };
  }

  async saveProfile(userId, updates) {
    // Implement database update for profile
    return updates;
  }

  async fetchStats(userId) {
    // Implement database query for user stats
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      averageScore: 0,
      bestScore: 0
    };
  }

  async fetchAchievements(userId) {
    // Implement database query for achievements
    return [];
  }

  async saveAvatar(userId, avatarData) {
    // Implement avatar storage and database update
    return '';
  }
}

module.exports = new ProfileService();