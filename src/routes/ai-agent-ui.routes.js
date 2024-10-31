const express = require('express');
const router = express.Router();
const aiAgentUIService = require('../services/ai-agent-ui.service');
const asyncHandler = require('../middleware/async.middleware');

// Serve dynamic pages
router.get('/p/:pageId', asyncHandler(async (req, res) => {
  const html = await aiAgentUIService.getPage(req.params.pageId);
  res.send(html);
}));

module.exports = router;