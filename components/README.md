# Components

React components for RIG. This folder is the **Skeleton** layer.

Components here are larger, page-specific or feature-specific. They
compose the smaller primitives from `/components/ui` (the Design
layer).

## Guidelines

- Pure structure and composition — no hardcoded colors, no inline
  styles
- Business logic stays in `/lib`, not in components
- One component per file, filename matches export name
- PascalCase filenames: `BottomNav.tsx`, `ActiveBuildCard.tsx`
