// Thin API layer + a small fetch hook used by the dashboard widgets.
// The dev server proxies /api to the Express backend (see vite.config.js).

import { useEffect, useState } from 'react';

async function getJson(path, params) {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      // Backend error shape: { error: true, message, code, timestamp }.
      // Fall back to a string `error` field for older responses.
      if (body.message) message = body.message;
      else if (typeof body.error === 'string') message = body.error;
    } catch (_) {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  costOverview: (range) => getJson('/api/costs/overview', range),
  costByService: (range) => getJson('/api/costs/by-service', range),
  costForecast: () => getJson('/api/costs/forecast'),
  alerts: () => getJson('/api/alerts'),
  logicApps: () => getJson('/api/logicapps'),
  idleResources: () => getJson('/api/idle'),
};

/**
 * Generic data hook: runs `fetcher` on mount and whenever `deps` change.
 * @param {() => Promise<any>} fetcher
 * @param {Array<any>} deps
 * @returns {{ data: any, loading: boolean, error: string|null }}
 */
export function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((err) => active && setState({ data: null, loading: false, error: err.message }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

/**
 * Ask the AI Cost Analyst a question. Streams the answer via SSE, calling
 * onToken(text) for each chunk. Resolves when the answer is complete.
 * @param {string} question
 * @param {{ onToken: (t: string) => void, signal?: AbortSignal }} handlers
 */
export async function askAnalyst(question, { onToken, signal } = {}) {
  const res = await fetch('/api/analyst/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
    signal,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch (_) {
      /* non-JSON error body */
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // Parse the SSE stream: events are separated by blank lines, each with
  // optional `event:` and `data:` fields.
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || '';

    for (const chunk of chunks) {
      let event = 'message';
      let data = '';
      for (const line of chunk.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (event === 'error') {
        const parsed = data ? JSON.parse(data) : {};
        throw new Error(parsed.message || 'Analyst error');
      }
      if (event === 'done') return;
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.text && onToken) onToken(parsed.text);
      }
    }
  }
}

// Format a number as a currency amount.
export function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}
