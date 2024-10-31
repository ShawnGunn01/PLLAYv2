const { check, sleep } = require('k6');
const http = require('k6/http');

export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up
    { duration: '3m', target: 50 }, // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100
    { duration: '3m', target: 100 }, // Stay at 100
    { duration: '1m', target: 0 } // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
    http_req_failed: ['rate<0.01'] // Less than 1% of requests should fail
  }
};

const BASE_URL = 'http://localhost:3000';

export default function() {
  // Create payment intent
  const paymentIntent = http.post(`${BASE_URL}/payments/intent`, {
    amount: 1000,
    currency: 'USD'
  });
  check(paymentIntent, {
    'payment intent created': (r) => r.status === 200
  });
  sleep(1);

  // Process payment
  const payment = http.post(`${BASE_URL}/payments/process`, {
    paymentIntentId: paymentIntent.json().id,
    paymentMethodId: 'test_card_success'
  });
  check(payment, {
    'payment processed': (r) => r.status === 200
  });
  sleep(1);

  // Get transaction history
  const history = http.get(`${BASE_URL}/payments/transactions`);
  check(history, {
    'transaction history retrieved': (r) => r.status === 200
  });
  sleep(1);
}