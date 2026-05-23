# Routes

Express route files go here. Each file handles one group of related
API endpoints.

Nothing here yet — routes get added as features are built.

When you add one:
1. Create a file, e.g. `parts.js`, that exports an Express router.
2. Import it in `../index.js` and mount it with `app.use(...)`.

Keep route files thin — they handle the HTTP request/response.
Actual logic (like the rules engine) lives in `../lib`.
