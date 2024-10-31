const PLLAYAndroidService = require('../src/plugins/pllay/android/PLLAYAndroidService');

// Initialize PLLAY
PLLAYAndroidService.initialize({
  PUBLIC_KEY: 'your-public-key',
  BASE_URL: 'https://api.pllay.io',
  PLAYER_BASE_URL: 'https://player.pllay.io'
}).then(() => {
  console.log('PLLAY Android SDK initialized');
  setupGame();
}).catch(error => {
  console.error('Failed to initialize PLLAY:', error);
});

function setupGame() {
  // Register player with metadata
  PLLAYAndroidService.registerInGamePlayerId('player123', {
    level: 10,
    rank: 'gold'
  });

  // Hide PLLAY button during gameplay
  PLLAYAndroidService.setButtonVisibility(false);

  // Set button position (if visible)
  PLLAYAndroidService.setButtonPosition(50, 50);

  // Register multiplayer callbacks
  PLLAYAndroidService
    .onGameSetStart((data) => {
      console.log('Game set started:', data);
      startGame(data);
    })
    .onGameSetEnd((data) => {
      console.log('Game set ended:', data);
      cleanupGame();
    })
    .onMatchStart((data) => {
      console.log('Match started:', data);
      setupMatch();
    })
    .onMatchEnd((data) => {
      console.log('Match ended:', data);
      showResults();
    });

  // Start a game
  PLLAYAndroidService.startGame()
    .then(gameSession => {
      console.log('Game started:', gameSession);
    })
    .catch(error => {
      console.error('Failed to start game:', error);
    });
}

// Example game functions
function startGame(data) {
  const { participants, globalMetadata, setEndTimeUnix } = data;
  
  // Initialize game with metadata
  console.log('Game metadata:', globalMetadata);
  
  // Setup timer
  const timeRemaining = setEndTimeUnix - Date.now();
  console.log('Time remaining:', timeRemaining);
  
  // Initialize teams
  participants.forEach((team, index) => {
    console.log(`Team ${index + 1}:`, team);
  });
}

function cleanupGame() {
  console.log('Cleaning up game resources');
}

function setupMatch() {
  console.log('Setting up match');
}

function showResults() {
  console.log('Showing match results');
  
  // Show PLLAY button again
  PLLAYAndroidService.setButtonVisibility(true);
  
  // Maybe show notifications
  PLLAYAndroidService.maybeShowNotifications();
  PLLAYAndroidService.maybeShowAnnouncements();
}