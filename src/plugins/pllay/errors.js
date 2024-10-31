class PLLAYError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'PLLAYError';
    this.originalError = originalError;

    if (originalError && originalError.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message
      } : null
    };
  }
}

module.exports = {
  PLLAYError
};