const PLLAYiOSService = require('../src/plugins/pllay/ios/PLLAYiOSService');

// Initialize PLLAY
PLLAYiOSService.initialize({
  PUBLIC_KEY: 'your-public-key'
}).then(() => {
  console.log('PLLAY iOS SDK initialized');
  setupMultiplayer();
}).catch(console.error);

function setupMultiplayer() {
  // Register player with metadata
  PLLAYiOSService.registerInGamePlayerId('player123', {
    level: 10,
    rank: 'gold',
    customData: {
      achievements: ['first_win', 'speed_demon'],
      totalGames: 150
    }
  });

  // Register game set start callback
  PLLAYiOSService.callbacks.set('gameSetStart', (payload) => {
    console.log('Game set started:', payload);
    
    // Access team and player information
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
  PLLAYiOSService.callbacks.set('gameSetEnd', (payload) => {
    console.log('Game set ended:', payload);
    cleanupGame(payload);
  });

  // Register match callbacks
  PLLAYiOSService.callbacks.set('matchStart', (payload) => {
    console.log('Match started:', payload);
    setupMatch(payload);
  });

  PLLAYiOSService.callbacks.set('matchEnd', (payload) => {
    console.log('Match ended:', payload);
    handleMatchEnd(payload);
  });
}

// Example game functions
function startGame(payload) {
  const { globalMetadata, setEndTimeUnix, teams } = payload;
  
  // Setup game with metadata
  console.log('Game metadata:', globalMetadata);
  
  // Setup timer based on endTime
  const timeRemaining = setEndTimeUnix - Date.now();
  console.log('Time remaining:', timeRemaining);
  
  // Initialize teams
  teams.forEach(team => initializeTeam(team));
}

function initializeTeam(team) {
  team.players.forEach(player => {
    // Setup player in the game
    console.log('Initializing player:', player.username);
  });
}

function cleanupGame(payload) {
  console.log('Cleaning up game:', payload);
}

function setupMatch(payload) {
  console.log('Setting up match:', payload);
}

function handleMatchEnd(payload) {
  console.log('Handling match end:', payload);
}