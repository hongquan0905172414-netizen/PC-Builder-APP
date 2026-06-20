# PC Builder App

An app to help people build a custom PC from start to finish — parts
selection, an AI build assistant, compatibility checking, and a
step-by-step assembly guide.

> Project name not finalized yet. Repo is `PC-Builder-APP` for now.

---

## 👋 New to coding? Read [`docs/SETUP.md`](./docs/SETUP.md) first.

It explains everything step by step — installing tools, downloading
the project, running it — written for people who have never coded.

---

## If you're debugging X, go here

| You're looking at... | Go to | Notes |
|---|---|---|
| **UI / layout / user interaction** | `client/src/pages/` (`Home.jsx`, `Wizard.jsx`, `PartPicker.jsx`) and `client/src/components/` | `Wizard.jsx` is the big one — it holds the AI Builder chat screen, the manual quiz flow, and the Lego-style assembly guide all in one file. |
| **The AI's recommendations** | `server/ai/` | Five sub-systems: `data-system` (facts), `language-system` (the prompt + Claude call), `orchestration` (runs the request through the others), `validation-system` (catches AI mistakes), `evaluation-system` (test runner). Read `server/ai/README.md` first. |
| **The one true source of part facts** | `server/data/parts.json` | The only catalog wired to the backend AI features (compatibility engine + both chat features). **Not** the same data as `client/src/data/parts.js` or `templates.js` — those are separate, disconnected catalogs used only by the manual Part Picker and quiz-matching screens, respectively. If a price looks wrong, check which screen you're on before assuming it's this file. |
| **Compatibility logic** (socket/wattage/clearance checks) | `server/lib/compatibility/` (`rules.js` + `engine.js`) | Pure deterministic code, zero AI calls. `validation-system` in `server/ai/` reuses this same engine rather than re-checking compatibility itself. |
| **Prices** | `server/data/parts.json` (real, AI-facing) — but see the source-of-truth note above. The "live ticking" prices on the quiz-results screen (`lib/prices.js`) are simulated jitter on hardcoded numbers in `templates.js`, not real data. | |
| **Frontend → AI route** | `server/index.js` | `POST /api/chat` (AI Builder chat) and `POST /api/recommend` (new recommendation feature) both live here as thin route handlers. No routing logic lives in `server/routes/` yet — that folder is still a placeholder. |

## Status

Parts selection, AI chat builder, compatibility engine, and the
five-system AI recommendation feature are built. Manual part picker and
quiz-template matching exist but use their own separate (non-AI,
non-backend) data — see the table above. Assembly guide is a static
step-by-step flow, not yet personalized beyond part names.

---

## Tech stack

- **Node.js** — runtime
- **Express** — backend server (`/server`)
- **React** + **Vite** — frontend (`/client`)
- **JavaScript** (not TypeScript)
- **Plain CSS** — for styling (no CSS framework)
- **Vitest** — for testing (both client and server)
- **Anthropic API** (`@anthropic-ai/sdk`) — the AI chat + recommendation features

The project has two parts: a backend (`/server`) and a frontend
(`/client`), in one repo.

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

From `client`: `npm test` (Vitest, frontend).
From `server`: `npm test` (Vitest, the compatibility engine) and
`npm run eval` (runs the AI recommendation feature's seed test prompts
against the real model — see `server/ai/evaluation-system/`).

## Folder structure

```
/server
  index.js              → starts the server; thin route handlers (/api/chat, /api/recommend, /api/health)
  /data/parts.json      → THE catalog — prices/specs/compat facts for every AI-facing feature
  /lib/compatibility/   → deterministic socket/wattage/clearance rules engine (no AI)
  /ai/                  → the five-system AI recommendation feature (see server/ai/README.md)
  /tests/               → Vitest unit tests for the compatibility engine

/client
  /src
    main.jsx, App.jsx   → React entry point
    /pages              → Home, Wizard (AI builder + quiz + assembly guide), PartPicker (manual picker)
    /components         → PC3D and other reusable UI pieces
    /data                → parts.js, templates.js — separate hardcoded catalogs (see debugging table above)
    /lib                 → scoring.js (quiz matching), prices.js (simulated price jitter), storage.js

/docs                   → documentation, including SETUP.md
CLAUDE.md                → project context — vision, how the team works, current decisions
```

## Project context

[`CLAUDE.md`](./CLAUDE.md) has the fuller picture — the vision, how
the team works, current decisions.

## Workflow

- Work via pull requests; avoid pushing straight to `main`.
- Branch names: `feature/`, `fix/`, `docs/` (loose, not strict).
- Commits are attributed to the human author — no AI co-author
  trailers.
