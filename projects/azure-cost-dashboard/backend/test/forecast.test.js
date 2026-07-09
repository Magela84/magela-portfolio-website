// Unit tests for the forecast math. Run with `npm test` (Node's built-in runner).

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { buildForecast, linearRegression } = require('../services/forecastService');

// Build a month-to-date daily series with a fixed cost per day.
function mtdSeries(year, month0, days, cost) {
  const out = [];
  for (let d = 1; d <= days; d++) {
    const date = `${year}-${String(month0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    out.push({ date, cost });
  }
  return out;
}

test('linearRegression fits a straight line', () => {
  const { slope, intercept } = linearRegression([
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 6 },
  ]);
  assert.ok(Math.abs(slope - 2) < 1e-9, `slope was ${slope}`);
  assert.ok(Math.abs(intercept) < 1e-9, `intercept was ${intercept}`);
});

test('linearRegression handles empty input', () => {
  const { slope, intercept } = linearRegression([]);
  assert.equal(slope, 0);
  assert.equal(intercept, 0);
});

test('buildForecast: projected month-end equals the final burn-down point', () => {
  // 10 days into a 31-day month, $100/day, $5000 monthly budget.
  const now = new Date(2026, 2, 10); // March 10, 2026 (local)
  const overview = { currency: 'USD', series: mtdSeries(2026, 2, 10, 100) };
  const budgets = [{ timeGrain: 'Monthly', amount: 5000, name: 'test-budget' }];

  const f = buildForecast(overview, budgets, now);

  const lastProjected = f.burndown[f.burndown.length - 1].projected;
  assert.ok(
    Math.abs(f.projectedMonthEnd - lastProjected) < 0.01,
    `projectedMonthEnd ${f.projectedMonthEnd} != last burndown ${lastProjected}`
  );
});

test('buildForecast: month-to-date and today’s cumulative agree (timezone-safe)', () => {
  const now = new Date(2026, 2, 10);
  const overview = { currency: 'USD', series: mtdSeries(2026, 2, 10, 100) };
  const f = buildForecast(overview, [], now);

  assert.equal(f.monthToDateSpend, 1000);
  assert.equal(f.daysElapsed, 10);
  assert.equal(f.daysInMonth, 31);
  assert.equal(f.burndown.length, 31);

  // The day-index mapping uses string slicing, not Date.getDate(), so the
  // actual-vs-projected split must line up exactly regardless of timezone.
  const today = f.burndown[f.daysElapsed - 1];
  assert.equal(today.actual, f.monthToDateSpend);
  assert.equal(f.burndown[0].actual, 100); // first day cumulative
  assert.equal(f.burndown[f.daysElapsed].actual, null); // first projected-only day
});

test('buildForecast: status reflects budget position', () => {
  const now = new Date(2026, 2, 10);
  const series = mtdSeries(2026, 2, 10, 100); // ~ $3100 projected month-end

  const under = buildForecast({ currency: 'USD', series }, [{ timeGrain: 'Monthly', amount: 5000 }], now);
  assert.equal(under.status, 'under');

  const over = buildForecast({ currency: 'USD', series }, [{ timeGrain: 'Monthly', amount: 2000 }], now);
  assert.equal(over.status, 'over');
  assert.ok(over.projectedOverage > 0);

  const none = buildForecast({ currency: 'USD', series }, [], now);
  assert.equal(none.status, 'no-budget');
  assert.equal(none.budget, null);
});
