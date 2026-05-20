# Rules Engine — Notes

This folder is where validation logic *will* live — the part of RIG
that takes a build and warns about assembly mistakes.

**Right now this folder is mostly empty.** A stub `validate()`
function exists but doesn't do anything yet.

## Current thinking (not committed)

- Eventually we want rules to be **data** (JSON definitions) so adding
  a new trap doesn't require writing new code. But we're not there yet
  and that's okay.
- We want this code to be portable (no React, no DOM, just TypeScript)
  in case we ever go native. Again, aspirational — don't refuse code
  changes for this reason yet.

## How to actually start

When the time comes to write real rules:
1. Pick one specific PC-building trap (e.g., "DDR5 + AM5 = warn about
   long memory training on first boot").
2. Write it however feels natural — code, data, doesn't matter yet.
3. Get it working end-to-end with a test.
4. *Then* think about whether the pattern generalizes.

Don't over-architect before there are real examples to architect for.
