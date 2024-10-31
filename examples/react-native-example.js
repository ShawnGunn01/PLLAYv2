import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import PLLAYService from '../src/plugins/pllay/react-native/PLLAYService';
import PLLAYButton from '../src/plugins/pllay/react-native/components/PLLAYButton';
import PLLAYWebView from '../src/plugins/pllay/react-native/components/PLLAYWebView';

export default function GameScreen() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    initializePLLAY();
    return () => cleanup();
  }, []);

  const initializePLLAY = async () => {
    try {
      await PLLAYService.initialize({
        PUBLIC_KEY: 'your-public-key'
      });
      setIsInitialized(true);
      setupCallbacks();
    } catch (error) {
      console.error('PLLAY initialization failed:', error);
    }
  };

  const setupCallbacks = () => {
    PLLAYService
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
      })
      .onMatchEnd((data) => {
        console.log('Match ended:', data);
        showResults();
      });
  };

  const startGame = async () => {
    try {
      PLLAYService.setButtonVisibility(false);
      const gameSession = await PLLAYService.startGame();
      setCurrentGame(gameSession);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const endGame = async () => {
    try {
      await PLLAYService.endGame({ points: score });
      setCurrentGame(null);
      PLLAYService.setButtonVisibility(true);
      
      // Maybe show notifications
      await PLLAYService.maybeShowNotifications();
      await PLLAYService.maybeShowAnnouncements();
    } catch (error) {
      console.error('Failed to end game:', error);
    }
  };

  const cleanup = () => {
    if (currentGame) {
      endGame();
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text>Initializing PLLAY...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!currentGame ? (
        <PLLAYButton onPress={startGame}>
          <Text style={styles.buttonText}>Start Game</Text>
        </PLLAYButton>
      ) : (
        <View style={styles.gameContainer}>
          <Text>Game in progress</Text>
          <Text>Score: {score}</Text>
          <PLLAYButton onPress={endGame}>
            <Text style={styles.buttonText}>End Game</Text>
          </PLLAYButton>
        </View>
      )}
      
      <PLLAYWebView style={styles.webview} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20
  },
  gameContainer: {
    alignItems: 'center',
    marginVertical: 20
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  webview: {
    height: 400,
    marginTop: 20
  }
});