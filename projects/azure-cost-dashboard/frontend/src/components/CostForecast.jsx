// CostForecast - projected month-end spend + budget burn-down chart.
// Actual cumulative spend (solid) continues as a dashed projection to month-end,
// against a flat budget reference line.

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';

import { api, useFetch, formatCurrency } from '../api';

const STATUS = {
  under: { label: 'On track', cls: 'bg-emerald-100 text-emerald-700' },
  warning: { label: 'Approaching budget', cls: 'bg-amber-100 text-amber-700' },
  over: { label: 'Projected over budget', cls: 'bg-red-100 text-red-700' },
  'no-budget': { label: 'No budget set', cls: 'bg-gray-100 text-gray-600' },
};

function Stat({ label, value, danger }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`text-lg font-bold ${danger ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  );
}

export default function CostForecast() {
  const { data, loading, error } = useFetch(() => api.costForecast(), []);
  const status = data ? STATUS[data.status] || STATUS['no-budget'] : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 lg:col-span-2">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-800">
          Spend Forecast &amp; Budget Burn-Down
        </h2>
        {status && (
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${status.cls}`}>
            {status.label}
          </span>
        )}
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat
              label="Month to date"
              value={formatCurrency(data.monthToDateSpend, data.currency)}
            />
            <Stat
              label="Projected month-end"
              value={formatCurrency(data.projectedMonthEnd, data.currency)}
              danger={data.status === 'over'}
            />
            <Stat
              label={data.budget ? `Budget · ${data.budget.name}` : 'Budget'}
              value={data.budget ? formatCurrency(data.budget.amount, data.currency) : '—'}
            />
            <Stat
              label={data.projectedOverage > 0 ? 'Projected overage' : 'Avg / day'}
              value={
                data.projectedOverage > 0
                  ? formatCurrency(data.projectedOverage, data.currency)
                  : formatCurrency(data.avgDailyCost, data.currency)
              }
              danger={data.projectedOverage > 0}
            />
          </div>

          {data.budgetExhaustionDate && (
            <p className="mb-3 text-sm text-red-600">
              ⚠️ At the current trend, spend crosses the budget on{' '}
              <strong>{data.budgetExhaustionDate}</strong>.
            </p>
          )}

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.burndown} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => d.slice(8)}
                tick={{ fontSize: 11 }}
                minTickGap={16}
              />
              <YAxis tick={{ fontSize: 11 }} width={64} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => (v == null ? '—' : formatCurrency(v, data.currency))} />
              <Legend />
              {data.budget && (
                <ReferenceLine
                  y={data.budget.amount}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                  label={{ value: 'Budget', fontSize: 11, fill: '#dc2626', position: 'insideTopRight' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="projected"
                name="Projected"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
