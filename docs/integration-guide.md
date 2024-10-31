# PLLAY Integration Guide

## Overview

PLLAY provides a comprehensive API for integrating skill-based gaming with real-money wagering capabilities. This guide covers the essential steps for integrating PLLAY into your game.

## Prerequisites

1. PLLAY Developer Account
2. Game ID and Secret Key
3. OAuth Application credentials

## Integration Steps

### 1. Authentication

First, implement OAuth authentication to allow users to connect their PLLAY accounts:

```javascript
// Get OAuth URL
const response = await fetch('https://api.pllay.io/oauth/auth-url');
const { authUrl } = await response.json();

// Redirect user to authUrl
window.location.href = authUrl;
```

### 2. KYC Verification

Users must complete KYC verification before wagering:

```javascript
// Start KYC verification
const response = await fetch('https://api.pllay.io/kyc/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ publicToken })
});
```

### 3. Payments

Implement payment processing:

```javascript
// Create payment intent
const response = await fetch('https://api.pllay.io/payments/intent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 1000,
    currency: 'USD'
  })
});
```

### 4. Wagers

Handle wager creation and management:

```javascript
// Create wager
const response = await fetch('https://api.pllay.io/wager', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    gameId: 'your-game-id',
    amount: 1000
  })
});
```

## Webhooks

PLLAY uses webhooks to notify your application of important events:

1. Set up webhook endpoint in your application
2. Configure webhook URL in PLLAY dashboard
3. Handle webhook events:

```javascript
app.post('/webhooks/pllay', (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'kyc.completed':
      handleKYCCompletion(event.data);
      break;
    case 'payment.succeeded':
      handlePaymentSuccess(event.data);
      break;
    // Handle other events
  }
  
  res.json({ received: true });
});
```

## Security

1. Always verify webhook signatures
2. Use HTTPS for all API calls
3. Never expose your Game Secret Key
4. Implement rate limiting
5. Validate user input

## Testing

1. Use sandbox environment for development
2. Test with test cards and bank accounts
3. Simulate various webhook events
4. Verify KYC flow with test documents

## Going Live

1. Complete integration checklist
2. Submit for review
3. Receive production credentials
4. Deploy to production

## Support

- Documentation: https://docs.pllay.io
- Support Email: support@pllay.io
- Developer Discord: https://discord.gg/pllay-dev