# PC Builder App

An app to help people build a custom PC from start to finish — parts
selection, compatibility checking, a step-by-step build guide, and an
AI assistant.

> Project name not finalized yet. Repo is `PC-Builder-APP` for now.

## Status

🚧 Very early. The skeleton is set up but nothing is built yet.

---

## 👋 New to coding? Read [`docs/SETUP.md`](./docs/SETUP.md) first.

It explains everything step by step — installing tools, downloading
the project, running it — written for people who have never coded.

---

## Tech stack

- **Node.js** — runtime
- **Express** — backend server (`/server`)
- **React** + **Vite** — frontend (`/client`)
- **JavaScript** (not TypeScript)
- **Plain CSS** — for styling (no CSS framework)
- **Vitest** — for testing (on the client side)

The project has two parts: a backend (`/server`) and a frontend
(`/client`), in one repo.

More tools (routing, etc.) get added later, when actually needed.

## Running it

The backend and frontend run separately, in two terminals.

**Terminal 1 — backend:**
```bash
cd server
npm install      # first time only
npm run dev
```

**Terminal 2 — frontend:**
```bash
cd client
npm install      # first time only
npm run dev
```

Then open the URL Vite shows (usually http://localhost:3000).

## Running the tests

From the `client` folder:
```bash
npm test
```
There's one example test right now. Real tests get added as there's
real logic to test.

## Folder structure

```
/server          → Express backend
  index.js       → starts the server
  /routes        → API route files
  /lib           → logic (e.g. future rules engine)
  /data          → JSON data files
/client          → React frontend
  index.html     → HTML entry point
  /src
    main.jsx     → React entry point
    App.jsx      → root component
    index.css    → global styles (plain CSS)
    example.test.js → sample test (delete when real tests exist)
    /components  → reusable UI pieces
    /pages       → full-screen views
  /public        → static files
/docs            → documentation
CLAUDE.md        → project context (read this for the full picture)
```

## Project context

[`CLAUDE.md`](./CLAUDE.md) has the fuller picture — the vision, how
the team works, current decisions.

## Workflow

- Work via pull requests; avoid pushing straight to `main`.
- Branch names: `feature/`, `fix/`, `docs/` (loose, not strict).
- Commits are attributed to the human author — no AI co-author
  trailers.


