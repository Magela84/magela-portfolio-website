// Pure forecasting helpers over a daily cost series. No Azure calls here — the
// route feeds this month-to-date cost data + budgets, so it works identically
// in mock and live modes and is trivially testable.

function round2(n) {
  return Number(Number(n).toFixed(2));
}

// Least-squares linear regression over [{x, y}] points → { slope, intercept }.
// Used to project remaining days along the observed spend trend (not just a
// flat average), so an accelerating bill forecasts higher.
function linearRegression(points) {
  const n = points.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (const { x, y } of points) {
    sx += x;
    sy += y;
    sxy += x * y;
    sxx += x * x;
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return { slope: 0, intercept: sy / n };
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// Day-of-month from a 'YYYY-MM-DD' string WITHOUT going through Date(), which
// would parse as UTC midnight and shift the day in negative-offset timezones.
function dayOfMonth(dateStr) {
  return Number(String(dateStr).slice(8, 10));
}

/**
 * Project month-end spend from a month-to-date daily series and compare it to
 * the largest monthly budget, producing a day-by-day burn-down for charting.
 *
 * @param {{ currency?: string, series?: Array<{date: string, cost: number}> }} overview
 * @param {Array<object>} budgets  budgets from the Consumption API
 * @param {Date} now  injectable for testing
 */
function buildForecast(overview, budgets = [], now = new Date()) {
  const currency = overview.currency || 'USD';
  const series = [...(overview.series || [])].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const daysRemaining = Math.max(daysInMonth - daysElapsed, 0);

  // Regression over (day-of-month, daily cost) to capture trend.
  const points = series.map((p) => ({ x: dayOfMonth(p.date), y: p.cost }));
  const { slope, intercept } = linearRegression(points);

  const monthToDateSpend = series.reduce((s, p) => s + p.cost, 0);
  const avgDailyCost = daysElapsed > 0 ? monthToDateSpend / daysElapsed : 0;

  // Project each remaining day along the trend line (never below zero).
  const projectedDaily = {};
  let projectedRemaining = 0;
  for (let d = daysElapsed + 1; d <= daysInMonth; d++) {
    const val = Math.max(intercept + slope * d, 0);
    projectedDaily[d] = val;
    projectedRemaining += val;
  }
  const projectedMonthEnd = monthToDateSpend + projectedRemaining;

  // Reference budget = the largest active monthly cost budget.
  const monthly = budgets
    .filter((b) => String(b.timeGrain || '').toLowerCase() === 'monthly' && b.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const chosen = monthly[0] || null;
  const budgetAmount = chosen ? chosen.amount : 0;
  const hasBudget = !!chosen;

  // Day-by-day burn-down: actual cumulative up to today, projected cumulative
  // continuing to month-end, plus a flat budget reference value per point.
  const actualByDay = {};
  for (const p of series) actualByDay[dayOfMonth(p.date)] = p.cost;

  const dayDate = (d) => `${year}-${pad(month + 1)}-${pad(d)}`;
  const burndown = [];
  let cum = 0;
  let budgetExhaustionDate = null;
  for (let d = 1; d <= daysInMonth; d++) {
    let actual = null;
    if (d <= daysElapsed) {
      cum += actualByDay[d] || 0;
      actual = round2(cum);
    } else {
      cum += projectedDaily[d] || 0;
    }
    if (hasBudget && !budgetExhaustionDate && cum >= budgetAmount) {
      budgetExhaustionDate = dayDate(d);
    }
    burndown.push({
      date: dayDate(d),
      actual, // null for future days
      projected: round2(cum),
      budget: hasBudget ? round2(budgetAmount) : null,
    });
  }

  const projectedOverage = hasBudget ? Math.max(projectedMonthEnd - budgetAmount, 0) : 0;
  let status = 'no-budget';
  if (hasBudget) {
    if (projectedMonthEnd > budgetAmount) status = 'over';
    else if (projectedMonthEnd > budgetAmount * 0.9) status = 'warning';
    else status = 'under';
  }

  return {
    currency,
    daysInMonth,
    daysElapsed,
    daysRemaining,
    monthToDateSpend: round2(monthToDateSpend),
    avgDailyCost: round2(avgDailyCost),
    trendPerDay: round2(slope),
    projectedMonthEnd: round2(projectedMonthEnd),
    budget: hasBudget ? { name: chosen.name, amount: round2(budgetAmount) } : null,
    projectedOverage: round2(projectedOverage),
    budgetExhaustionDate,
    status,
    burndown,
  };
}

module.exports = { buildForecast, linearRegression };
