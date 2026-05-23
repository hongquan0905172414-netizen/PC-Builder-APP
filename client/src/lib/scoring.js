/*
================================================================
  lib/scoring.js — Scoring engine + template matching
================================================================
  Two exported functions:

  computeScores(answers)
    Converts the answers object into a scores object.
    All dimensions are clamped to 0–100.

  findTemplate(scores)
    Finds the closest template using Euclidean distance
    across all scoring dimensions.

  ---------------------------------------------------------------
  SCORING DIMENSIONS:
    gaming       — how GPU/game-heavy the build should be
    productivity — how CPU/RAM-heavy for workloads
    airflow      — cooling priority
    noise        — how quiet it needs to be (higher = quieter)
    rgb          — RGB lighting intensity (0 = none, 100 = full)
    caseStyle    — glass panel (high) vs solid box (low)
    cableClean   — cable management priority

  budgetUnlimited is a boolean used by findTemplate() to decide
  which tier of templates to compare against.

  ---------------------------------------------------------------
  TO ADD A NEW SCORING DIMENSION:
    1. Add it to scores{} defaults in computeScores() with a
       neutral starting value (50)
    2. Add answer-based adjustment logic in computeScores()
    3. Add it to every template's scores{} in data/templates.js
    4. Add it to dims[] in findTemplate() so matching uses it

  TO DEBUG why a template was matched:
    Uncomment the console.log inside findTemplate().
================================================================
*/

import { TEMPLATES } from '../data/templates';

/**
 * Converts the wizard answers into dimension scores (0–100).
 * @param {Object} answers - { budget, goal, secondary, rgb, glass, cables, noise }
 * @returns {Object} scores - numeric dimensions + budgetUnlimited boolean
 */
export function computeScores(answers) {
  const scores = {
    gaming:          50,
    productivity:    50,
    airflow:         50,
    noise:           50,
    rgb:             50,
    caseStyle:       50,
    cableClean:      50,
    budgetUnlimited: answers.budget === 'unlimited',
  };

  // -- Goal: primary use case --
  if (answers.goal === 'gaming')       { scores.gaming += 35; scores.productivity -= 20; }
  if (answers.goal === 'productivity') { scores.productivity += 35; scores.gaming -= 20; }
  if (answers.goal === 'balanced')     { /* stays even */ }
  if (answers.goal === 'best')         { scores.gaming = 95; scores.productivity = 95; }

  // -- Secondary use: nudges non-primary dimension slightly --
  if (answers.secondary === 'gaming')       scores.gaming       += 10;
  if (answers.secondary === 'productivity') scores.productivity += 10;

  // -- RGB --
  if (answers.rgb === 'none')   scores.rgb = 0;
  if (answers.rgb === 'subtle') scores.rgb = 50;
  if (answers.rgb === 'full')   scores.rgb = 100;

  // -- Glass panel --
  if (answers.glass === 'yes') scores.caseStyle = 85;
  if (answers.glass === 'no')  scores.caseStyle = 20;

  // -- Cable management --
  if (answers.cables === 'yes') scores.cableClean = 90;
  if (answers.cables === 'no')  scores.cableClean = 30;

  // -- Noise / placement --
  if (answers.noise === 'quiet')  { scores.noise = 90; scores.airflow = 75; }
  if (answers.noise === 'normal') { scores.noise = 50; scores.airflow = 50; }
  if (answers.noise === 'loud')   { scores.noise = 10; scores.airflow = 30; }

  // Clamp all numeric dimensions to 0–100
  const dims = ['gaming', 'productivity', 'airflow', 'noise', 'rgb', 'caseStyle', 'cableClean'];
  dims.forEach((k) => {
    scores[k] = Math.max(0, Math.min(100, scores[k]));
  });

  return scores;
}

/**
 * Finds the closest template to the user's scores.
 *
 * Algorithm:
 *   1. Filter templates to the correct budget tier
 *   2. Compute Euclidean distance on all 7 dimensions
 *   3. Return the template with the lowest distance
 *
 * @param {Object} scores - output of computeScores()
 * @returns {Object} the matched template from TEMPLATES
 */
export function findTemplate(scores) {
  // Filter by budget tier first
  const tier     = scores.budgetUnlimited ? 'unlimited' : 'budget';
  const eligible = TEMPLATES.filter((t) => t.tier === tier);

  // Dimensions used for distance calculation
  // TO ADD A DIMENSION: add it here AND in computeScores() AND in each template's scores{}
  const dims = ['gaming', 'productivity', 'airflow', 'noise', 'rgb', 'caseStyle', 'cableClean'];

  let best     = null;
  let bestDist = Infinity;

  eligible.forEach((template) => {
    const sumSquares = dims.reduce((acc, dim) => {
      const diff = (scores[dim] ?? 50) - (template.scores[dim] ?? 50);
      return acc + diff * diff;
    }, 0);
    const dist = Math.sqrt(sumSquares);

    // Uncomment to debug which template won and why:
    // console.log(`[match] ${template.id} ${template.name} → distance: ${dist.toFixed(1)}`);

    if (dist < bestDist) {
      bestDist = dist;
      best     = template;
    }
  });

  return best;
}
