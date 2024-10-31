export class PLLAYError extends Error {
  public originalError: Error | null;

  constructor(message: string, originalError: Error | null = null) {
    super(message);
    this.name = 'PLLAYError';
    this.originalError = originalError;

    if (originalError?.stack) {
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