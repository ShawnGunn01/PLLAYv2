const { PLLAYService } = require('../src/plugins/pllay');
const GameManager = require('../src/plugins/pllay/game-manager');

// Initialize PLLAY
PLLAYService.initialize({
  PUBLIC_KEY: 'your-public-key'
}).then(() => {
  console.log('PLLAY initialized');
  startGameExample();
}).catch(console.error);

// Create game manager
const gameManager = new GameManager(PLLAYService);

// Configure allowed score types
gameManager.setScoreTypes(['points', 'points_extra']);

// Example game flow
async function startGameExample() {
  try {
    // Start game
    const gameSession = await gameManager.startGame();
    console.log('Game started:', gameSession);

    // Simulate game play
    setTimeout(async () => {
      try {
        // End game with regular score
        const result = await gameManager.endGame({
          points: 150.0,
          points_extra: 2.0
        });
        console.log('Game ended:', result);

        // Example with encrypted score
        const encryptedResult = await gameManager.endGameEncrypted(
          () => 'your-secret-key',
          {
            points: 150.0,
            points_extra: 2.0
          }
        );
        console.log('Game ended (encrypted):', encryptedResult);
      } catch (error) {
        console.error('Error ending game:', error);
      }
    }, 5000);
  } catch (error) {
    console.error('Error starting game:', error);
  }
}