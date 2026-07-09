// Routes for Logic Apps status.

const express = require('express');
const router = express.Router();

const logicAppsService = require('../services/logicAppsService');

// GET /api/logicapps
router.get('/', async (req, res, next) => {
  try {
    const data = await logicAppsService.getLogicApps();
    res.json({ workflows: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
