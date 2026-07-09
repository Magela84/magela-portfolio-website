// DateRangePicker - two date inputs plus quick presets. Controlled component:
// parent owns the { from, to } value (YYYY-MM-DD strings).

import React from 'react';

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

export default function DateRangePicker({ value, onChange }) {
  const { from = '', to = '' } = value || {};

  const setField = (field) => (e) => onChange({ ...value, [field]: e.target.value });

  const applyPreset = (days) =>
    onChange({ from: isoDaysAgo(days), to: new Date().toISOString().slice(0, 10) });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={from}
        onChange={setField('from')}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      />
      <span className="text-gray-400">→</span>
      <input
        type="date"
        value={to}
        onChange={setField('to')}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
      />
      <div className="ml-1 flex gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.days)}
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
