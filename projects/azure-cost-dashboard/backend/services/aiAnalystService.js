// AI Cost Analyst — answers natural-language questions about the user's Azure
// spend by feeding the dashboard's own cost data to Claude as context.
//
// Uses the official Anthropic SDK with claude-opus-4-8 and adaptive thinking.
// The cost data comes from the existing services, so this works in mock mode
// too (mock spend numbers + a real Claude answer) as long as ANTHROPIC_API_KEY
// is set.

const Anthropic = require('@anthropic-ai/sdk');

const azureCostService = require('./azureCostService');
const azureMonitorService = require('./azureMonitorService');

const MODEL = 'claude-opus-4-8';

let cachedClient;

function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient() {
  if (!cachedClient) {
    // Reads ANTHROPIC_API_KEY from the environment.
    cachedClient = new Anthropic();
  }
  return cachedClient;
}

// Gather the same data the dashboard shows, as a compact JSON context object.
// Budgets are best-effort so a question is still answerable without them.
async function gatherContext(range = {}) {
  const [overview, byService, budgets] = await Promise.all([
    azureCostService.getCostOverview(range),
    azureCostService.getCostByService(range),
    azureMonitorService.getBudgetAlerts().catch(() => []),
  ]);
  return { overview, byService, budgets };
}

const SYSTEM_PROMPT = `You are an Azure cost analyst embedded in a cost-visibility dashboard.
You are given the user's current Azure cost data as JSON: a daily spend trend
(overview.series), the total for the period, spend grouped by service, and any
configured budgets with current spend and notification thresholds.

Answer the user's question using ONLY the provided data. Be concise and specific:
cite actual numbers with their currency, name the services involved, and quantify
trends (e.g. "up 22% over the period"). When the question is about savings or
anomalies, point to the concrete drivers in the data. If the data does not
contain what's needed to answer, say so plainly rather than guessing. Format the
answer in short Markdown — a sentence or two, or a tight bullet list. Do not
restate the raw JSON.`;

/**
 * Stream an answer to `question` grounded in `context`. Calls onText(delta) for
 * each text chunk. Resolves with the final message.
 */
async function streamAnswer(question, context, { onText } = {}) {
  const client = getClient();

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Azure cost data (JSON):\n${JSON.stringify(context)}\n\nQuestion: ${question}`,
      },
    ],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      if (onText) onText(event.delta.text);
    }
  }

  return stream.finalMessage();
}

module.exports = {
  hasApiKey,
  gatherContext,
  streamAnswer,
  MODEL,
};
