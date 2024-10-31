class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (this.shouldReset()) {
        this.halfOpen();
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.open();
    }
  }

  open() {
    this.state = 'OPEN';
  }

  halfOpen() {
    this.state = 'HALF_OPEN';
    this.failureCount = 0;
  }

  shouldReset() {
    return Date.now() - this.lastFailureTime >= this.resetTimeout;
  }

  getState() {
    return this.state;
  }

  reset() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }
}

module.exports = CircuitBreaker;