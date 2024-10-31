const { PLLAYService } = require('../src/plugins/pllay');
const MultiplayerManager = require('../src/plugins/pllay/multiplayer/MultiplayerManager');

// Initialize PLLAY
PLLAYService.initialize({
  PUBLIC_KEY: 'your-public-key'
}).then(() => {
  console.log('PLLAY initialized');
  setupMultiplayer();
}).catch(console.error);

function setupMultiplayer() {
  const multiplayerManager = new MultiplayerManager(PLLAYService);

  // Register player with metadata
  multiplayerManager.registerInGamePlayerId('player123', JSON.stringify({
    level: 10,
    rank: 'gold',
    customData: {
      achievements: ['first_win', 'speed_demon'],
      totalGames: 150
    }
  })).then(() => {
    console.log('Player registered successfully');
  }).catch(console.error);

  // Set Start Event
  multiplayerManager.on('setStart', (setData) => {
    console.log('Set started:', setData);
    
    // Access team and player information
    setData.teams.forEach((team, teamIndex) => {
      console.log(`Team ${teamIndex + 1}:`);
      team.players.forEach(player => {
        console.log(`- ${player.username} (${player.inGameId})`);
        
        // Access player metadata if needed
        const metadata = multiplayerManager.getPlayerMetadata(player.id);
        if (metadata) {
          console.log('  Player metadata:', metadata);
        }
      });
    });

    // Start the game with the provided metadata
    startGame(setData);
  });

  // Set End Event
  multiplayerManager.on('setEnd', ({ setId, matchId }) => {
    console.log('Set ended:', { setId, matchId });
    cleanupGame();
  });

  // Match Start Event
  multiplayerManager.on('matchStart', (matchData) => {
    console.log('Match started:', matchData);
    setupMatchUI(matchData);
  });

  // Match End Event
  multiplayerManager.on('matchEnd', (matchData) => {
    console.log('Match ended:', matchData);
    showMatchResults(matchData);
  });
}

// Example game functions
function startGame(setData) {
  const { metadata, endTime, teams } = setData;
  
  // Setup game with metadata
  console.log('Game metadata:', metadata);
  
  // Setup timer based on endTime
  const timeRemaining = endTime - Date.now();
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

function cleanupGame() {
  console.log('Cleaning up game resources');
}

function setupMatchUI(matchData) {
  console.log('Setting up match UI:', matchData);
}

function showMatchResults(matchData) {
  console.log('Showing match results:', matchData);
}