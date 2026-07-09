// LogicAppsStatus - table of Logic App workflows with state + latest run status.

import React from 'react';

import { api, useFetch } from '../api';

const RUN_STATUS_STYLES = {
  Succeeded: 'bg-emerald-100 text-emerald-700',
  Failed: 'bg-red-100 text-red-700',
  Running: 'bg-blue-100 text-blue-700',
  Cancelled: 'bg-gray-100 text-gray-600',
};

function StatusBadge({ status }) {
  const cls = RUN_STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status || 'Unknown'}
    </span>
  );
}

function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function LogicAppsStatus() {
  const { data, loading, error } = useFetch(() => api.logicApps(), []);
  const workflows = data?.workflows || [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-gray-800">Logic Apps Status</h2>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data && workflows.length === 0 && (
        <p className="text-sm text-gray-500">No Logic Apps in this resource group.</p>
      )}

      {workflows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-400">
                <th className="py-2 pr-4">Workflow</th>
                <th className="py-2 pr-4">State</th>
                <th className="py-2 pr-4">Last Run</th>
                <th className="py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((wf) => (
                <tr key={wf.id || wf.name} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-800">{wf.name}</td>
                  <td className="py-2 pr-4 text-gray-600">{wf.state}</td>
                  <td className="py-2 pr-4">
                    <StatusBadge status={wf.latestRun?.status} />
                  </td>
                  <td className="py-2 text-gray-500">
                    {formatTime(wf.latestRun?.startTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
