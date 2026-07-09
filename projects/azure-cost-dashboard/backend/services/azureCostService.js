// Service wrapper around @azure/arm-costmanagement.
// Runs Cost Management "usage" queries scoped to the configured subscription.

const { DefaultAzureCredential } = require('@azure/identity');
const { CostManagementClient } = require('@azure/arm-costmanagement');

const mockCosts = require('../mocks/costs');

const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;

let cachedClient;

function useMock() {
  return process.env.MOCK_DATA === 'true';
}

function getClient() {
  if (!cachedClient) {
    if (!subscriptionId) {
      throw new Error('AZURE_SUBSCRIPTION_ID is not set');
    }
    const credential = new DefaultAzureCredential();
    // CostManagementClient takes the scope per-call, not in the constructor.
    cachedClient = new CostManagementClient(credential);
  }
  return cachedClient;
}

function subscriptionScope() {
  return `/subscriptions/${subscriptionId}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRateLimited(err) {
  const status = err && (err.statusCode || err.status || err.code);
  return status === 429;
}

// Run an Azure call, and if it comes back rate-limited (429), wait 2s and
// retry exactly once before giving up.
async function withRetry(fn) {
  try {
    return await fn();
  } catch (err) {
    if (isRateLimited(err)) {
      // eslint-disable-next-line no-console
      console.log('[Retry] Azure rate limited, retrying in 2s...');
      await sleep(2000);
      return fn();
    }
    throw err;
  }
}

// Cost Management returns untyped `rows` alongside `columns`. Build a
// name -> index map so we can read values by column name regardless of order.
function indexColumns(columns = []) {
  const map = {};
  columns.forEach((col, i) => {
    if (col && col.name) map[col.name] = i;
  });
  return map;
}

// UsageDate comes back as an integer like 20260701. Turn it into YYYY-MM-DD.
function parseUsageDate(value) {
  const s = String(value);
  if (s.length !== 8) return s;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from, to };
}

/**
 * Total spend broken down by day, for a trend chart.
 * @param {{ from?: Date|string, to?: Date|string }} range
 * @returns {Promise<{ currency: string, total: number, series: Array<{date: string, cost: number}> }>}
 */
async function getCostOverview(range = {}) {
  if (useMock()) return mockCosts.getMockCostOverview(range);

  const client = getClient();
  const { from, to } = { ...defaultRange(), ...range };

  const result = await withRetry(() =>
    client.query.usage(subscriptionScope(), {
      type: 'ActualCost',
      timeframe: 'Custom',
      timePeriod: { from: new Date(from), to: new Date(to) },
      dataset: {
        granularity: 'Daily',
        aggregation: {
          totalCost: { name: 'Cost', function: 'Sum' },
        },
      },
    })
  );

  const cols = indexColumns(result.columns);
  const rows = result.rows || [];

  let total = 0;
  let currency = 'USD';
  const series = rows.map((row) => {
    const cost = Number(row[cols.Cost] ?? 0);
    total += cost;
    if (cols.Currency != null && row[cols.Currency]) currency = row[cols.Currency];
    return { date: parseUsageDate(row[cols.UsageDate]), cost };
  });

  // Ensure chronological order for the chart.
  series.sort((a, b) => a.date.localeCompare(b.date));

  return { currency, total, series };
}

/**
 * Spend grouped by Azure service (e.g. Virtual Machines, Storage), for the
 * given range. Sorted descending by cost.
 * @param {{ from?: Date|string, to?: Date|string }} range
 * @returns {Promise<{ currency: string, services: Array<{service: string, cost: number}> }>}
 */
async function getCostByService(range = {}) {
  if (useMock()) return mockCosts.getMockCostByService(range);

  const client = getClient();
  const { from, to } = { ...defaultRange(), ...range };

  const result = await withRetry(() =>
    client.query.usage(subscriptionScope(), {
      type: 'ActualCost',
      timeframe: 'Custom',
      timePeriod: { from: new Date(from), to: new Date(to) },
      dataset: {
        granularity: 'None',
        aggregation: {
          totalCost: { name: 'Cost', function: 'Sum' },
        },
        grouping: [{ type: 'Dimension', name: 'ServiceName' }],
      },
    })
  );

  const cols = indexColumns(result.columns);
  const rows = result.rows || [];

  let currency = 'USD';
  const services = rows.map((row) => {
    if (cols.Currency != null && row[cols.Currency]) currency = row[cols.Currency];
    return {
      service: row[cols.ServiceName] || 'Unknown',
      cost: Number(row[cols.Cost] ?? 0),
    };
  });

  services.sort((a, b) => b.cost - a.cost);

  return { currency, services };
}

module.exports = {
  getClient,
  getCostOverview,
  getCostByService,
  subscriptionId,
};
