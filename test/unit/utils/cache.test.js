const CacheManager = require('../../../src/utils/cache');
const Redis = require('ioredis');
const RedisMock = require('redis-mock');

jest.mock('ioredis');
Redis.mockImplementation(() => RedisMock.createClient());

describe('CacheManager', () => {
  beforeEach(async () => {
    await CacheManager.connect();
  });

  afterEach(async () => {
    await CacheManager.close();
  });

  describe('basic operations', () => {
    it('should set and get value', async () => {
      const key = 'test:key';
      const value = { data: 'test' };

      await CacheManager.set(key, value);
      const result = await CacheManager.get(key);

      expect(result).toEqual(value);
    });

    it('should delete value', async () => {
      const key = 'test:key';
      const value = { data: 'test' };

      await CacheManager.set(key, value);
      await CacheManager.del(key);
      const result = await CacheManager.get(key);

      expect(result).toBeNull();
    });

    it('should handle non-existent keys', async () => {
      const result = await CacheManager.get('non:existent');
      expect(result).toBeNull();
    });
  });

  describe('pattern invalidation', () => {
    it('should invalidate by pattern', async () => {
      await CacheManager.set('test:1', 'value1');
      await CacheManager.set('test:2', 'value2');
      await CacheManager.set('other:1', 'value3');

      await CacheManager.invalidatePattern('test:*');

      const result1 = await CacheManager.get('test:1');
      const result2 = await CacheManager.get('test:2');
      const result3 = await CacheManager.get('other:1');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeTruthy();
    });
  });

  describe('key generation', () => {
    it('should generate consistent keys', () => {
      const key = CacheManager.generateKey('users', '123', 'profile');
      expect(key).toBe('users:123:profile');
    });
  });
});