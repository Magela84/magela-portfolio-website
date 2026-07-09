// IdleResources - "Idle Resource Hunter". Headlines total monthly waste from
// orphaned/idle resources and lists each finding with an estimated cost and a
// suggested action.

import React from 'react';

import { api, useFetch, formatCurrency } from '../api';

const TYPE_STYLES = {
  'Unattached Disk': 'bg-amber-100 text-amber-700',
  'Idle VM': 'bg-red-100 text-red-700',
  'Deallocated VM': 'bg-orange-100 text-orange-700',
  'Unassociated Public IP': 'bg-sky-100 text-sky-700',
  'Stale Snapshot': 'bg-violet-100 text-violet-700',
};

function TypeBadge({ type }) {
  const cls = TYPE_STYLES[type] || 'bg-gray-100 text-gray-600';
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{type}</span>;
}

export default function IdleResources() {
  const { data, loading, error } = useFetch(() => api.idleResources(), []);
  const findings = data?.findings || [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 lg:col-span-2">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧹</span>
          <h2 className="text-lg font-semibold text-gray-800">Idle Resource Hunter</h2>
        </div>
        {data && (
          <span className="text-sm text-gray-500">
            <span className="text-2xl font-bold text-red-600">
              {formatCurrency(data.totalMonthlyWaste, data.currency)}
            </span>{' '}
            /mo in potential waste · {data.findingCount} findings
          </span>
        )}
      </div>

      {loading && <p className="text-sm text-gray-500">Scanning resources…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data && findings.length === 0 && (
        <p className="text-sm text-gray-500">No idle resources found. 🎉</p>
      )}

      {data && Object.keys(data.byType || {}).length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {Object.entries(data.byType).map(([type, info]) => (
            <span
              key={type}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600"
            >
              {type}: {info.count} · {formatCurrency(info.monthlyCost, data.currency)}/mo
            </span>
          ))}
        </div>
      )}

      {findings.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-400">
                <th className="py-2 pr-4">Resource</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Why</th>
                <th className="py-2 pr-4 text-right">Est. $/mo</th>
                <th className="py-2">Suggested action</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((f) => (
                <tr key={f.id} className="border-b border-gray-100 align-top">
                  <td className="py-2 pr-4">
                    <div className="font-medium text-gray-800">{f.name}</div>
                    <div className="text-xs text-gray-400">{f.resourceGroup} · {f.region}</div>
                  </td>
                  <td className="py-2 pr-4">
                    <TypeBadge type={f.type} />
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{f.reason}</td>
                  <td className="py-2 pr-4 text-right font-semibold text-gray-900">
                    {formatCurrency(f.monthlyCost, f.currency)}
                  </td>
                  <td className="py-2 text-gray-500">{f.actionHint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <p className="mt-3 text-xs text-gray-400">
          Costs are estimated from list prices and are for guidance only.
        </p>
      )}
    </div>
  );
}
