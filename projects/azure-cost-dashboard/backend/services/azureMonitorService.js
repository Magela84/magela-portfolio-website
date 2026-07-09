// Budget-alert service.
//
// NOTE: Azure *budgets* (amount, current spend, notification thresholds) are
// exposed by the Consumption API, NOT by @azure/arm-monitor. We use
// @azure/arm-consumption here. @azure/arm-monitor covers metric/activity-log
// alerts, which is a different concept from cost budgets.

const { DefaultAzureCredential } = require('@azure/identity');
const { ConsumptionManagementClient } = require('@azure/arm-consumption');

const mockAlerts = require('../mocks/alerts');

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
    cachedClient = new ConsumptionManagementClient(credential, subscriptionId);
  }
  return cachedClient;
}

// Flatten a budget's notification map into an array of threshold rules.
function mapNotifications(notifications = {}) {
  return Object.entries(notifications).map(([key, n]) => ({
    name: key,
    enabled: n.enabled,
    operator: n.operator, // e.g. GreaterThan / GreaterThanOrEqualTo
    threshold: n.threshold, // percentage of the budget amount
    thresholdType: n.thresholdType, // Actual / Forecasted
    contactEmails: n.contactEmails || [],
  }));
}

/**
 * List all budgets scoped to the subscription, with current spend and the
 * percentage of each budget consumed so the UI can flag over-threshold ones.
 * @returns {Promise<Array<object>>}
 */
async function getBudgetAlerts() {
  if (useMock()) return mockAlerts.getMockBudgetAlerts();

  const client = getClient();
  const scope = `/subscriptions/${subscriptionId}`;

  const budgets = [];
  for await (const b of client.budgets.list(scope)) {
    const amount = Number(b.amount ?? 0);
    const spent = Number(b.currentSpend?.amount ?? 0);
    const percentUsed = amount > 0 ? (spent / amount) * 100 : 0;

    budgets.push({
      name: b.name,
      category: b.category, // Cost / Usage
      timeGrain: b.timeGrain, // Monthly / Quarterly / Annually
      amount,
      currency: b.currentSpend?.unit || 'USD',
      currentSpend: spent,
      percentUsed: Number(percentUsed.toFixed(1)),
      timePeriod: b.timePeriod,
      notifications: mapNotifications(b.notifications),
    });
  }

  return budgets;
}

module.exports = {
  getClient,
  getBudgetAlerts,
  subscriptionId,
};
