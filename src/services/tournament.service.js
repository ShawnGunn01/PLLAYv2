const fetch = require('node-fetch');
const config = require('../config/pllay');
const EventEmitter = require('events');

class TournamentService extends EventEmitter {
  constructor() {
    super();
    this.baseUrl = config.PLLAY_API_URL;
    this.activeSubscriptions = new Map();
  }

  async subscribeToResults(tournamentId, webhookUrl) {
    const response = await fetch(`${this.baseUrl}/rpc/SubscribeToEvent`, {
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
        event: {
          type: 'TOURNAMENT_END',
          tournamentId
        },
        action: {
          type: 'HTTP_REQUEST',
          url: webhookUrl
        },
        lifetime: 86400 // 24 hours
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Subscription failed: ${data.error.code}`);
    }

    this.activeSubscriptions.set(tournamentId, {
      subscriptionId: data.result.subscriptionId,
      createdAt: new Date()
    });

    return data.result;
  }

  async processResults(eventData) {
    if (!eventData || eventData.eventType !== 'TOURNAMENT_END') {
      throw new Error('Invalid event data');
    }

    const { tournamentId, results } = eventData.payload;
    
    if (!results || !results[0] || !results[0].players) {
      throw new Error('Invalid results format');
    }

    const processedResults = {
      tournamentId,
      timestamp: new Date().toISOString(),
      winners: [],
      losers: [],
      playerResults: results[0].players.map(player => ({
        plLayUserId: player.plLayUserId,
        isWinner: player.isWinner,
        matchPoints: player.matchPoints || 0,
        tournamentPoints: player.tournamentPoints || 0
      }))
    };

    // Separate winners and losers
    processedResults.playerResults.forEach(player => {
      if (player.isWinner) {
        processedResults.winners.push(player.plLayUserId);
      } else {
        processedResults.losers.push(player.plLayUserId);
      }
    });

    // Emit results for real-time updates
    this.emit('tournamentEnd', processedResults);

    return processedResults;
  }

  async unsubscribe(tournamentId) {
    const subscription = this.activeSubscriptions.get(tournamentId);
    if (!subscription) {
      return;
    }

    try {
      await fetch(`${this.baseUrl}/rpc/UnsubscribeFromEvent`, {
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
          subscriptionId: subscription.subscriptionId
        })
      });
    } catch (error) {
      console.error(`Failed to unsubscribe from tournament ${tournamentId}:`, error);
    } finally {
      this.activeSubscriptions.delete(tournamentId);
    }
  }

  getSubscriptionStatus(tournamentId) {
    return this.activeSubscriptions.get(tournamentId) || null;
  }
}

module.exports = new TournamentService();