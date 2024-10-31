const { PLLAYService } = require('../src/plugins/pllay');
const PLLAYButton = require('../src/plugins/pllay/components/PLLAYButton');
require('../src/plugins/pllay/styles/button.css');

// Initialize PLLAY
PLLAYService.initialize({
  PUBLIC_KEY: 'your-public-key'
}).then(() => {
  console.log('PLLAY initialized');
  setupButton();
}).catch(console.error);

function setupButton() {
  const buttonContainer = document.getElementById('pllay-button-container');
  const button = new PLLAYButton(buttonContainer, {
    visible: true,
    text: 'PLLAY Now'
  });

  // Render the button
  button.render();

  // Example game states
  const gameStates = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused'
  };

  // Handle game state changes
  function handleGameStateChange(newState) {
    switch (newState) {
      case gameStates.PLAYING:
        button.setVisible(false);
        break;
      case gameStates.PAUSED:
      case gameStates.MENU:
        button.setVisible(true);
        break;
    }
  }

  // Simulate game state changes (replace with your actual game state management)
  setTimeout(() => handleGameStateChange(gameStates.PLAYING), 3000);
  setTimeout(() => handleGameStateChange(gameStates.PAUSED), 6000);
  setTimeout(() => handleGameStateChange(gameStates.MENU), 9000);

  // Clean up when needed
  function cleanup() {
    button.destroy();
  }

  // Handle page unload
  window.addEventListener('unload', cleanup);
}