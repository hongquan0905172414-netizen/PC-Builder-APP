// SYSTEM: Language system
// JOB: take the user's goal + the candidate facts it's handed, call the
//      model, and return its pick (by ID) plus the explanation text.
// NEVER: invent or recall a spec/price/part from its own memory; only use
//        the facts it was handed; only pick IDs from the candidate list.
//        (That last part is enforced in code by the validation system —
//        this file does not trust itself to get it right.)
// OWNER: engineering = co-founders

import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './systemPrompt.js';

// Sonnet-class model for the reasoning step. Confirm the current model ID
// at https://docs.claude.com/en/docs/about-claude/models before bumping.
const MODEL = 'claude-sonnet-4-6';

function buildUserMessage({ goal, candidates, currentParts }) {
  const lines = [`User request: ${goal}`];
  if (currentParts && Object.keys(currentParts).length > 0) {
    lines.push(`User's current parts (by category): ${JSON.stringify(currentParts)}`);
  }
  lines.push('CANDIDATE parts (choose only from these, by id):');
  lines.push(JSON.stringify(candidates));
  return lines.join('\n\n');
}

function parseModelJson(rawText) {
  try {
    const cleaned = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleaned);
  } catch {}
  try {
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(rawText.slice(start, end + 1));
    }
  } catch {}
  return null;
}

/**
 * goal: string — the user's request, plain text
 * candidates: array of part records from the data system (id, name, specs, price, ...)
 * currentParts: optional { category: partId } the user says they already own
 *
 * Returns { recommended_ids, clarifying_question, explanation } on success,
 * or { error, detail, raw } on failure — orchestration decides what to do
 * with a failure. This function never throws for a bad model response.
 */
export async function callLanguageSystem({ goal, candidates, currentParts }) {
  const client = new Anthropic();
  const userMessage = buildUserMessage({ goal, candidates, currentParts });

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });
  } catch (err) {
    return { error: 'API_ERROR', detail: err.message, raw: null };
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  const rawText = textBlock?.text ?? '';
  const parsed = parseModelJson(rawText);

  if (!parsed || !Array.isArray(parsed.recommended_ids)) {
    return { error: 'PARSE_FAILED', detail: 'Model response was not valid JSON in the expected shape.', raw: rawText };
  }

  return {
    recommended_ids: parsed.recommended_ids,
    clarifying_question: parsed.clarifying_question ?? null,
    explanation: parsed.explanation ?? '',
  };
}
