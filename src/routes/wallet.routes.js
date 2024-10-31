const express = require('express');
const router = express.Router();
const walletService = require('../services/wallet.service');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { walletSchema } = require('../validation/schemas/wallet.schema');
const asyncHandler = require('../middleware/async.middleware');

// Get wallet info
router.get('/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const wallet = await walletService.getWallet(req.user.id);
    res.json({
      success: true,
      wallet
    });
  })
);

// Get transaction history
router.get('/transactions',
  requireAuth,
  validate(walletSchema.transactionHistory),
  asyncHandler(async (req, res) => {
    const transactions = await walletService.getTransactionHistory(
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