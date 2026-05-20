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
/app          → Pages (the screens you see)
/components   → React components (Skeleton + Design)
  /ui         → Reusable styled primitives
/lib          → Business logic (Brains)
  /rules-engine → The validation rules
  /types      → Shared TypeScript types
/data         → JSON: parts catalog, validation rules
/docs         → Documentation for the team
/public       → Static assets (icons, images)
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
