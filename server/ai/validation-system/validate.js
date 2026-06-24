// SYSTEM: Validation system
// JOB: catch the AI's mistakes in code, after it answers and before the
//      user sees anything. Five checks, each maps to one never-do rule.
// NEVER: trust the AI's output blindly. No check here is optional.
// OWNER: engineering = co-founders

import { getPartById } from '../data-system/parts.js';
import { checkCompatibility } from '../../lib/compatibility/engine.js';

// parts.json categories -> compatibility engine slot keys
const CATEGORY_TO_SLOT = {
  CPU: 'cpu',
  Motherboard: 'motherboard',
  GPU: 'gpu',
  RAM: 'ram',
  Storage: 'storage',
  Case: 'case',
  Cooler: 'cooling',
  PSU: 'psu',
};

const BUDGET_OVERAGE_PHRASES = [
  'over budget', 'over your budget', 'exceeds your budget', 'exceeds the budget',
  'above your budget', 'above budget', 'more than your budget', 'over-budget',
];

const ASSEMBLY_LANE_PHRASES = [
  'screw', 'thermal paste', 'standoff', 'bios', 'i/o shield', 'zif lever',
  'install the', 'plug in the', 'seat the', 'mount the', 'step 1', 'step one',
];

function parsePrice(price) {
  const n = parseFloat(String(price ?? '').replace(/[$,]/g, ''));
  return isNaN(n) ? 0 : n;
}

/** Check 1 — every recommended_id must exist in the catalog. */
function checkIdsExist(recommendedIds) {
  const unknown = recommendedIds.filter((id) => !getPartById(id));
  return {
    id: 'ids-exist',
    passed: unknown.length === 0,
    message: unknown.length === 0
      ? 'All recommended IDs exist in the catalog.'
      : `Unknown part id(s) not in the catalog: ${unknown.join(', ')}.`,
  };
}

/** Check 2 — never recommend a part weaker than one the user already owns. */
function checkNoDowngrade(recommendedIds, currentParts = {}) {
  const downgrades = [];
  for (const id of recommendedIds) {
    const part = getPartById(id);
    if (!part) continue;
    const currentId = currentParts[part.category];
    if (!currentId) continue;
    const currentPart = getPartById(currentId);
    if (!currentPart) continue;
    if (part.tier < currentPart.tier) {
      downgrades.push(`${part.name} (tier ${part.tier}) is weaker than the user's current ${currentPart.name} (tier ${currentPart.tier})`);
    }
  }
  return {
    id: 'no-downgrade',
    passed: downgrades.length === 0,
    message: downgrades.length === 0 ? 'No downgrades.' : downgrades.join('; '),
  };
}

/** Check 3 — total within budget, or the explanation explicitly flags the overage. */
function checkBudget(recommendedIds, budget, explanation) {
  if (budget == null) {
    return { id: 'budget', passed: true, message: 'No budget stated — nothing to check.' };
  }
  const total = recommendedIds.reduce((sum, id) => sum + parsePrice(getPartById(id)?.price), 0);
  if (total <= budget) {
    return { id: 'budget', passed: true, message: `Total $${total} is within the $${budget} budget.` };
  }
  const flagged = BUDGET_OVERAGE_PHRASES.some((phrase) => explanation.toLowerCase().includes(phrase));
  return {
    id: 'budget',
    passed: flagged,
    message: flagged
      ? `Total $${total} exceeds the $${budget} budget, but the overage is explicitly flagged.`
      : `Total $${total} exceeds the $${budget} budget and the explanation does not flag it.`,
  };
}

/** Check 4 — recommended parts (plus whatever the user already owns) must be mutually compatible. */
function checkCompatibilityRule(recommendedIds, currentParts = {}) {
  const buildIds = {};
  for (const [category, id] of Object.entries(currentParts)) {
    const slot = CATEGORY_TO_SLOT[category];
    if (slot) buildIds[slot] = id;
  }
  for (const id of recommendedIds) {
    const part = getPartById(id);
    const slot = part && CATEGORY_TO_SLOT[part.category];
    if (slot) buildIds[slot] = id; // a fresh recommendation replaces the current part in that slot
  }

  const result = checkCompatibility(buildIds);
  return {
    id: 'compatibility',
    passed: result.compatible,
    message: result.compatible
      ? 'No compatibility conflicts.'
      : result.conflicts.map((c) => c.message).join(' '),
  };
}

/** Check 5 — no assembly/wiring/BIOS step-by-step instructions in the explanation. */
function checkLane(explanation) {
  const lower = (explanation ?? '').toLowerCase();
  const hits = ASSEMBLY_LANE_PHRASES.filter((phrase) => lower.includes(phrase));
  return {
    id: 'lane-check',
    passed: hits.length === 0,
    message: hits.length === 0
      ? 'No assembly/BIOS instructions present.'
      : `Explanation contains assembly/BIOS language: ${hits.join(', ')}.`,
  };
}

/**
 * languageOutput: { recommended_ids, clarifying_question, explanation }
 * context: { currentParts, budget }
 *
 * Returns { passed, checks, failures }. `checks` always has all 5 results,
 * even the ones that passed, so orchestration/logs can show the full picture.
 */
export function validate(languageOutput, context = {}) {
  const { recommended_ids: recommendedIds = [], explanation = '' } = languageOutput;
  const { currentParts = {}, budget = null } = context;

  const checks = [
    checkIdsExist(recommendedIds),
    checkNoDowngrade(recommendedIds, currentParts),
    checkBudget(recommendedIds, budget, explanation),
    checkCompatibilityRule(recommendedIds, currentParts),
    checkLane(explanation),
  ];

  const failures = checks.filter((c) => !c.passed);
  return { passed: failures.length === 0, checks, failures };
}
