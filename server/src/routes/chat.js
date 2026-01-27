const express = require('express');
const router = express.Router();
const geminiController = require('../controllers/geminiController');
const rateLimit = require('../middleware/rateLimit');

// Apply rate limiting
router.use(rateLimit);

// Chat endpoints
router.post('/message', geminiController.sendMessage);
router.post('/stream', geminiController.streamMessage);
router.delete('/history/:sessionId', geminiController.clearHistory);

module.exports = router;
