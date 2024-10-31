const { startServer } = require('./testServer');

module.exports = async () => {
  // Start test server
  global.__SERVER__ = await startServer();
  
  // Set up any other global test requirements
  process.env.TEST_SERVER_PORT = global.__SERVER__.address().port;
};