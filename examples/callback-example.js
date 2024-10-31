const { PLLAYService } = require('../src/plugins/pllay');

// Initialize PLLAY
PLLAYService.initialize({
  PUBLIC_KEY: 'your-public-key'
}).then(() => {
  console.log('PLLAY initialized');
  setupCallbacks();
}).catch(console.error);

function setupCallbacks() {
  // Register game set start callback
  PLLAYService.onGameSetStart((payload) => {
    console.log('Game set started:', payload);
    
    // Access team and participant information
    payload.participants.forEach((team, teamIndex) => {
      console.log(`Team ${teamIndex + 1}:`);
      team.forEach(player => {
        console.log(`- ${player.username} (${player.ingamePlayerId})`);
      });
    });

    // Start the game with metadata
    startGame(payload);
  });

  // Register game set end callback
  PLLAYService.onGameSetEnd((payload) => {
    console.log('Game set ended:', payload);
    cleanupGame(payload);
  });

  // Register match start callback
  PLLAYService.onMatchStart((payload) => {
    console.log('Match started:', payload);
    setupMatch(payload);
  });

  // Register match end callback
  PLLAYService.onMatchEnd((payload) => {
    console.log('Match ended:', payload);
    handleMatchEnd(payload);
  });
}

// Example game functions
function startGame(payload) {
  const { globalMetadata, setEndTimeUnix } = payload;
  console.log('Starting game with metadata:', globalMetadata);
  console.log('Game must end by:', new Date(setEndTimeUnix));
}

function cleanupGame(payload) {
  const { setId, matchId } = payload;
  console.log('Cleaning up game:', { setId, matchId });
}

function setupMatch(payload) {
  const { matchId } = payload;
  console.log('Setting up match:', matchId);
}

function handleMatchEnd(payload) {
  const { matchId } = payload;
  console.log('Handling match end:', matchId);
}