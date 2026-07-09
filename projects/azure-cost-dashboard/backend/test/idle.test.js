// Unit tests for the Idle Resource Hunter aggregation, exercised through the
// mock data path (no Azure credentials needed).

const { test } = require('node:test');
const assert = require('node:assert/strict');

// The service reads MOCK_DATA at call time, so set it before requiring.
process.env.MOCK_DATA = 'true';
const idle = require('../services/idleResourceService');

test('mock idle summary is internally consistent', async () => {
  const r = await idle.getIdleResources();

  assert.equal(r.findingCount, r.findings.length);
  assert.ok(r.findings.length > 0);

  // Total waste equals the sum of individual findings.
  const sum = r.findings.reduce((s, f) => s + f.monthlyCost, 0);
  assert.ok(Math.abs(sum - r.totalMonthlyWaste) < 0.01, `sum ${sum} != total ${r.totalMonthlyWaste}`);

  // Per-type totals also reconcile to the headline.
  const byTypeSum = Object.values(r.byType).reduce((s, t) => s + t.monthlyCost, 0);
  assert.ok(Math.abs(byTypeSum - r.totalMonthlyWaste) < 0.01, `byType ${byTypeSum} != total ${r.totalMonthlyWaste}`);
});

test('mock findings are sorted by monthly cost, descending', async () => {
  const r = await idle.getIdleResources();
  for (let i = 1; i < r.findings.length; i++) {
    assert.ok(
      r.findings[i - 1].monthlyCost >= r.findings[i].monthlyCost,
      `not sorted at index ${i}`
    );
  }
});

test('every finding carries the fields the UI renders', async () => {
  const r = await idle.getIdleResources();
  for (const f of r.findings) {
    for (const field of ['id', 'type', 'name', 'reason', 'monthlyCost', 'actionHint']) {
      assert.ok(f[field] !== undefined && f[field] !== null, `finding missing ${field}: ${JSON.stringify(f)}`);
    }
    assert.equal(typeof f.monthlyCost, 'number');
  }
});
