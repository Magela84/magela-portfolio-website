// CostByService - horizontal bar chart of spend grouped by Azure service.

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { api, useFetch, formatCurrency } from '../api';

export default function CostByService({ range }) {
  const { data, loading, error } = useFetch(
    () => api.costByService(range),
    [range.from, range.to]
  );

  // Show the top services; collapsing a long tail keeps the chart readable.
  const top = data ? data.services.slice(0, 10) : [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-gray-800">Cost by Service</h2>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && top.length === 0 && (
        <p className="text-sm text-gray-500">No cost data for this range.</p>
      )}

      {data && top.length > 0 && (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={top}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="service"
              tick={{ fontSize: 11 }}
              width={140}
            />
            <Tooltip formatter={(v) => formatCurrency(v, data.currency)} />
            <Bar dataKey="cost" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
