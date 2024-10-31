import { PLLAYService } from './PLLAYService';
import { Score, GameSession, EncryptedScore } from '../types';
import { PLLAYError } from '../utils/errors';
import { validateScore } from '../utils/validators';
import { encryptScore } from '../utils/crypto';

export class GameManager {
  private service: PLLAYService;
  private currentGame: GameSession | null = null;
  private scoreTypes: Set<string>;

  constructor(service: PLLAYService) {
    this.service = service;
    this.scoreTypes = new Set(['points', 'points_extra']);
  }

  async startGame(): Promise<GameSession> {
    if (!this.service.isInitialized) {
      throw new PLLAYError('PLLAY service not initialized');
    }

    try {
      const session = await this.service.startGame();
      this.currentGame = session;
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
      validateScore(score, this.scoreTypes);
      const result = await this.service.endGame(score);
      this.currentGame = null;
      return result;
    } catch (error) {
      throw new PLLAYError('Failed to end game', error);
    }
  }

  async endGameEncrypted(keyProvider: () => string, score: Score): Promise<any> {
    if (typeof keyProvider !== 'function') {
      throw new PLLAYError('Key provider must be a function');
    }

    try {
      const key = keyProvider();
      if (!key || typeof key !== 'string') {
        throw new PLLAYError('Invalid encryption key');
      }

      validateScore(score, this.scoreTypes);
      const encryptedScore: EncryptedScore = encryptScore(score, key);
      
      return this.endGame({
        ...encryptedScore,
        encrypted: true
      } as any);
    } catch (error) {
      throw new PLLAYError('Failed to end game with encryption', error);
    }
  }

  setScoreTypes(types: string[]): void {
    if (!Array.isArray(types)) {
      throw new PLLAYError('Score types must be an array');
    }
    this.scoreTypes = new Set(types);
  }

  isGameActive(): boolean {
    return !!this.currentGame;
  }

  getCurrentGame(): GameSession | null {
    return this.currentGame;
  }
}