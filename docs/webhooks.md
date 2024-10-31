# PLLAY Webhooks

## Overview

PLLAY uses webhooks to notify your application about events that happen in your integration. This guide explains how to handle webhook notifications securely.

## Events

### KYC Events

- `kyc.started`: KYC verification process initiated
- `kyc.completed`: KYC verification completed successfully
- `kyc.failed`: KYC verification failed

### Payment Events

- `payment.created`: Payment intent created
- `payment.succeeded`: Payment completed successfully
- `payment.failed`: Payment failed
- `payment.refunded`: Payment refunded

### Wager Events

- `wager.created`: New wager created
- `wager.completed`: Wager completed
- `wager.cancelled`: Wager cancelled

### Tournament Events

- `tournament.started`: Tournament started
- `tournament.ended`: Tournament ended
- `tournament.cancelled`: Tournament cancelled

## Webhook Format

```json
{
  "id": "evt_123",
  "type": "payment.succeeded",
  "created": 1631825456,
  "data": {
    "object": {
      "id": "pay_123",
      "amount": 1000,
      "currency": "USD",
      "status": "succeeded"
    }
  }
}
```

## Security

### Verifying Signatures

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const expectedSignature = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Best Practices

1. Always verify webhook signatures
2. Process webhooks asynchronously
3. Return 200 response quickly
4. Implement retry logic
5. Monitor webhook failures

## Testing

Use the webhook tester in your dashboard to simulate events:

1. Go to Dashboard > Webhooks
2. Click "Send Test Webhook"
3. Select event type
4. Verify your endpoint receives and processes the event

## Handling Failures

1. Implement exponential backoff
2. Log failed webhooks
3. Set up monitoring
4. Configure retry settings
5. Handle duplicate events

## Example Implementation

```javascript
const express = require('express');
const router = express.Router();

router.post('/webhooks/pllay', async (req, res) => {
  const signature = req.headers['pllay-signature'];
  
  // Return quickly
  res.json({ received: true });
  
  // Process asynchronously
  try {
    if (!verifyWebhookSignature(req.rawBody, signature, process.env.WEBHOOK_SECRET)) {
      throw new Error('Invalid signature');
    }
    
    const event = req.body;
    await processWebhook(event);
  } catch (error) {
    // Log error and retry later
    console.error('Webhook processing failed:', error);
    await queueForRetry(req.body);
  }
});

async function processWebhook(event) {
  switch (event.type) {
    case 'kyc.completed':
      await handleKYCCompletion(event.data);
      break;
    case 'payment.succeeded':
      await handlePaymentSuccess(event.data);
      break;
    // Handle other events
  }
}
```