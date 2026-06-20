// SYSTEM: Orchestration
// JOB: run a request through the other four systems, in order, and return
//      the final response. The conductor — it plays no instrument itself.
// NEVER: make recommendations or decide tone itself. If you're about to
//        write a recommendation rule or a piece of user-facing copy here,
//        it belongs in validation-system or language-system instead.
// OWNER: engineering = co-founders

import { getCandidates, getCurrentPartSpecs, getCategories, getPartById } from '../data-system/parts.js';
import { callLanguageSystem } from '../language-system/languageSystem.js';
import { validate } from '../validation-system/validate.js';

const FALLBACK_MESSAGE =
  "I couldn't put together a recommendation that passes our safety checks. Could you rephrase your request, or try again in a moment?";

function extractBudgetFromText(text) {
  const match = String(text ?? '').match(/\$\s?([\d,]+)/);
  if (!match) return null;
  const n = parseFloat(match[1].replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function finalizeResponse(languageOutput) {
  return {
    ok: true,
    recommended_parts: languageOutput.recommended_ids.map((id) => getPartById(id)).filter(Boolean),
    clarifying_question: languageOutput.clarifying_question,
    explanation: languageOutput.explanation,
  };
}

/**
 * request: { message: string, budget?: number, currentParts?: { category: partId } }
 *
 * currentParts and budget are accepted as structured fields when the
 * caller already knows them (e.g. a budget slider already in the UI).
 * budget falls back to a "$NNN" pattern in the message text if not given.
 */
export async function orchestrate(request) {
  // 1. Parse the request
  const goal = request.message ?? '';
  const budget = request.budget ?? extractBudgetFromText(goal);
  const currentParts = request.currentParts ?? {};

  // 2. Data system: candidates across every category, plus specs for
  // whatever the user says they already own. (v1 keeps this simple — no
  // category/budget narrowing yet; the catalog is small enough that
  // sending everything is cheap. Revisit if the catalog grows.)
  const candidates = getCategories().flatMap((category) => getCandidates(category));
  const currentPartSpecs = Object.fromEntries(
    Object.entries(currentParts).map(([category, id]) => [category, getCurrentPartSpecs(id)])
  );

  // 3. Language system
  const languageOutput = await callLanguageSystem({ goal, candidates, currentParts: currentPartSpecs });
  if (languageOutput.error) {
    return { ok: false, reason: languageOutput.error, message: FALLBACK_MESSAGE };
  }

  // 4. Validation — give it one chance to fix itself before falling back.
  const firstResult = validate(languageOutput, { currentParts, budget });
  if (firstResult.passed) {
    return finalizeResponse(languageOutput);
  }

  const retryGoal = `${goal}\n\n[Internal note: your previous answer failed these checks — fix them and answer again, following the rules exactly: ${firstResult.failures.map((f) => f.message).join(' ')}]`;
  const retryOutput = await callLanguageSystem({ goal: retryGoal, candidates, currentParts: currentPartSpecs });
  if (retryOutput.error) {
    return { ok: false, reason: retryOutput.error, message: FALLBACK_MESSAGE };
  }

  const retryResult = validate(retryOutput, { currentParts, budget });
  if (!retryResult.passed) {
    return { ok: false, reason: 'VALIDATION_FAILED', failures: retryResult.failures, message: FALLBACK_MESSAGE };
  }

  return finalizeResponse(retryOutput);
}
