import { PLLAYService, PLLAYButton, PLLAYWebView } from '../src/plugins/pllay';
import '../src/plugins/pllay/styles.css';

// Initialize PLLAY
PLLAYService.initialize({
  PUBLIC_KEY: 'your-public-key',
  PLLAY_API_URL: 'https://api.pllay.io',
  PLAYER_BASE_URL: 'https://player.pllay.io',
  exposeGlobally: true
}).then(() => {
  console.log('PLLAY initialized');
}).catch(console.error);

// Create button
const buttonContainer = document.getElementById('pllay-button-container');
const button = new PLLAYButton(buttonContainer, { visible: true });
button.render();

// Create webview
const webviewContainer = document.getElementById('pllay-webview-container');
const webview = new PLLAYWebView(webviewContainer);
webview.render();

// Handle game events
let currentScore = 0;

button.button.addEventListener('click', async () => {
  if (!PLLAYService.isGameActive()) {
    try {
      await PLLAYService.startGame();
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  } else {
    try {
      await PLLAYService.endGame(currentScore);
    } catch (error) {
      console.error('Failed to end game:', error);
    }
  }
});