const React = require('react');
const PLLAYService = require('../PLLAYService');

const PLLAYButton = React.forwardRef(({ visible = true, onClick, className, style, children }, ref) => {
  return React.createElement(
    'button',
    {
      ref,
      className: `pllay-button ${className || ''}`,
      style: {
        display: visible ? 'block' : 'none',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background-color 0.3s',
        ...style
      },
      onClick,
      onMouseOver: (e) => {
        e.currentTarget.style.backgroundColor = '#0056b3';
      },
      onMouseOut: (e) => {
        e.currentTarget.style.backgroundColor = '#007bff';
      }
    },
    children
  );
});

const PLLAYWebView = React.forwardRef(({ width = '100%', height = '600px', className, style }, ref) => {
  return React.createElement(
    'div',
    {
      ref,
      className: `pllay-webview ${className || ''}`,
      style: {
        width,
        height,
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        ...style
      }
    }
  );
});

const usePLLAY = () => {
  const [isInitialized, setIsInitialized] = React.useState(PLLAYService.isInitialized);
  const [currentGame, setCurrentGame] = React.useState(PLLAYService.getCurrentGame());

  React.useEffect(() => {
    const handleInitialized = () => setIsInitialized(true);
    const handleGameStarted = (game) => setCurrentGame(game);
    const handleGameEnded = () => setCurrentGame(null);

    PLLAYService.on('initialized', handleInitialized);
    PLLAYService.on('gameStarted', handleGameStarted);
    PLLAYService.on('gameEnded', handleGameEnded);

    return () => {
      PLLAYService.off('initialized', handleInitialized);
      PLLAYService.off('gameStarted', handleGameStarted);
      PLLAYService.off('gameEnded', handleGameEnded);
    };
  }, []);

  return {
    isInitialized,
    currentGame,
    service: PLLAYService
  };
};

module.exports = {
  PLLAYButton,
  PLLAYWebView,
  usePLLAY,
  PLLAYService
};