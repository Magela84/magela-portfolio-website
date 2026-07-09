// Mock cost data for demo / MOCK_DATA=true mode.
// Shapes match azureCostService return values exactly.

const CURRENCY = 'USD';

// Build a daily series across the requested range (defaults to last 30 days),
// with a weekday/weekend rhythm so the trend chart looks realistic.
function getMockCostOverview(range = {}) {
  const to = range.to ? new Date(range.to) : new Date();
  const from = range.from
    ? new Date(range.from)
    : (() => {
        const d = new Date(to);
        d.setDate(d.getDate() - 29);
        return d;
      })();

  const series = [];
  let total = 0;
  const cursor = new Date(from);
  while (cursor <= to) {
    const day = cursor.getDay();
    const isWeekend = day === 0 || day === 6;
    // Base weekday spend ~ $210, weekends dip, plus a small deterministic wobble.
    const wobble = ((cursor.getDate() * 7) % 11) - 5;
    const cost = Number(((isWeekend ? 140 : 210) + wobble).toFixed(2));
    total += cost;
    series.push({ date: cursor.toISOString().slice(0, 10), cost });
    cursor.setDate(cursor.getDate() + 1);
  }

  return { currency: CURRENCY, total: Number(total.toFixed(2)), series };
}

function getMockCostByService() {
  const services = [
    { service: 'Virtual Machines', cost: 1842.55 },
    { service: 'Azure SQL Database', cost: 1210.3 },
    { service: 'Storage', cost: 764.12 },
    { service: 'App Service', cost: 512.88 },
    { service: 'Azure Kubernetes Service', cost: 430.75 },
    { service: 'Bandwidth', cost: 288.4 },
    { service: 'Logic Apps', cost: 176.9 },
    { service: 'Key Vault', cost: 42.15 },
  ];
  return { currency: CURRENCY, services };
}

module.exports = { getMockCostOverview, getMockCostByService };
