// Mock Logic Apps data for demo / MOCK_DATA=true mode.
// Shape matches logicAppsService.getLogicApps().

function isoMinutesAgo(minutes) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
}

function getMockLogicApps() {
  return [
    {
      name: 'invoice-ingestion',
      id: '/subscriptions/mock/resourceGroups/demo-rg/providers/Microsoft.Logic/workflows/invoice-ingestion',
      state: 'Enabled',
      location: 'eastus',
      createdTime: '2026-01-12T09:00:00Z',
      changedTime: '2026-06-20T14:30:00Z',
      latestRun: {
        status: 'Succeeded',
        startTime: isoMinutesAgo(18),
        endTime: isoMinutesAgo(17),
        correlationId: 'run-9f3a2c',
      },
    },
    {
      name: 'nightly-cost-export',
      id: '/subscriptions/mock/resourceGroups/demo-rg/providers/Microsoft.Logic/workflows/nightly-cost-export',
      state: 'Enabled',
      location: 'eastus',
      createdTime: '2025-11-03T09:00:00Z',
      changedTime: '2026-05-01T11:00:00Z',
      latestRun: {
        status: 'Failed',
        startTime: isoMinutesAgo(320),
        endTime: isoMinutesAgo(319),
        correlationId: 'run-4b71de',
      },
    },
    {
      name: 'alert-router',
      id: '/subscriptions/mock/resourceGroups/demo-rg/providers/Microsoft.Logic/workflows/alert-router',
      state: 'Enabled',
      location: 'westeurope',
      createdTime: '2026-02-28T09:00:00Z',
      changedTime: '2026-06-28T08:15:00Z',
      latestRun: {
        status: 'Running',
        startTime: isoMinutesAgo(2),
        endTime: null,
        correlationId: 'run-c0ffee',
      },
    },
    {
      name: 'legacy-sync',
      id: '/subscriptions/mock/resourceGroups/demo-rg/providers/Microsoft.Logic/workflows/legacy-sync',
      state: 'Disabled',
      location: 'eastus',
      createdTime: '2024-08-15T09:00:00Z',
      changedTime: '2026-03-10T16:45:00Z',
      latestRun: null,
    },
  ];
}

module.exports = { getMockLogicApps };
