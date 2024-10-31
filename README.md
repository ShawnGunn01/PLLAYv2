# PLLAY Integration Service

Backend service for PLLAY integration including OAuth authentication, wager management, and anti-cheat validation.

## Features

- OAuth authentication flow
- Wager management
- Tournament management
- Score validation
- Anti-cheat system
- Real-time game session handling

## Documentation

- [API Documentation](http://localhost:3000/api-docs)
- [JSDoc Documentation](./docs/index.html)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
PLLAY_BASE_URL=https://api.pllay.io
PLLAY_API_URL=https://api.pllay.io
GAME_ID=your_game_id
GAME_SECRET_KEY=your_generated_secret_key
PORT=3000

# OAuth Configuration
PLLAY_OAUTH_URL=https://account.demo.pllay.io
PLLAY_OAUTH_API=https://oauth.demo.pllay.io
OAUTH_APP_ID=your_oauth_app_id
OAUTH_SECRET_KEY=your_oauth_secret_key
REDIRECT_URL=http://localhost:3000/oauth/callback
SERVICE_NAME=YourGameService
```

3. Start the server:
```bash
npm start
```

4. View API documentation:
- OpenAPI/Swagger: http://localhost:3000/api-docs
- JSDoc: Generate with `npm run docs` and open `./docs/index.html`

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Integration tests
npm run test:integration
```

## Error Handling

The service implements comprehensive error handling:
- Custom error classes for different scenarios
- Validation error handling
- Authentication/Authorization errors
- Rate limiting
- Global error middleware

## Logging

Multiple logging levels and outputs:
- HTTP request logging
- Error logging
- Audit logging
- Daily rotating log files

## Security

- Rate limiting
- Input validation
- Authentication middleware
- Authorization checks
- Secure headers