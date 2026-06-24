// SYSTEM: Data system
// JOB: return verified facts about parts, by ID — nothing else.
// NEVER: contain opinions, recommendations, tone, or user-facing language.
// OWNER: engineering = co-founders

// Intentionally reads the SAME catalog the compatibility engine and chat
// feature already use (server/data/parts.json) instead of owning a second
// copy. Two catalogs would drift apart — exactly the bug this app already
// hit once with prices. One file, three consumers.
//
// Prices are hand-entered in parts.json for now. The Amazon Product
// Advertising API is the planned live price source later. getPrice() is
// the single seam to swap when that happens — nothing else in this
// codebase should ever read `.price` directly from the catalog file.

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PARTS_DB = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'data', 'parts.json'), 'utf8')
);

/** Single seam for price retrieval — swap the source here later, nowhere else. */
function getPrice(id) {
  return PARTS_DB[id]?.price ?? null;
}

/** Full verified record for one part ID, or null if it doesn't exist. */
export function getPartById(id) {
  const part = PARTS_DB[id];
  if (!part) return null;
  return { id, ...part, price: getPrice(id) };
}

/**
 * All catalog parts in a category, optionally narrowed by simple filters.
 * filters.maxPrice — drop parts priced above this (parses "$1,599" style strings)
 * filters.minTier  — drop parts below this tier (used to keep "no downgrade" honest upstream)
 */
export function getCandidates(category, filters = {}) {
  const { maxPrice, minTier } = filters;
  return Object.entries(PARTS_DB)
    .filter(([, part]) => part.category === category)
    .map(([id]) => getPartById(id))
    .filter((part) => {
      if (minTier != null && part.tier < minTier) return false;
      if (maxPrice != null) {
        const numericPrice = parseFloat(String(part.price).replace(/[$,]/g, ''));
        if (!isNaN(numericPrice) && numericPrice > maxPrice) return false;
      }
      return true;
    });
}

/** Specs for a part the user says they already own — same lookup, named for the caller's intent. */
export function getCurrentPartSpecs(id) {
  return getPartById(id);
}

/** Every category name present in the catalog, e.g. ["CPU", "GPU", ...]. */
export function getCategories() {
  return [...new Set(Object.values(PARTS_DB).map((p) => p.category))];
}
