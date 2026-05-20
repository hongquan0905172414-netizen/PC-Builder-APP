# Architecture

RIG's architecture follows a **Skeleton / Design / Brains** separation.
Keep these layers clean and the codebase stays manageable as it grows.

## The three layers

### Skeleton — `/components` and `/app`

Pure structure. React components and Next.js pages. No business logic,
no hardcoded styling. Composes primitives from the Design layer to
build screens.

### Design — `/components/ui` and `tailwind.config.ts`

Design tokens (colors, typography, spacing) and the reusable styled
primitives that consume them. This is what makes RIG visually
consistent. If a component hardcodes a color, it belongs here, not
Skeleton.

### Brains — `/lib`

Business logic. The rules engine (`/lib/rules-engine`) and shared
types (`/lib/types`). Pure TypeScript. No React, no DOM, no
framework dependencies. This layer should be portable — if we ever
port RIG to Swift for iOS, this is the layer that ports.

## Data flow

```
User picks parts
       ↓
  Build object (in /lib/types)
       ↓
  Rules engine (/lib/rules-engine)
       ↓
  Warning[] (in /lib/types)
       ↓
  Rendered by UI components
```

## Why this separation matters

1. **Multiple people can work in parallel** — designer in Design,
   logic person in Brains, UI person in Skeleton.
2. **Testing is easier** — Brains can be tested without any UI.
3. **Future portability** — the iOS port becomes feasible because
   Brains doesn't depend on the web stack.
4. **Onboarding** — new contributors can learn one layer at a time.

## What goes where — quick reference

| Thing                          | Lives in           |
| ------------------------------ | ------------------ |
| Page route                     | `/app`             |
| Page-specific component        | `/components`      |
| Reusable button / card / alert | `/components/ui`   |
| Color or font definition       | `tailwind.config`  |
| Compatibility rule             | `/data/rules`      |
| Rule evaluation logic          | `/lib/rules-engine`|
| Part / Build / Warning types   | `/lib/types`       |
| Static parts data              | `/data/parts`      |
