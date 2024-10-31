import React from 'react';
import { PLLAYButton, PLLAYWebView, usePLLAY } from '../src/plugins/pllay/react';
import '../src/plugins/pllay/styles.css';

function GameComponent() {
  const { isInitialized, currentGame, service } = usePLLAY();
  const [score, setScore] = React.useState(0);

  const handleStartGame = async () => {
    try {
      await service.startGame();
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const handleEndGame = async () => {
    try {
      await service.endGame(score);
    } catch (error) {
      console.error('Failed to end game:', error);
    }
  };

  if (!isInitialized) {
    return <div>Loading PLLAY...</div>;
  }

  return (
    <div>
      <PLLAYButton onClick={handleStartGame} visible={!currentGame}>
        Start Game
      </PLLAYButton>
      
      {currentGame && (
        <div>
          <h2>Game in Progress</h2>
          <input
            type="number"
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
          />
          <PLLAYButton onClick={handleEndGame}>
            End Game
          </PLLAYButton>
        </div>
      )}
      
      <PLLAYWebView />
    </div>
  );
}