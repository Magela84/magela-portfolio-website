// Dashboard - owns the shared date range and composes the widgets.

import React, { useState } from 'react';

import AiAnalyst from '../components/AiAnalyst';
import IdleResources from '../components/IdleResources';
import CostForecast from '../components/CostForecast';
import CostOverview from '../components/CostOverview';
import CostByService from '../components/CostByService';
import BudgetAlerts from '../components/BudgetAlerts';
import LogicAppsStatus from '../components/LogicAppsStatus';
import DateRangePicker from '../components/DateRangePicker';

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const [range, setRange] = useState({
    from: isoDaysAgo(30),
    to: new Date().toISOString().slice(0, 10),
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Azure Cost Visibility Dashboard
        </h1>
        <DateRangePicker value={range} onChange={setRange} />
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AiAnalyst />
        <IdleResources />
        <CostForecast />
        <CostOverview range={range} />
        <CostByService range={range} />
        <BudgetAlerts />
        <LogicAppsStatus />
      </div>
    </div>
  );
}
