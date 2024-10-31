module.exports = {
  ...require('./jest.config'),
  testMatch: [
    '**/test/integration/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/test/integration/setup.js'],
  globalSetup: '<rootDir>/test/globalSetup.js',
  globalTeardown: '<rootDir>/test/globalTeardown.js'
};