const { PLLAYService } = require('../src/plugins/pllay');
const NotificationManager = require('../src/plugins/pllay/notifications/NotificationManager');

// Initialize PLLAY
PLLAYService.initialize({
  PUBLIC_KEY: 'your-public-key'
}).then(() => {
  console.log('PLLAY initialized');
  setupNotifications();
}).catch(console.error);

function setupNotifications() {
  const notificationManager = new NotificationManager(PLLAYService);

  // Listen for notification events
  notificationManager.on('notification:shown', ({ type }) => {
    console.log(`${type} shown to user`);
  });

  notificationManager.on('notification:error', (error) => {
    console.error('Notification error:', error);
  });

  // Example game events where you might want to show notifications
  const gameEvents = {
    levelComplete: async () => {
      await notificationManager.maybeShowNotifications();
    },
    matchEnd: async () => {
      await notificationManager.maybeShowAnnouncements();
    },
    menuOpen: async () => {
      // Check both notifications and announcements
      await Promise.all([
        notificationManager.maybeShowNotifications(),
        notificationManager.maybeShowAnnouncements()
      ]);
    }
  };

  // Simulate game events (replace with your actual game events)
  setTimeout(gameEvents.levelComplete, 5000);
  setTimeout(gameEvents.matchEnd, 10000);
  setTimeout(gameEvents.menuOpen, 15000);
}