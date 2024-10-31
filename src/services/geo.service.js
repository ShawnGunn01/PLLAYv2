const fetch = require('node-fetch');
const { PLLAYError } = require('../utils/errors');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const ipRegex = require('ip-regex');

class GeoService {
  constructor() {
    this.apiKey = process.env.IPDATA_API_KEY;
    this.baseUrl = 'https://api.ipdata.co';
    this.cacheTTL = 3600; // 1 hour cache for IP lookups
    this.vpnCacheTTL = 86400; // 24 hours cache for VPN/proxy checks
    
    // Restricted states in US
    this.restrictedStates = ['AR', 'CT', 'DE', 'LA', 'SD'];

    // States with game-specific restrictions
    this.gameSpecificRestrictions = {
      'ME': ['CARDS'],
      'IN': ['CARDS'],
      'NJ': ['DOMINOES']
    };

    // Restricted countries
    this.restrictedCountries = [
      'AF', 'BY', 'BE', 'BA', 'BG', 'CO', 'CD', 'CI', 'HR', 'CU', 'CY', 'CZ',
      'EG', 'EE', 'FR', 'GF', 'PF', 'GR', 'HT', 'HU', 'ID', 'IR', 'IQ', 'IT',
      'JP', 'XK', 'LV', 'LT', 'MY', 'MT', 'ME', 'MM', 'NP', 'NG', 'KP', 'MK',
      'PK', 'CN', 'PH', 'PL', 'PT', 'RO', 'RU', 'RS', 'SK', 'SI', 'SD', 'SY',
      'TR', 'UA', 'VE', 'VN', 'YU', 'ZW'
    ];

    // Countries with regional restrictions
    this.regionalRestrictions = {
      'AU': true,
      'IN': true
    };
  }

  async validateIP(ipAddress) {
    if (!ipRegex({ exact: true }).test(ipAddress)) {
      throw new PLLAYError('Invalid IP address format');
    }

    // Check if IP is private
    if (this.isPrivateIP(ipAddress)) {
      throw new PLLAYError('Private IP addresses not allowed');
    }

    return true;
  }

  isPrivateIP(ipAddress) {
    const parts = ipAddress.split('.');
    const firstOctet = parseInt(parts[0], 10);
    const secondOctet = parseInt(parts[1], 10);

    return (
      firstOctet === 10 || // 10.0.0.0/8
      (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) || // 172.16.0.0/12
      (firstOctet === 192 && secondOctet === 168) // 192.168.0.0/16
    );
  }

  async checkLocation(ipAddress, gameType = null) {
    try {
      await this.validateIP(ipAddress);
      
      const locationData = await this.getLocationData(ipAddress);
      const vpnStatus = await this.checkVPNStatus(ipAddress);
      const locationStatus = this.validateLocation(locationData, gameType);

      return {
        allowed: locationStatus.allowed && !vpnStatus.isVPN,
        location: {
          country: locationData.country_code,
          region: locationData.region_code,
          city: locationData.city,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          timezone: locationData.time_zone?.name,
          asn: locationData.asn
        },
        vpn: vpnStatus,
        restrictions: [
          ...locationStatus.restrictions,
          ...(vpnStatus.isVPN ? ['VPN_DETECTED'] : [])
        ]
      };
    } catch (error) {
      logger.error('Location check error:', error);
      throw new PLLAYError('Failed to check location', error);
    }
  }

  async checkVPNStatus(ipAddress) {
    const cacheKey = `vpn:${ipAddress}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.baseUrl}/vpn/${ipAddress}?api-key=${this.apiKey}`
      );
      const data = await response.json();

      const vpnStatus = {
        isVPN: data.vpn || data.proxy || data.tor || data.relay,
        type: this.getVPNType(data),
        provider: data.asn?.name,
        risk: this.calculateVPNRisk(data)
      };

      await cache.set(cacheKey, vpnStatus, this.vpnCacheTTL);
      return vpnStatus;
    } catch (error) {
      logger.error('VPN check error:', error);
      throw new PLLAYError('Failed to check VPN status', error);
    }
  }

  getVPNType(data) {
    if (data.vpn) return 'VPN';
    if (data.proxy) return 'PROXY';
    if (data.tor) return 'TOR';
    if (data.relay) return 'RELAY';
    return null;
  }

  calculateVPNRisk(data) {
    let risk = 0;
    if (data.vpn) risk += 3;
    if (data.proxy) risk += 2;
    if (data.tor) risk += 4;
    if (data.relay) risk += 2;
    if (data.threat?.is_known_attacker) risk += 5;
    if (data.threat?.is_known_abuser) risk += 4;
    
    return {
      level: risk > 8 ? 'high' : risk > 4 ? 'medium' : 'low',
      score: risk
    };
  }

  async createGeofence(name, {
    center,
    radius,
    restrictions = {}
  }) {
    try {
      const [geofence] = await db('geofences')
        .insert({
          name,
          center,
          radius,
          restrictions,
          status: 'active'
        })
        .returning('*');

      return geofence;
    } catch (error) {
      logger.error('Create geofence error:', error);
      throw new PLLAYError('Failed to create geofence', error);
    }
  }

  async checkGeofence(location, geofenceId) {
    try {
      const geofence = await db('geofences')
        .where('id', geofenceId)
        .first();

      if (!geofence) {
        throw new PLLAYError('Geofence not found');
      }

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        geofence.center.latitude,
        geofence.center.longitude
      );

      return {
        inside: distance <= geofence.radius,
        distance,
        geofence: {
          name: geofence.name,
          radius: geofence.radius,
          restrictions: geofence.restrictions
        }
      };
    } catch (error) {
      logger.error('Check geofence error:', error);
      throw new PLLAYError('Failed to check geofence', error);
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = new GeoService();