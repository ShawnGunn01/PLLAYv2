import { EventEmitter } from 'events';
import { PLLAYConfig, GameSession, Score, PLLAYStatus, RewardsResponse } from '../types';
import { PLLAYError } from '../utils/errors';
import { validateConfig } from '../utils/validators';

export class PLLAYService extends EventEmitter {
  private static instance: PLLAYService;
  private isInitialized: boolean = false;
  private currentGame: GameSession | null = null;
  private trackingParams: Record<string, any> = {};

  private constructor() {
    super();
  }

  static getInstance(): PLLAYService {
    if (!PLLAYService.instance) {
      PLLAYService.instance = new PLLAYService();
    }
    return PLLAYService.instance;
  }

  async initialize(config: PLLAYConfig): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      validateConfig(config);
      await window.PLLAY.invokeManaged({
        public_key: config.PUBLIC_KEY,
        base_url: config.BASE_URL || 'https://api.pllay.io',
        player_base_url: config.PLAYER_BASE_URL || 'https://player.pllay.io',
        analyticsEnv: config.ANALYTICS_ENV || 'production'
      });

      this.isInitialized = true;
      this.emit('initialized');
      return true;
    } catch (error) {
      throw new PLLAYError('Failed to initialize PLLAY', error);
    }
  }

  async startGame(): Promise<GameSession> {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY not initialized');
    }

    try {
      const session = await window.PLLAY.startGame();
      this.currentGame = session;
      this.emit('gameStarted', session);
      return session;
    } catch (error) {
      throw new PLLAYError('Failed to start game', error);
    }
  }

  async endGame(score: Score): Promise<any> {
    if (!this.currentGame) {
      throw new PLLAYError('No active game session');
    }

    try {
      const result = await window.PLLAY.endGame(score);
      this.currentGame = null;
      this.emit('gameEnded', result);
      return result;
    } catch (error) {
      throw new PLLAYError('Failed to end game', error);
    }
  }

  async maybeShowNotifications(): Promise<void> {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY not initialized');
    }

    try {
      await window.PLLAY.maybeShowNotifications();
    } catch (error) {
      throw new PLLAYError('Failed to show notifications', error);
    }
  }

  async maybeShowAnnouncements(): Promise<void> {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY not initialized');
    }

    try {
      await window.PLLAY.maybeShowAnnouncements();
    } catch (error) {
      throw new PLLAYError('Failed to show announcements', error);
    }
  }

  setTrackingParams(params: Record<string, any>): void {
    if (typeof params !== 'object') {
      throw new PLLAYError('Tracking params must be an object');
    }

    this.trackingParams = { ...params };
    if (this.isInitialized && window.PLLAY.setTrackingParams) {
      window.PLLAY.setTrackingParams(this.trackingParams);
    }
  }

  async getStatus(): Promise<PLLAYStatus> {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY not initialized');
    }

    try {
      const status = await window.PLLAY.getStatus();
      return {
        ...status,
        initialized: this.isInitialized,
        trackingParams: this.trackingParams
      };
    } catch (error) {
      throw new PLLAYError('Failed to get status', error);
    }
  }

  async getIngameRewards(): Promise<RewardsResponse> {
    if (!this.isInitialized) {
      throw new PLLAYError('PLLAY not initialized');
    }

    try {
      return await window.PLLAY.getIngameRewards();
    } catch (error) {
      throw new PLLAYError('Failed to get in-game rewards', error);
    }
  }

  isGameActive(): boolean {
    return !!this.currentGame;
  }

  getCurrentGame(): GameSession | null {
    return this.currentGame;
  }
}

export const pllay = PLLAYService.getInstance();