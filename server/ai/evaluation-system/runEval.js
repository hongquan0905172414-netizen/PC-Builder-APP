// SYSTEM: Evaluation system
// JOB: run a fixed set of test prompts with pass/fail criteria after every
//      change to the AI feature, and print a clear summary.
// NEVER: be skipped because a change seemed small. Run this before
//        merging anything that touches /ai.
// OWNER: product = Duc
//
// TODO: expand to the full eval set — the complete set is being written
// separately. These 3 are seed cases only.
//
// Run with: node ai/evaluation-system/runEval.js   (from /server)

import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { orchestrate } from '../orchestration/orchestrate.js';
import { getPartById } from '../data-system/parts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(readFileSync(join(__dirname, 'test-prompts.json'), 'utf8'));

function checkExpectation(result, expect) {
  const failures = [];

  if (expect.ok != null && result.ok !== expect.ok) {
    failures.push(`expected ok=${expect.ok}, got ok=${result.ok}`);
  }
  if (!result.ok) return failures; // nothing else to check after a hard failure

  if (expect.clarifyingQuestionRequired === true && !result.clarifying_question) {
    failures.push('expected a clarifying question, got none');
  }
  if (expect.clarifyingQuestionRequired === false && result.clarifying_question) {
    failures.push(`expected no clarifying question, got: "${result.clarifying_question}"`);
  }

  if (expect.noDowngradeFrom) {
    const currentPart = getPartById(expect.noDowngradeFrom.id);
    const sameCategoryPicks = result.recommended_parts.filter((p) => p.category === expect.noDowngradeFrom.category);
    const downgraded = sameCategoryPicks.filter((p) => p.tier < currentPart.tier);
    if (downgraded.length > 0) {
      failures.push(`downgrade detected: ${downgraded.map((p) => p.name).join(', ')} is weaker than current ${currentPart.name}`);
    }
  }

  if (expect.maxBudget != null) {
    const total = result.recommended_parts.reduce(
      (sum, p) => sum + parseFloat(String(p.price).replace(/[$,]/g, '')),
      0
    );
    if (total > expect.maxBudget) {
      failures.push(`total $${total} exceeds expected max budget $${expect.maxBudget}`);
    }
  }

  return failures;
}

async function runEval() {
  console.log(`Running ${cases.length} eval case(s)...\n`);
  let passCount = 0;

  for (const testCase of cases) {
    let result;
    try {
      result = await orchestrate(testCase.request);
    } catch (err) {
      console.log(`[ERROR] ${testCase.id} — orchestrate() threw: ${err.message}`);
      continue;
    }

    const failures = checkExpectation(result, testCase.expect);
    const passed = failures.length === 0;
    if (passed) passCount++;

    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testCase.id} — ${testCase.description}`);
    if (!passed) {
      failures.forEach((f) => console.log(`    - ${f}`));
    }
  }

  console.log(`\n${passCount}/${cases.length} passed.`);
  if (passCount < cases.length) process.exitCode = 1;
}

runEval();
