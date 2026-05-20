/**
 * Shared TypeScript types for RIG.
 *
 * These types are the contract between the data layer, the rules
 * engine, and the UI. Keep them stable and well-documented — changes
 * here ripple everywhere.
 */

// Part categories. Extend as the catalog grows.
export type PartCategory =
  | "cpu"
  | "motherboard"
  | "ram"
  | "gpu"
  | "psu"
  | "case"
  | "cooler"
  | "storage";

/**
 * A single hardware part in the catalog.
 * The `specs` field is intentionally loose for now — we'll tighten it
 * per-category as the catalog evolves.
 */
export interface Part {
  id: string;
  category: PartCategory;
  brand: string;
  model: string;
  // Category-specific specs (socket, form factor, wattage, etc.)
  specs: Record<string, unknown>;
}

/**
 * A user's build — the collection of parts they've selected, plus
 * assembly progress.
 */
export interface Build {
  id: string;
  name: string;
  parts: Part[];
  // Assembly progress tracked by step id, to be defined.
  completedSteps: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Severity levels for rule engine output.
 * - info: nice to know
 * - warning: likely problem, user should be aware
 * - blocker: do not proceed, will damage hardware or fail boot
 */
export type WarningSeverity = "info" | "warning" | "blocker";

/**
 * The output of the rules engine for a given build.
 */
export interface Warning {
  ruleId: string;
  severity: WarningSeverity;
  title: string;
  message: string;
  // Optional: which parts are involved
  relatedPartIds?: string[];
}
