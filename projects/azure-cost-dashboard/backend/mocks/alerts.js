// Mock budget data for demo / MOCK_DATA=true mode.
// Shape matches azureMonitorService.getBudgetAlerts().

function getMockBudgetAlerts() {
  return [
    {
      name: 'monthly-platform-budget',
      category: 'Cost',
      timeGrain: 'Monthly',
      amount: 6000,
      currency: 'USD',
      currentSpend: 5240.19,
      percentUsed: 87.3,
      timePeriod: { startDate: '2026-07-01T00:00:00Z' },
      notifications: [
        {
          name: 'actual_80',
          enabled: true,
          operator: 'GreaterThanOrEqualTo',
          threshold: 80,
          thresholdType: 'Actual',
          contactEmails: ['finops@example.com'],
        },
        {
          name: 'forecasted_100',
          enabled: true,
          operator: 'GreaterThanOrEqualTo',
          threshold: 100,
          thresholdType: 'Forecasted',
          contactEmails: ['finops@example.com'],
        },
      ],
    },
    {
      name: 'data-team-budget',
      category: 'Cost',
      timeGrain: 'Monthly',
      amount: 2000,
      currency: 'USD',
      currentSpend: 910.44,
      percentUsed: 45.5,
      timePeriod: { startDate: '2026-07-01T00:00:00Z' },
      notifications: [
        {
          name: 'actual_90',
          enabled: true,
          operator: 'GreaterThanOrEqualTo',
          threshold: 90,
          thresholdType: 'Actual',
          contactEmails: ['data-leads@example.com'],
        },
      ],
    },
    {
      name: 'sandbox-budget',
      category: 'Cost',
      timeGrain: 'Monthly',
      amount: 500,
      currency: 'USD',
      currentSpend: 523.71,
      percentUsed: 104.7,
      timePeriod: { startDate: '2026-07-01T00:00:00Z' },
      notifications: [
        {
          name: 'actual_100',
          enabled: true,
          operator: 'GreaterThan',
          threshold: 100,
          thresholdType: 'Actual',
          contactEmails: ['sandbox-owner@example.com'],
        },
      ],
    },
  ];
}

module.exports = { getMockBudgetAlerts };
