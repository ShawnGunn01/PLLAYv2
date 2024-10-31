const express = require('express');
const router = express.Router();
const strikeService = require('../services/strike.service');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { cryptoPaymentSchema } = require('../validation/schemas/crypto-payment.schema');
const asyncHandler = require('../middleware/async.middleware');

// Create invoice for crypto payment
router.post('/invoice',
  requireAuth,
  validate(cryptoPaymentSchema.createInvoice),
  asyncHandler(async (req, res) => {
    const { amount, currency, description } = req.body;
    const invoice = await strikeService.createInvoice(amount, currency, description);
    res.json({
      success: true,
      invoice
    });
  })
);

// Get invoice status
router.get('/invoice/:invoiceId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const invoice = await strikeService.getInvoice(req.params.invoiceId);
    res.json({
      success: true,
      invoice
    });
  })
);

// Create quote for invoice
router.post('/invoice/:invoiceId/quote',
  requireAuth,
  asyncHandler(async (req, res) => {
    const quote = await strikeService.createQuote(req.params.invoiceId);
    res.json({
      success: true,
      quote
    });
  })
);

// Get quote status
router.get('/quote/:quoteId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const quote = await strikeService.getQuote(req.params.quoteId);
    res.json({
      success: true,
      quote
    });
  })
);

// Strike webhook endpoint
router.post('/webhook',
  asyncHandler(async (req, res) => {
    const signature = req.headers['strike-signature'];
    await strikeService.handleWebhook(JSON.stringify(req.body), signature);
    res.json({ success: true });
  })
);

module.exports = router;