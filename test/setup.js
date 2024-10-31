// Mock environment variables
process.env.PLLAY_BASE_URL = 'http://mock-api.pllay.test';
process.env.GAME_ID = 'test-game-id';
process.env.GAME_SECRET_KEY = 'test-secret-key';
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(() => {
  // Setup any global test requirements
});

afterAll(() => {
  // Cleanup after all tests
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});