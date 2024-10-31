import { PLLAYConfig, Score } from '../types';
import { PLLAYError } from './errors';

export function validateConfig(config: PLLAYConfig): void {
  if (!config.PUBLIC_KEY) {
    throw new PLLAYError('PUBLIC_KEY is required');
  }
}

export function validateScore(score: Score, allowedTypes: Set<string>): void {
  if (!score || typeof score !== 'object') {
    throw new PLLAYError('Score must be an object');
  }

  const scoreEntries = Object.entries(score);
  if (scoreEntries.length === 0) {
    throw new PLLAYError('Score object cannot be empty');
  }

  for (const [key, value] of scoreEntries) {
    if (!allowedTypes.has(key)) {
      throw new PLLAYError(`Invalid score type: ${key}`);
    }

    if (typeof value !== 'number' || isNaN(value)) {
      throw new PLLAYError(`Score value must be a number: ${key}`);
    }
  }
}