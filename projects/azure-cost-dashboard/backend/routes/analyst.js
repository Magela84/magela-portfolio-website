// Route for the AI Cost Analyst. Streams Claude's answer back as Server-Sent
// Events so the frontend can render it token-by-token.

const express = require('express');
const router = express.Router();

const aiAnalystService = require('../services/aiAnalystService');

// POST /api/analyst/ask   body: { question }
router.post('/ask', async (req, res) => {
  const question = (req.body && req.body.question ? String(req.body.question) : '').trim();

  if (!question) {
    return res.status(400).json({ error: true, message: 'A question is required.' });
  }
  if (!aiAnalystService.hasApiKey()) {
    // Surface a clean, actionable error before opening the event stream.
    return res.status(503).json({
      error: true,
      message: 'ANTHROPIC_API_KEY is not set — the AI analyst is unavailable.',
    });
  }

  // Set up the SSE stream.
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const context = await aiAnalystService.gatherContext();
    await aiAnalystService.streamAnswer(question, context, {
      onText: (text) => res.write(`data: ${JSON.stringify({ text })}\n\n`),
    });
    res.write('event: done\ndata: {}\n\n');
    res.end();
  } catch (err) {
    // Headers are already sent, so report the error inside the stream.
    res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
