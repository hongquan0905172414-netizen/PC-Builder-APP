/**
 * RIG rules engine.
 *
 * This is the Brains layer. Pure TypeScript. No React, no DOM, no
 * Next.js imports. It should be portable to any environment —
 * including a future Swift port.
 *
 * Contract:
 *   validate(build) -> Warning[]
 *
 * Rules are DATA, not code. They live in /data/rules and are loaded
 * and evaluated by this engine. To add a new trap, add a rule
 * definition — don't write a new function here.
 */

import type { Build, Warning } from "@/lib/types";

/**
 * Evaluate all rules against a build and return any warnings.
 *
 * For now this is a stub. Implementation comes once we define the
 * rule schema.
 */
export function validate(_build: Build): Warning[] {
  // TODO: load rules from /data/rules
  // TODO: evaluate each rule against the build
  // TODO: return collected warnings
  return [];
}
