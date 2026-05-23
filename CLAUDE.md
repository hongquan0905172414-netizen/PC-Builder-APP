# Project Context — [PROJECT NAME UNDECIDED]

This file is read by Claude Code at the start of every session. It is
the shared briefing for anyone — teammate or AI — working on this
project. Keep it updated as decisions get made.

> **Naming note:** The project name is not decided yet. The GitHub repo
> is currently `PC-Builder-APP`; a landing-page mockup used "BuildCore";
> earlier planning used "RIG". Pick ONE name later, then find-and-
> replace it everywhere. Until then, the name is a placeholder.

---

## ⚠️ MOST IMPORTANT — how to work on this project

**This team works step by step, and does NOT have a clear, fixed plan
for the future.** We figure things out as we go. We are at the very
beginning.

Because of that:

- **Do NOT impose a big set of rules, conventions, or settings on us.**
  We have not decided most things, and we do not want to be locked
  into structures we did not choose and do not yet understand.
- **Suggest, don't enforce.** When asked to do something, do that
  thing. Offer advice if useful, but don't refuse or redirect because
  something doesn't fit a "best practice" or a convention.
- **Keep things simple.** Prefer the smallest, most beginner-friendly
  way to do something over the "scalable" or "professional" way.
- **One step at a time.** Help with the immediate task. Don't build
  ahead into features or structure we haven't asked for.
- **It's fine for things to be undecided.** This document will have
  blanks and open questions. That's expected. Don't fill them with
  assumptions.

If a future instruction conflicts with something written here, the
newer instruction from the team wins. This file is a helpful summary,
not a rulebook.

---

## What this app is — the vision (rough, may change)

An app that helps people build a custom PC from start to finish,
ideally without needing to leave the site. A beginner should be able
to go from "I want a PC" to "I built it" using the app.

Rough idea of the parts:
1. Parts selection — the user chooses components.
2. Compatibility / error checking — catch bad combinations.
3. Step-by-step build guide — walk the user through assembly. This is
   the part the team is most excited about.
4. AI assistant — answer user questions, possibly via an uploaded
   photo of their build.

None of this is built. Scope, screens, and details are all undecided.

---

## Tech stack

- **Node.js** — the runtime everything runs on.
- **Express** — the backend server framework. Lives in `/server`.
- **React** — the frontend UI library. Lives in `/client`.
- **Vite** — the build tool that runs and bundles the React app.
- **JavaScript** — plain JavaScript, NOT TypeScript.
- **JSON** — the format for data files (a file format, not a library).
- **Plain CSS** — styling. No CSS framework (no Tailwind). Styles are
  written in normal `.css` files.
- **Vitest** — the testing tool, on the client side. Set up but
  barely used yet — there's only an example test. Real tests come
  when there's real logic to test.

More tools will be added later, one at a time, when a real need
appears — e.g. a routing library when the app has multiple pages, or
something for the AI assistant feature. Not before.

The project is split into two parts in one repo:
- `/server` — the Express backend (an API).
- `/client` — the React frontend (the website the user sees).

They run as two separate things during development. The frontend
calls the backend via `/api/...` requests.

Deployment is not set up yet and not decided.

---

## Folder structure

```
/server                  → Express backend
  index.js               → server entry point (starts the server)
  package.json           → backend dependencies
  +routes                → API route files (empty for now)
  +lib                   → logic, e.g. the future rules engine (empty)
  +data                  → JSON data files (empty for now)

/client                  → React frontend
  index.html             → HTML entry point
  package.json           → frontend dependencies
  vite.config.js         → Vite build/dev config + test settings
  +src
    main.jsx             → React entry point
    App.jsx              → root component (placeholder for now)
    index.css            → global styles (plain CSS)
    example.test.js      → sample test (delete when real tests exist)
    +components          → reusable UI pieces (empty for now)
    +pages               → full-screen views (empty for now)
  +public                → static files (empty for now)

+docs                    → project documentation
README.md                → project overview
CLAUDE.md                → this file
.gitignore               → files Git should ignore
```

This structure is a starting point, not a commitment. Change it
freely if it stops fitting.

---

## How to run it

The backend and frontend run separately. Two terminals:

Terminal 1 — backend:
```
cd server
npm install      (first time only)
npm run dev
```

Terminal 2 — frontend:
```
cd client
npm install      (first time only)
npm run dev
```

Then open the URL Vite prints (usually http://localhost:3000).

To run the tests (from the `client` folder): `npm test`

---

- No deadline. Learning is part of the goal.

## Workflow

- Work goes through Pull Requests. Avoid pushing directly to `main`.
- Branch name prefixes like `feature/`, `fix/`, `docs/` are nice but
  not strict.

### Commit attribution

Commits are attributed to the human who made them. When using AI
tools (Claude Code, etc.), do NOT add AI co-author trailers (like
`Co-authored-by: Claude ...`) to commit messages. Using AI to help
write code is fine — this is only about keeping the GitHub
contribution history a record of the people on the team.

---

## Immediate next steps (the only ones we're committing to)

1. Decide the project name.
2. Decide what goes on the landing page (a simple list of contents).
3. Build the landing page.

We are not planning past that yet, and that's intentional.

---

## How to use this document

- Read it at the start of a session for context.
- Update it when something real changes.
- It is a summary, not a law. If it's wrong, fix it.
- It is fine for it to be incomplete. Don't fill blanks with guesses.
