const DEFAULT_CONFIG = {
  BASE_URL: 'https://api.pllay.io',
  PLAYER_BASE_URL: 'https://player.pllay.io',
  ANALYTICS_ENV: 'production'
};

class PLLAYConfig {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  validate(config) {
    if (!config.PUBLIC_KEY) {
      throw new Error('PUBLIC_KEY is required for PLLAY initialization');
    }

    return {
      public_key: config.PUBLIC_KEY,
      base_url: config.BASE_URL || DEFAULT_CONFIG.BASE_URL,
      player_base_url: config.PLAYER_BASE_URL || DEFAULT_CONFIG.PLAYER_BASE_URL,
      analyticsEnv: config.ANALYTICS_ENV || DEFAULT_CONFIG.ANALYTICS_ENV
    };
  }

  set(config) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    return this.validate(this.config);
  }

  get() {
    return this.validate(this.config);
  }
}

module.exports = new PLLAYConfig();