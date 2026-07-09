// Routes for cost data (overview trend, cost-by-service).

const express = require('express');
const router = express.Router();

const azureCostService = require('../services/azureCostService');
const azureMonitorService = require('../services/azureMonitorService');
const { buildForecast } = require('../services/forecastService');

// Pull optional ?from=YYYY-MM-DD&to=YYYY-MM-DD off the request.
function parseRange(req) {
  const { from, to } = req.query;
  const range = {};
  if (from) range.from = from;
  if (to) range.to = to;
  return range;
}

// Timezone-safe 'YYYY-MM-DD' (m0 is 0-based month), avoiding UTC date shifts.
function ymd(y, m0, d) {
  return `${y}-${String(m0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// In mock mode, pretend we're this many days into the month so the burn-down
// chart has a rich actual-vs-projected story instead of a day or two of data.
const MOCK_FORECAST_DAY = 18;

// Build the "now" + month-to-date range the forecast should run against.
// Real mode uses the actual date; mock mode simulates mid-month.
function forecastContext(now = new Date()) {
  const y = now.getFullYear();
  const m0 = now.getMonth();
  const daysInMonth = new Date(y, m0 + 1, 0).getDate();

  let effectiveNow = now;
  if (process.env.MOCK_DATA === 'true') {
    const day = Math.min(MOCK_FORECAST_DAY, daysInMonth);
    effectiveNow = new Date(y, m0, day);
  }

  return {
    now: effectiveNow,
    range: { from: ymd(y, m0, 1), to: ymd(y, m0, effectiveNow.getDate()) },
  };
}

// GET /api/costs/overview
router.get('/overview', async (req, res, next) => {
  try {
    const data = await azureCostService.getCostOverview(parseRange(req));
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/costs/by-service
router.get('/by-service', async (req, res, next) => {
  try {
    const data = await azureCostService.getCostByService(parseRange(req));
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/costs/forecast
// Projects month-end spend from month-to-date data and compares to budget.
router.get('/forecast', async (req, res, next) => {
  try {
    const { now, range } = forecastContext();
    const [overview, budgets] = await Promise.all([
      azureCostService.getCostOverview(range),
      // Budgets are best-effort: a forecast is still useful without them.
      azureMonitorService.getBudgetAlerts().catch(() => []),
    ]);
    res.json(buildForecast(overview, budgets, now));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
