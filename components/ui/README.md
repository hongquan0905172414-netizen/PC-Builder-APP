# UI Primitives

Reusable styled components — buttons, cards, alerts, inputs.

This is the **Design** layer. Components here should:

- Only handle presentation, not business logic
- Use design tokens from `tailwind.config.ts`, not hardcoded values
- Be composable — small, focused, reusable

## Naming

Prefix with `Rig` to distinguish from generic React patterns:
`RigButton.tsx`, `RigCard.tsx`, `RigAlert.tsx`.

## Examples to build (when ready)

- `RigButton` — primary, secondary, danger variants
- `RigCard` — surface for content blocks
- `RigAlert` — info / warning / blocker severities (matches the
  Warning type from the rules engine)
- `RigBadge` — small labels
- `RigInput` — text input
