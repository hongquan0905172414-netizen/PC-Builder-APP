/*
  Compatibility engine. Deterministic, no AI/LLM imports anywhere.
  Reads parts from data/parts.json, resolves a build of part IDs into
  full part objects, and runs every rule from rules.js against them.
*/

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { RULES } from './rules.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PARTS_DB = JSON.parse(readFileSync(join(__dirname, '..', '..', 'data', 'parts.json'), 'utf8'));

const SLOTS = ['cpu', 'motherboard', 'gpu', 'ram', 'storage', 'case', 'cooling', 'psu'];

// Builds may be partial. Unknown or missing IDs are simply absent from the
// resolved build — rules whose required parts are missing return null
// rather than erroring.
function resolveBuild(buildIds = {}) {
  const resolved = {};
  for (const slot of SLOTS) {
    const id = buildIds[slot];
    if (!id) continue;
    const part = PARTS_DB[id];
    if (!part) continue;
    resolved[slot] = { id, ...part };
  }
  return resolved;
}

export function checkCompatibility(buildIds) {
  const build = resolveBuild(buildIds);
  const checks = RULES.map((rule) => rule(build)).filter(Boolean);
  const conflicts = checks.filter((c) => c.status === 'fail');
  const warnings = checks.filter((c) => c.status === 'warning');

  return {
    compatible: conflicts.length === 0,
    checks,
    conflicts,
    warnings,
    required_changes: conflicts.map((c) => c.fix ?? c.message),
  };
}
