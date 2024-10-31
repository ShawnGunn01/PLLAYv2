const { PLLAYError } = require('../utils/errors');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const { v4: uuidv4 } = require('uuid');

class AIAgentUIService {
  constructor() {
    this.pageTTL = 3600; // 1 hour page retention
    this.templates = {
      wagerStatus: require('../templates/wager-status.js'),
      leaderboard: require('../templates/leaderboard.js'),
      profile: require('../templates/profile.js'),
      stats: require('../templates/stats.js')
    };
  }

  async generatePage(type, data) {
    try {
      const pageId = uuidv4();
      const template = this.templates[type];
      
      if (!template) {
        throw new PLLAYError(`Unknown page type: ${type}`);
      }

      const html = template(data);
      await this.savePage(pageId, html);

      return {
        pageId,
        url: `/p/${pageId}`,
        qrCode: await this.generateQRCode(`/p/${pageId}`)
      };
    } catch (error) {
      logger.error('Page generation error:', error);
      throw new PLLAYError('Failed to generate page', error);
    }
  }

  async savePage(pageId, html) {
    const cacheKey = `page:${pageId}`;
    await cache.set(cacheKey, html, this.pageTTL);
  }

  async getPage(pageId) {
    const cacheKey = `page:${pageId}`;
    const html = await cache.get(cacheKey);
    
    if (!html) {
      throw new PLLAYError('Page not found or expired');
    }

    return html;
  }

  async generateQRCode(url) {
    const QRCode = require('qrcode');
    return await QRCode.toDataURL(url);
  }
}

module.exports = new AIAgentUIService();