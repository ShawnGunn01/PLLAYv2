const Redis = require('ioredis');
const { caching } = require('cache-manager');
const RedisStore = require('cache-manager-ioredis');
const logger = require('./logger');

class CacheManager {
  constructor() {
    this.client = null;
    this.cacheManager = null;
    this.defaultTTL = 3600; // 1 hour
  }

  async connect() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        keyPrefix: 'pllay:',
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.cacheManager = await caching(RedisStore, {
        store: RedisStore,
        redisInstance: this.client,
        ttl: this.defaultTTL
      });

      this.client.on('error', (error) => {
        logger.error('Redis error:', error);
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
      });

      return this;
    } catch (error) {
      logger.error('Redis connection error:', error);
      throw error;
    }
  }

  async get(key) {
    try {
      return await this.cacheManager.get(key);
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.cacheManager.set(key, value, { ttl });
    } catch (error) {
      logger.error('Cache set error:', { key, error });
    }
  }

  async del(key) {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
    }
  }

  async invalidatePattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      logger.error('Cache pattern invalidation error:', { pattern, error });
    }
  }

  generateKey(...parts) {
    return parts.join(':');
  }

  async close() {
    if (this.client) {
      await this.client.quit();
    }
  }
}

module.exports = new CacheManager();