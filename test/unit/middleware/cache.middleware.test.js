const { cacheMiddleware, clearCache } = require('../../../src/middleware/cache.middleware');
const cache = require('../../../src/utils/cache');

jest.mock('../../../src/utils/cache');

describe('Cache Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/test'
    };
    res = {
      json: jest.fn()
    };
    next = jest.fn();
    cache.get.mockClear();
    cache.set.mockClear();
  });

  describe('cacheMiddleware', () => {
    it('should return cached data if available', async () => {
      const cachedData = { data: 'test' };
      cache.get.mockResolvedValue(cachedData);

      await cacheMiddleware()(req, res, next);

      expect(res.json).toHaveBeenCalledWith(cachedData);
      expect(next).not.toHaveBeenCalled();
    });

    it('should cache successful responses', async () => {
      cache.get.mockResolvedValue(null);
      const middleware = cacheMiddleware();
      
      await middleware(req, res, next);

      const data = { success: true };
      res.statusCode = 200;
      await res.json(data);

      expect(cache.set).toHaveBeenCalledWith(
        'GET:/test',
        data,
        expect.any(Number)
      );
    });

    it('should skip cache based on condition', async () => {
      const middleware = cacheMiddleware({
        condition: () => false
      });

      await middleware(req, res, next);

      expect(cache.get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should clear cache with static pattern', async () => {
      const middleware = clearCache('test:*');
      await middleware(req, res, next);

      expect(cache.invalidatePattern).toHaveBeenCalledWith('test:*');
      expect(next).toHaveBeenCalled();
    });

    it('should clear cache with dynamic pattern', async () => {
      const middleware = clearCache((req) => `users:${req.params.id}`);
      req.params = { id: '123' };
      
      await middleware(req, res, next);

      expect(cache.invalidatePattern).toHaveBeenCalledWith('users:123');
      expect(next).toHaveBeenCalled();
    });
  });
});