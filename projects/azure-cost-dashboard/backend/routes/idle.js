// Route for the Idle Resource Hunter.

const express = require('express');
const router = express.Router();

const idleResourceService = require('../services/idleResourceService');

// GET /api/idle
router.get('/', async (req, res, next) => {
  try {
    const data = await idleResourceService.getIdleResources();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
