// BudgetAlerts - budgets with a spend-vs-amount progress bar. Bars turn amber
// past 75% and red past 100% so overspend is obvious at a glance.

import React from 'react';

import { api, useFetch, formatCurrency } from '../api';

function barColor(percent) {
  if (percent >= 100) return 'bg-red-500';
  if (percent >= 75) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export default function BudgetAlerts() {
  const { data, loading, error } = useFetch(() => api.alerts(), []);
  const budgets = data?.budgets || [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-gray-800">Budget Alerts</h2>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data && budgets.length === 0 && (
        <p className="text-sm text-gray-500">No budgets configured.</p>
      )}

      <ul className="space-y-4">
        {budgets.map((b) => (
          <li key={b.name}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium text-gray-800">{b.name}</span>
              <span className="text-gray-600">
                {formatCurrency(b.currentSpend, b.currency)} /{' '}
                {formatCurrency(b.amount, b.currency)} ({b.percentUsed}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-gray-100">
              <div
                className={`h-full ${barColor(b.percentUsed)}`}
                style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-gray-400">
              {b.timeGrain} · {b.notifications.length} threshold
              {b.notifications.length === 1 ? '' : 's'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
