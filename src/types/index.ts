export interface PLLAYConfig {
  PUBLIC_KEY: string;
  BASE_URL?: string;
  PLAYER_BASE_URL?: string;
  ANALYTICS_ENV?: string;
  exposeGlobally?: boolean;
}

export interface GameSession {
  _id: string;
  status: string;
  tournamentId: string;
  playerId: string;
}

export interface Score {
  points?: number;
  points_extra?: number;
  [key: string]: number | undefined;
}

export interface EncryptedScore {
  data: string;
  iv: string;
  salt: string;
  authTag: string;
  encrypted: boolean;
}

export interface PLLAYStatus {
  loggedIn: boolean;
  initialized: boolean;
  subscription?: any;
  gameId?: string;
  userSessionId?: string;
  gameName?: string;
  trackingParams?: Record<string, any>;
}

export interface InGameReward {
  _id: string;
  rewardData: string;
  tournamentId: string;
}

export interface RewardsResponse {
  count: number;
  data: InGameReward[];
}