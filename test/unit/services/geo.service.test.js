const GeoService = require('../../../src/services/geo.service');
const { PLLAYError } = require('../../../src/utils/errors');
const fetch = require('node-fetch');
const cache = require('../../../src/utils/cache');

jest.mock('node-fetch');
jest.mock('../../../src/utils/cache');

describe('GeoService', () => {
  beforeEach(() => {
    fetch.mockClear();
    cache.get.mockClear();
    cache.set.mockClear();
  });

  describe('checkLocation', () => {
    it('should return location data for valid IP in allowed state', async () => {
      const mockResponse = {
        country_code: 'US',
        region_code: 'CA',
        city: 'Los Angeles',
        latitude: 34.0522,
        longitude: -118.2437,
        threat: {
          is_proxy: false,
          is_vpn: false
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await GeoService.checkLocation('1.1.1.1');
      expect(result.allowed).toBe(true);
      expect(result.location.country).toBe('US');
      expect(result.location.region).toBe('CA');
      expect(result.restrictions).toEqual([]);
    });

    it('should detect restricted state', async () => {
      const mockResponse = {
        country_code: 'US',
        region_code: 'AR',
        threat: {
          is_proxy: false,
          is_vpn: false
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await GeoService.checkLocation('1.1.1.1');
      expect(result.allowed).toBe(false);
      expect(result.restrictions).toContain('STATE_RESTRICTED');
    });

    it('should detect game-specific restrictions', async () => {
      const mockResponse = {
        country_code: 'US',
        region_code: 'ME',
        threat: {
          is_proxy: false,
          is_vpn: false
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await GeoService.checkLocation('1.1.1.1', 'CARDS');
      expect(result.allowed).toBe(false);
      expect(result.restrictions).toContain('GAME_TYPE_RESTRICTED');
    });

    it('should allow non-restricted game types in restricted states', async () => {
      const mockResponse = {
        country_code: 'US',
        region_code: 'ME',
        threat: {
          is_proxy: false,
          is_vpn: false
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await GeoService.checkLocation('1.1.1.1', 'SKILL_BASED');
      expect(result.allowed).toBe(true);
      expect(result.restrictions).toEqual([]);
    });

    it('should detect VPN/proxy usage', async () => {
      const mockResponse = {
        country_code: 'US',
        region_code: 'CA',
        threat: {
          is_proxy: true,
          is_vpn: false
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await GeoService.checkLocation('1.1.1.1');
      expect(result.allowed).toBe(false);
      expect(result.restrictions).toContain('VPN_PROXY_DETECTED');
    });
  });

  describe('validateLocation', () => {
    it('should validate location with game-specific restrictions', () => {
      const locationData = {
        country_code: 'US',
        region_code: 'NJ',
        threat: { is_proxy: false }
      };

      const result = GeoService.validateLocation(locationData, 'DOMINOES');
      expect(result.allowed).toBe(false);
      expect(result.restrictions).toContain('GAME_TYPE_RESTRICTED');
    });

    it('should allow valid location without game restrictions', () => {
      const locationData = {
        country_code: 'US',
        region_code: 'TX',
        threat: { is_proxy: false }
      };

      const result = GeoService.validateLocation(locationData);
      expect(result.allowed).toBe(true);
      expect(result.restrictions).toEqual([]);
    });
  });
});