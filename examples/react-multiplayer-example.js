import React from 'react';
import { PLLAYService } from '../src/plugins/pllay';

function MultiplayerGame() {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [matchStatus, setMatchStatus] = React.useState(null);
  const [currentSet, setCurrentSet] = React.useState(null);
  const multiplayerManager = React.useRef(null);

  React.useEffect(() => {
    // Initialize PLLAY
    PLLAYService.initialize({
      PUBLIC_KEY: 'your-public-key'
    }).then(() => {
      setIsInitialized(true);
      setupMultiplayer();
    }).catch(console.error);

    return () => {
      // Cleanup
      if (multiplayerManager.current) {
        multiplayerManager.current.removeAllListeners();
      }
    };
  }, []);

  const setupMultiplayer = () => {
    multiplayerManager.current = PLLAYService.getMultiplayerManager();

    // Register player
    multiplayerManager.current.registerInGamePlayerId('player123', JSON.stringify({
      level: 10,
      rank: 'gold'
    }));

    // Set up event listeners
    multiplayerManager.current
      .on('setStart', handleSetStart)
      .on('setEnd', handleSetEnd)
      .on('matchStart', handleMatchStart)
      .on('matchEnd', handleMatchEnd);
  };

  const handleSetStart = (setData) => {
    setCurrentSet(setData);
    // Initialize game lobby or start the game
  };

  const handleSetEnd = ({ matchId, setId }) => {
    setCurrentSet(null);
    // Clean up game resources
  };

  const handleMatchStart = (matchId) => {
    setMatchStatus({ id: matchId, status: 'active' });
    // Initialize match UI
  };

  const handleMatchEnd = (matchId) => {
    setMatchStatus(null);
    // Show match results
  };

  if (!isInitialized) {
    return <div>Loading PLLAY...</div>;
  }

  return (
    <div>
      <h1>Multiplayer Game</h1>
      
      {matchStatus && (
        <div>
          <h2>Match in Progress</h2>
          <p>Match ID: {matchStatus.id}</p>
        </div>
      )}

      {currentSet && (
        <div>
          <h3>Current Set</h3>
          <div>
            <h4>Players:</h4>
            <ul>
              {currentSet.players.map(player => (
                <li key={player.id}>
                  Player: {player.id}
                  {player.teamId && ` (Team ${player.teamId})`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!matchStatus && !currentSet && (
        <div>Waiting for match...</div>
      )}
    </div>
  );
}