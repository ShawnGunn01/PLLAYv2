const PLLAYiOSService = require('../src/plugins/pllay/ios/PLLAYiOSService');

// Initialize PLLAY
PLLAYiOSService.initialize({
  PUBLIC_KEY: 'your-public-key',
  autoReconnect: true
}).then(() => {
  console.log('PLLAY iOS SDK initialized');
  setupGame();
}).catch(error => {
  console.error('Failed to initialize PLLAY:', error);
});

async function setupGame() {
  try {
    // Register player
    await PLLAYiOSService.registerInGamePlayerId('player123', {
      level: 10,
      rank: 'gold'
    });

    // Hide PLLAY button during gameplay
    PLLAYiOSService.setButtonVisibility(false);

    // Start game
    const gameSession = await PLLAYiOSService.startGame();
    console.log('Game started:', gameSession);

    // Simulate game progress
    const score = { points: 100 };
    await PLLAYiOSService.progressGame(score);

    // End game
    const result = await PLLAYiOSService.endGame(score);
    console.log('Game ended:', result);

    // Show PLLAY button after game
    PLLAYiOSService.setButtonVisibility(true);

    // Maybe show notifications
    await PLLAYiOSService.maybeShowNotifications();
    await PLLAYiOSService.maybeShowAnnouncements();

  } catch (error) {
    console.error('Game error:', error);
  }
}