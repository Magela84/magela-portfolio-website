// Routes for budget alerts (backed by the Consumption budgets API).

const express = require('express');
const router = express.Router();

const azureMonitorService = require('../services/azureMonitorService');

// GET /api/alerts
router.get('/', async (req, res, next) => {
  try {
    const data = await azureMonitorService.getBudgetAlerts();
    res.json({ budgets: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
