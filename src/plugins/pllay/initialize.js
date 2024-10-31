const PLLAYService = require('./PLLAYService');

function initializePLLAY(config) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('PLLAY plugin requires a browser environment'));
      return;
    }

    // Initialize the service
    PLLAYService.initialize(config)
      .then(() => {
        // Expose service globally if needed
        if (config.exposeGlobally) {
          window.PLLAYService = PLLAYService;
        }

        resolve(PLLAYService);
      })
      .catch(reject);
  });
}

module.exports = {
  initializePLLAY
};