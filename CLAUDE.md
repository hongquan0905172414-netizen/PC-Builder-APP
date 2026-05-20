# RIG — Project Context

This file gets read by Claude Code at the start of every session. It
tells Claude (and any teammate) what this project is and where it is
in its life. Update it as the project evolves.

---

## ⚠️ Read this first: this project is at the very beginning.

We have an **idea**, not a product. No screens designed, no features
built, no users, no clear vision yet beyond "smart companion app for
PC builders that warns about assembly mistakes."

The folder structure and files in this repo are **scaffolding to get
started**, not commitments. Almost everything is open to change. If
something in this document feels wrong once we start building, change
it — including this document.

**Claude Code: please be flexible and exploratory here, not prescriptive.**
Don't refuse changes because they don't fit a stated convention.
Suggest, don't enforce. The team is learning and figuring things out.
The goal right now is exploration and learning, not architectural purity.

---

## What RIG is (the vague version)

A companion app for people building custom PCs. The interesting angle
is **physical assembly mistakes** — cables in the wrong port, RAM in
the wrong slot, AM5 memory training surprises, GPU vs iGPU display
output confusion — not parts compatibility at purchase time (that's
PCPartPicker's space, and they already do it well).

That's the angle. Everything else — what screens look like, how
features work, what's in v1 — is undecided.

---

## Stack (this part is committed)

- **Next.js** (App Router) with **TypeScript**
- **React** (comes bundled with Next.js)
- **Tailwind CSS** for styling
- **Vercel** for deployment
- **GitHub** for version control

These are committed because `npm install` already happened (or will
soon) and changing them means starting over. If you want to add a
library, that's fine — discuss it with the team first so we don't end
up with five competing tools for the same thing.

---

## Team workflow (this part is committed)

- **All work goes through Pull Requests.** No pushing directly to `main`.
- Branch names: `feature/`, `fix/`, `chore/`, `docs/` prefixes are
  nice but not strict.
- Quick code review before merge — even a glance counts.

This is committed because the team is learning, and PRs are how
teammates see each other's work and learn from it. Pushing to main
removes that learning loop and tends to break things.

---

## Current thinking (NOT committed — change freely)

These are our current best guesses about how to organize things. None
of them are locked in. If they feel wrong while building, change them
and update this section.

**Folder structure (current sketch):**

```
/app          → Pages (Next.js routing)
/components   → React components
  /ui         → Small reusable styled pieces (buttons, cards, etc.)
/lib          → Logic that isn't UI
  /rules-engine → The validation rules (the "brains" of RIG)
  /types      → Shared TypeScript types
/data         → JSON files: parts catalog, validation rules
/docs         → Project documentation
/public       → Static files (icons, images)
```

**"Skeleton / Design / Brains" idea:**

A loose mental model we've been using:
- **Skeleton** = structural React components (the layout, the pages)
- **Design** = visual primitives + Tailwind tokens (the look)
- **Brains** = pure logic, especially the rules engine (the smarts)

This is a *thinking tool*, not a rulebook. If a piece of code doesn't
cleanly fit one bucket, don't force it.

**Rules engine direction:**

We've been talking about making validation rules be *data* (JSON
definitions) rather than hardcoded `if/else` in TypeScript. The
reasoning: as rules grow from 10 to 200, data is easier to manage
than code. But if v1 only has 5 rules and code is simpler to start
with, that's fine. We can refactor when it actually matters.

---



No deadline. Learning is part of the goal. Real users are a future
ambition, not a v1 requirement.
No push with sight of AI or Claude used when pushing the code, dont let claude be in the contribution of the github

---

## What this project is NOT (for now)

- Not trying to compete with PCPartPicker on parts data
- Not a marketplace (the Marketplace tab in our early sketches is
  parked — probably won't ship in v1)
- Not trying to cover every edge case — focused on common silent-
  failure traps to start

These can change too. If we discover the marketplace idea is actually
the most exciting part, we follow that.

---

## Open questions to revisit later

- What does v1 actually contain? Pick a small slice.
- What do the screens look like? No visual direction yet.
- Where does parts data come from? Manual entry, scraped, licensed?
- When do we need a database instead of localStorage?
- Do we ever go native iOS? If so, when?
- Do we keep the Marketplace tab idea or drop it?

---

## How to use this document

- Read it at the start when you join the project.
- Update it when something important changes.
- Don't treat it as law. If a section doesn't fit reality anymore,
  rewrite it.
- If you find yourself working around something this document says,
  the document is probably wrong — change the document.
  
