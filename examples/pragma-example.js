const PragmaService = require('../src/plugins/pragma/PragmaService');
const PLLAYService = require('../src/plugins/pllay/PLLAYService');

// Initialize both services
async function initialize() {
  try {
    await Promise.all([
      PLLAYService.initialize({
        PUBLIC_KEY: 'your-pllay-key'
      }),
      PragmaService.initialize({
        PRAGMA_API_URL: 'https://your-pragma-api.com',
        AUTH_CODE_APPLICATION_ID: 'your-auth-code-app-id',
        AUTH_CODE_APPLICATION_SECRET: 'your-auth-code-secret',
        GAME_ID: 'your-game-id',
        GAME_SECRET_KEY: 'your-game-secret'
      })
    ]);

    console.log('Services initialized');
    setupGame();
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

function setupGame() {
  // Handle PLLAY OAuth request
  PLLAYService.on('userProfileRequested', async () => {
    try {
      // Get auth code from Pragma
      const authCode = await PragmaService.getAuthCode('player123');
      
      // Provide to PLLAY
      await PLLAYService.submitAuthCode(authCode);
    } catch (error) {
      console.error('Auth flow error:', error);
    }
  });

  // Handle matchmaking
  PragmaService
    .onPartyComplete((party) => {
      console.log('Party complete:', party);
      // Enter matchmaking when party is ready
      PragmaService.enterMatchmaking();
    })
    .onMatchStart((match) => {
      console.log('Match started:', match);
      // Start the game with match data
      startGame(match);
    })
    .onMatchEnd((result) => {
      console.log('Match ended:', result);
      // Handle match end
      handleMatchEnd(result);
    });
}

// Example game functions
function startGame(match) {
  const { participants, metadata } = match;
  console.log('Starting game with:', { participants, metadata });
}

function handleMatchEnd(result) {
  const { matchId, scores } = result;
  console.log('Game ended:', { matchId, scores });
}

// Start initialization
initialize();