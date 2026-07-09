// CostOverview - total spend headline + daily trend area chart.

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { api, useFetch, formatCurrency } from '../api';

export default function CostOverview({ range }) {
  const { data, loading, error } = useFetch(
    () => api.costOverview(range),
    [range.from, range.to]
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Cost Overview</h2>
        {data && (
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(data.total, data.currency)}
          </span>
        )}
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
            <YAxis tick={{ fontSize: 11 }} width={60} />
            <Tooltip
              formatter={(v) => formatCurrency(v, data.currency)}
              labelClassName="text-xs"
            />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#2563eb"
              fill="#93c5fd"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
