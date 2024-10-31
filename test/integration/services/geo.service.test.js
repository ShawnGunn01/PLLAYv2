const request = require('supertest');
const app = require('../../../src/server');
const geoService = require('../../../src/services/geo.service');
const { PLLAYError } = require('../../../src/utils/errors');

describe('Geolocation Integration', () => {
  describe('Location Validation', () => {
    it('should allow valid US location', async () => {
      const result = await geoService.checkLocation('1.1.1.1');
      expect(result.allowed).toBe(true);
      expect(result.location.country).toBe('US');
    });

    it('should block restricted state', async () => {
      const result = await geoService.checkLocation('2.2.2.2'); // IP from Arkansas
      expect(result.allowed).toBe(false);
      expect(result.restrictions).toContain('STATE_RESTRICTED');
    });

    it('should block restricted country', async () => {
      const result = await geoService.checkLocation('3.3.3.3'); // IP from restricted country
      expect(result.allowed).toBe(false);
      expect(result.restrictions).toContain('COUNTRY_RESTRICTED');
    });
  });

  describe('VPN Detection', () => {
    it('should detect VPN usage', async () => {
      const result = await geoService.checkLocation('4.4.4.4'); // Known VPN IP
      expect(result.allowed).toBe(false);
      expect(result.vpn.isVPN).toBe(true);
    });
  });

  describe('Geofencing', () => {
    let testGeofence;

    beforeAll(async () => {
      testGeofence = await geoService.createGeofence('Test Zone', {
        center: { latitude: 34.0522, longitude: -118.2437 },
        radius: 10 // 10km radius
      });
    });

    it('should validate location within geofence', async () => {
      const result = await geoService.checkGeofence(
        { latitude: 34.0522, longitude: -118.2437 },
        testGeofence.id
      );
      expect(result.inside).toBe(true);
    });

    it('should validate location outside geofence', async () => {
      const result = await geoService.checkGeofence(
        { latitude: 35.0522, longitude: -118.2437 },
        testGeofence.id
      );
      expect(result.inside).toBe(false);
    });
  });
});