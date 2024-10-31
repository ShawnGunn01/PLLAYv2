const fetch = require('node-fetch');
const config = require('../config/pllay');

class MatchService {
  constructor() {
    this.baseUrl = config.PLLAY_API_URL;
  }

  async createMatchTemplate({
    name,
    type = 'MULTIPLAYER',
    maxSets = 1,
    matchEndCondition,
    playersInSet,
    minPlayersInSet,
    matchPoints,
    tournamentPoints,
    waitTimeForPlayer = 60,
    matchPointsAggregate = 'SUM'
  }) {
    const response = await fetch(`${this.baseUrl}/rpc/CreateMatchTemplate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: {
          type: 'BY_GAME_SECRET_KEY',
          gameId: config.GAME_ID,
          secretKey: config.GAME_SECRET_KEY
        },
        template: {
          name,
          type,
          maxSets,
          matchEndCondition,
          playersInSet,
          minPlayersInSet,
          matchPoints: matchPoints?.join(','),
          tournamentPoints: tournamentPoints?.join(','),
          waitTimeForPlayer,
          matchPointsAggregate
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to create match template: ${data.error.code}`);
    }

    return data.result;
  }

  async startSet(matchId) {
    const response = await fetch(`${this.baseUrl}/rpc/StartSet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: {
          type: 'BY_GAME_SECRET_KEY',
          gameId: config.GAME_ID,
          secretKey: config.GAME_SECRET_KEY
        },
        matchId
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to start set: ${data.error.code}`);
    }

    return data.result;
  }

  async submitSetScore(setId, scores) {
    const response = await fetch(`${this.baseUrl}/rpc/SubmitSetScore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: {
          type: 'BY_GAME_SECRET_KEY',
          gameId: config.GAME_ID,
          secretKey: config.GAME_SECRET_KEY
        },
        setId,
        scores: scores.map(score => ({
          playerId: score.playerId,
          score: score.score,
          metadata: score.metadata
        }))
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to submit set score: ${data.error.code}`);
    }

    return data.result;
  }

  async getMatchStatus(matchId) {
    const response = await fetch(`${this.baseUrl}/rpc/GetMatchStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: {
          type: 'BY_GAME_SECRET_KEY',
          gameId: config.GAME_ID,
          secretKey: config.GAME_SECRET_KEY
        },
        matchId
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Failed to get match status: ${data.error.code}`);
    }

    return {
      ...data.result,
      sets: data.result.sets.map(set => ({
        ...set,
        scores: set.scores.map(score => ({
          playerId: score.playerId,
          score: score.score,
          matchPoints: score.matchPoints,
          tournamentPoints: score.tournamentPoints,
          status: score.status
        }))
      }))
    };
  }

  calculateSetWinner(scores, gameMode) {
    const sortedScores = [...scores].sort((a, b) => {
      // Higher score is better
      if (gameMode.scoreType.sorting === 1) {
        return b.score - a.score;
      }
      // Lower score is better
      return a.score - b.score;
    });

    return sortedScores[0];
  }

  calculateMatchWinner(matchStatus, matchTemplate) {
    const playerScores = new Map();

    // Aggregate scores for each player
    matchStatus.sets.forEach(set => {
      set.scores.forEach(score => {
        const currentScore = playerScores.get(score.playerId) || {
          matchPoints: 0,
          tournamentPoints: 0,
          setsWon: 0
        };

        playerScores.set(score.playerId, {
          matchPoints: currentScore.matchPoints + (score.matchPoints || 0),
          tournamentPoints: currentScore.tournamentPoints + (score.tournamentPoints || 0),
          setsWon: currentScore.setsWon + (score.status === 'WINNER' ? 1 : 0)
        });
      });
    });

    // Find winner based on match end condition
    const players = Array.from(playerScores.entries());
    const sortedPlayers = players.sort((a, b) => {
      const [, scoreA] = a;
      const [, scoreB] = b;

      if (matchTemplate.matchPointsAggregate === 'SUM') {
        return scoreB.matchPoints - scoreA.matchPoints;
      }

      return scoreB.setsWon - scoreA.setsWon;
    });

    return {
      winnerId: sortedPlayers[0][0],
      scores: Object.fromEntries(players)
    };
  }
}

module.exports = new MatchService();