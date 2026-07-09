// AiAnalyst - "Ask your bill" panel. Sends a natural-language question to the
// backend, which answers with Claude grounded in the current cost data, and
// streams the response token-by-token.

import React, { useRef, useState } from 'react';

import { askAnalyst } from '../api';

const SUGGESTIONS = [
  'What is my most expensive service, and why?',
  'Where can I save money this month?',
  'Is my spend trending over budget?',
  'Summarize my Azure costs in three bullets.',
];

export default function AiAnalyst() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  async function ask(q) {
    const text = (q ?? question).trim();
    if (!text || loading) return;

    // Cancel any in-flight request.
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setQuestion(text);
    setAnswer('');
    setError(null);
    setLoading(true);

    try {
      await askAnalyst(text, {
        signal: controller.signal,
        onToken: (token) => setAnswer((prev) => prev + token),
      });
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 lg:col-span-2">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">✨</span>
        <h2 className="text-lg font-semibold text-gray-800">AI Cost Analyst</h2>
        <span className="text-xs text-gray-400">— ask about your spend</span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Why did my bill go up this month?"
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Thinking…' : 'Ask'}
        </button>
      </form>

      <div className="mt-2 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => ask(s)}
            disabled={loading}
            className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {(answer || (loading && !error)) && (
        <div className="mt-3 rounded border border-gray-200 bg-white p-3 text-sm leading-relaxed text-gray-800">
          {answer ? (
            <span className="whitespace-pre-wrap">{answer}</span>
          ) : (
            <span className="text-gray-400">Analyzing your cost data…</span>
          )}
          {loading && answer && <span className="ml-0.5 animate-pulse">▋</span>}
        </div>
      )}
    </div>
  );
}
