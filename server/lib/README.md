# lib — logic (the "brains")

Business logic lives here, separate from the Express routes.

The most important future resident is the **rules engine** — the part
of the app that takes a build and checks for compatibility problems
and assembly mistakes.

Nothing here yet.

## Guidelines (loose, not rules)

- Keep this code plain — functions that take data and return data.
- No Express stuff in here (no `req`, no `res`). Routes call into
  this; this doesn't know about HTTP.
- This makes the logic easy to test and reuse.

When the time comes to write the first real rule, just pick one
specific PC-building trap, write it however feels natural, get it
working, then see if a pattern emerges. Don't over-plan it.
