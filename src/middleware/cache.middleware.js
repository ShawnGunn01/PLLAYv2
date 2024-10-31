const cache = require('../utils/cache');
const logger = require('../utils/logger');

const cacheMiddleware = (options = {}) => {
  const {
    ttl = 3600,
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    condition = () => true
  } = options;

  return async (req, res, next) => {
    if (!condition(req)) {
      return next();
    }

    const key = keyGenerator(req);

    try {
      const cachedData = await cache.get(key);
      if (cachedData) {
        logger.debug('Cache hit:', { key });
        return res.json(cachedData);
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache response
      res.json = function(data) {
        if (res.statusCode === 200) {
          cache.set(key, data, ttl).catch(error => {
            logger.error('Cache set error in middleware:', { key, error });
          });
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', { key, error });
      next();
    }
  };
};

const clearCache = (pattern) => {
  return async (req, res, next) => {
    try {
      const key = typeof pattern === 'function' ? pattern(req) : pattern;
      await cache.invalidatePattern(key);
      next();
    } catch (error) {
      logger.error('Cache clear error:', { pattern, error });
      next();
    }
  };
};

module.exports = {
  cacheMiddleware,
  clearCache
};