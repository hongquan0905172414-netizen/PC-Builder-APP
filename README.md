# RIG

A smart companion app for building custom PCs. Focused on the physical
assembly phase, RIG acts as a guardrail system that warns users about
silent installation traps before they power on a build.

## Status

🚧 Early scaffolding. The structure is in place but nothing is built
yet. We're at the very beginning.

---

## 👋 New to coding? Start here.

If you've never coded before, **read [`docs/SETUP.md`](./docs/SETUP.md)
first**. It's written for absolute beginners and walks you through
everything step-by-step — installing the tools, downloading the
project, running it on your computer. Don't skip ahead.

If you're new but want to understand the project structure too, read
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) after you get RIG
running.

---

## 💻 Already comfortable with code?

Quick start:

```bash
git clone https://github.com/hongquan0905172414-netizen/PC-Builder-APP.git
cd PC-Builder-APP
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Vercel for deployment
- No database in v1 — JSON files + localStorage

## Project context

[`CLAUDE.md`](./CLAUDE.md) is the project briefing — architecture,
conventions, scope, team context. Read this if you want the full
picture. Claude Code reads it automatically.

## Folder structure

```
/app          → Next.js pages — each folder is a URL route
  page.tsx           → the home page at /
  layout.tsx         → shared layout wrapping every page
  globals.css        → global styles (Tailwind directives)
  +home              → /home route
    page.tsx         → Home tab content
  +my-parts          → /my-parts route
    page.tsx         → My Parts tab content
  +assembly          → /assembly route
    page.tsx         → Assembly tab content
  +troubleshoot      → /troubleshoot route
    page.tsx         → Troubleshoot tab content
  +marketplace       → /marketplace route
    page.tsx         → Marketplace tab content (parked for v1)

/components   → React components (Skeleton + Design)
  +ui                → Reusable styled primitives
                       (RigButton, RigCard, RigAlert, etc. — empty for now)
    README.md        → notes on what goes here
  README.md          → notes on what goes here

/lib          → Business logic (Brains) — no React, no UI
  +rules-engine
    index.ts         → the validate(build) function (stub for now)
    CLAUDE.md        → folder-specific notes for Claude Code
  +types
    index.ts         → shared TypeScript types (Part, Build, Warning)

/data         → JSON files (no code)
  README.md          → notes on parts catalog and rules format

/docs         → Project documentation
  README.md          → docs index
  SETUP.md           → beginner setup guide (start here if new)
  ARCHITECTURE.md    → how the project is structured

/public       → Static assets served at the root URL
  +icons             → icon files (empty for now)
  README.md          → notes on static assets

Root files
  CLAUDE.md          → project context for AI tooling
  README.md          → project overview
  package.json       → project info + dependencies (npm reads this)
  package-lock.json  → exact dependency versions (generated, don't edit)
  tsconfig.json      → TypeScript settings
  next.config.ts     → Next.js settings
  tailwind.config.ts → Tailwind CSS design tokens
  postcss.config.mjs → PostCSS settings (Tailwind needs this)
  vitest.config.ts   → test runner settings
  next-env.d.ts      → Next.js TypeScript declarations (generated, don't edit)
  .gitignore         → tells Git which files to ignore

```

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full
explanation.

## Workflow

- All work via pull requests, **no pushing to `main`**
- Branch naming: `feature/`, `fix/`, `chore/`, `docs/`
- Reference an issue in each PR when possible
- Reviews before merge — even quick ones count

## Team

Beginner team project. Lead: Quân. Learning together, no hard deadline.
Everyone contributes — code, parts data, design, copywriting, user
testing. See `CLAUDE.md` for context on roles.
