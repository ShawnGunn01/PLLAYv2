const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment.service');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { paymentSchema } = require('../validation/schemas/payment.schema');
const asyncHandler = require('../middleware/async.middleware');

router.post('/intent',
  requireAuth,
  validate(paymentSchema.intent),
  asyncHandler(async (req, res) => {
    const { amount, currency } = req.body;
    const intent = await paymentService.createPaymentIntent(
      req.user.id,
      amount,
      currency
    );
    res.json({
      success: true,
      intent
    });
  })
);

router.post('/process',
  requireAuth,
  validate(paymentSchema.process),
  asyncHandler(async (req, res) => {
    const { paymentIntentId, paymentMethodId } = req.body;
    const result = await paymentService.processPayment(
      paymentIntentId,
      paymentMethodId
    );
    res.json({
      success: true,
      payment: result
    });
  })
);

router.post('/refund',
  requireAuth,
  validate(paymentSchema.refund),
  asyncHandler(async (req, res) => {
    const { paymentId, amount } = req.body;
    const refund = await paymentService.refundPayment(paymentId, amount);
    res.json({
      success: true,
      refund
    });
  })
);

router.get('/methods',
  requireAuth,
  asyncHandler(async (req, res) => {
    const methods = await paymentService.getPaymentMethods(req.user.id);
    res.json({
      success: true,
      methods
    });
  })
);

router.get('/transactions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const transactions = await paymentService.getTransactionHistory(
      req.user.id,
      req.query
    );
    res.json({
      success: true,
      transactions
    });
  })
);

module.exports = router;