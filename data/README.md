# Data

This folder holds the static data that drives RIG.

## Subfolders (to be created as needed)

- `/parts` — Parts catalog JSON. One file per category (or per part —
  TBD). Schema defined by the `Part` type in `/lib/types`.
- `/rules` — Validation rule definitions. Schema TBD. Loaded by the
  rules engine.

## For teammates contributing data

You can contribute to RIG without writing code by adding parts and
rules to this folder. Talk to Quân about the current schema before
adding files — it's still being designed.
