import { PLLAYService } from '../src/plugins/pllay';

// Basic initialization
PLLAYService.initialize({
  PUBLIC_KEY: 'your-public-key'
}).then(() => {
  console.log('PLLAY initialized successfully');
}).catch(error => {
  console.error('Failed to initialize PLLAY:', error);
});

// Advanced initialization with all options
PLLAYService.initialize({
  PUBLIC_KEY: 'your-public-key',
  BASE_URL: 'https://api.pllay.io',
  PLAYER_BASE_URL: 'https://player.pllay.io',
  ANALYTICS_ENV: 'production'
}).then(() => {
  console.log('PLLAY initialized with custom configuration');
}).catch(error => {
  console.error('Failed to initialize PLLAY:', error);
});

// Event handling
PLLAYService
  .on('initialized', () => {
    console.log('PLLAY initialization complete');
  })
  .on('error', (error) => {
    console.error('PLLAY error:', error);
  })
  .on('gameStarted', (gameSession) => {
    console.log('Game started:', gameSession);
  })
  .on('gameEnded', (result) => {
    console.log('Game ended:', result);
  });

// Initialization status check
if (PLLAYService.isInitialized) {
  console.log('PLLAY is already initialized');
}