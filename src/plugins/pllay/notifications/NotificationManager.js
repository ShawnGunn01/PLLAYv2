const EventEmitter = require('events');
const { PLLAYError } = require('../errors');

class NotificationManager extends EventEmitter {
  constructor(service) {
    super();
    this.service = service;
    this.queue = [];
    this.isShowing = false;
    this.lastShownTime = 0;
    this.minInterval = 300000; // 5 minutes in milliseconds
  }

  async maybeShowNotifications() {
    if (!this.service.isInitialized) {
      throw new PLLAYError('PLLAY service not initialized');
    }

    if (this.isShowing || !this.canShowNotification()) {
      return false;
    }

    try {
      this.isShowing = true;
      const result = await this.service.callPLLAY('maybeShowNotifications');
      if (result) {
        this.lastShownTime = Date.now();
        this.emit('notification:shown', { type: 'notification' });
      }
      return result;
    } catch (error) {
      this.emit('notification:error', error);
      throw new PLLAYError('Failed to show notifications', error);
    } finally {
      this.isShowing = false;
    }
  }

  async maybeShowAnnouncements() {
    if (!this.service.isInitialized) {
      throw new PLLAYError('PLLAY service not initialized');
    }

    if (this.isShowing || !this.canShowNotification()) {
      return false;
    }

    try {
      this.isShowing = true;
      const result = await this.service.callPLLAY('maybeShowAnnouncements');
      if (result) {
        this.lastShownTime = Date.now();
        this.emit('notification:shown', { type: 'announcement' });
      }
      return result;
    } catch (error) {
      this.emit('notification:error', error);
      throw new PLLAYError('Failed to show announcements', error);
    } finally {
      this.isShowing = false;
    }
  }

  canShowNotification() {
    return Date.now() - this.lastShownTime >= this.minInterval;
  }

  setMinInterval(interval) {
    if (typeof interval !== 'number' || interval < 0) {
      throw new PLLAYError('Invalid interval value');
    }
    this.minInterval = interval;
  }
}

module.exports = NotificationManager;