const request = require('supertest');
const app = require('../../../src/server');
const geoService = require('../../../src/services/geo.service');

jest.mock('../../../src/services/geo.service');

describe('Geo Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /geo/check', () => {
    it('should check location successfully', async () => {
      const mockResult = {
        allowed: true,
        location: {
          country: 'US',
          region: 'CA'
        },
        proxy: false
      };

      geoService.checkLocation.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/geo/check')
        .set('Authorization', 'Bearer test-token')
        .send({ ip: '1.1.1.1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.allowed).toBe(true);
      expect(response.body.location).toBeDefined();
    });

    it('should handle invalid IP addresses', async () => {
      const response = await request(app)
        .post('/geo/check')
        .set('Authorization', 'Bearer test-token')
        .send({ ip: 'invalid-ip' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /geo/verify-radius', () => {
    it('should verify radius successfully', async () => {
      const mockLocations = {
        userLocation: {
          latitude: 34.0522,
          longitude: -118.2437
        },
        targetLocation: {
          latitude: 34.0522,
          longitude: -118.2437
        },
        radiusKm: 10
      };

      geoService.isWithinRadius.mockResolvedValue(true);

      const response = await request(app)
        .post('/geo/verify-radius')
        .set('Authorization', 'Bearer test-token')
        .send(mockLocations)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.isWithin).toBe(true);
    });

    it('should validate location coordinates', async () => {
      const invalidLocations = {
        userLocation: {
          latitude: 200, // Invalid latitude
          longitude: -118.2437
        },
        targetLocation: {
          latitude: 34.0522,
          longitude: -118.2437
        },
        radiusKm: 10
      };

      const response = await request(app)
        .post('/geo/verify-radius')
        .set('Authorization', 'Bearer test-token')
        .send(invalidLocations)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});