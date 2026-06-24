# RIG AI parts-recommendation feature

Five systems, five folders, one job each. If you're not sure where a piece
of code belongs, find its job in this table — that's its folder.

| Folder | Job (one line) | Never | Owner |
|---|---|---|---|
| [`data-system/`](data-system) | Return verified facts about parts, by ID. | Contain opinions, recommendations, tone, or user-facing language. | engineering (co-founders) |
| [`language-system/`](language-system) | Pick parts by ID from the candidates it's handed, and write the explanation. | Invent or recall a spec/price/part from its own memory. | engineering (co-founders) |
| [`orchestration/`](orchestration) | Run a request through the other four systems, in order. | Make recommendations or decide tone itself. | engineering (co-founders) |
| [`validation-system/`](validation-system) | Catch the AI's mistakes in code, before the user sees anything. | Trust the AI's output blindly. | engineering (co-founders) |
| [`evaluation-system/`](evaluation-system) | Run test prompts with pass/fail criteria after every change. | Be skipped because a change seemed small. | product (Duc) |

## How a request flows

```
request → orchestration
            ├─ 1. parse goal / budget / current parts
            ├─ 2. data-system      → candidate parts + current part specs
            ├─ 3. language-system  → picks IDs + writes explanation
            ├─ 4. validation-system → 5 checks against the language output
            │     fail → re-prompt language-system once with the failure noted
            │     fail again → safe fallback message, never shown a failing response
            └─ 5. stitch real prices back in from data-system, return
```

## Where the catalog lives

`data-system/` does **not** own a separate parts file. It reads
`server/data/parts.json` — the same catalog already used by the
compatibility engine (`server/lib/compatibility/`) and the chat feature
(`server/index.js`). One file, three consumers. A second copy would drift
out of sync with the first (prices, specs, tiers) — exactly the kind of
bug this app already hit once and fixed.

`getPartById`, `getCandidates`, and `getCurrentPartSpecs` in
`data-system/parts.js` are the only functions anything in `/ai` should use
to read part data. Price retrieval specifically goes through one function
(`getPrice`, used internally by `getPartById`) — that's the seam for
swapping in the Amazon Product Advertising API later without touching
anything else.

## Validation reuses the compatibility engine

The compatibility check in `validation-system/validate.js` doesn't
reimplement socket/wattage/clearance rules — it calls
`checkCompatibility()` from `server/lib/compatibility/engine.js`, the same
deterministic engine already built for the "upgrade my PC" feature. Same
rules, same facts, checked once, in one place.

## Running things

```
cd server
npm run eval     # runs the seed eval cases against orchestration
npm test         # runs the compatibility engine's unit tests (unrelated to /ai, but lives in the same backend)
```

`POST /api/recommend` in `server/index.js` is the HTTP entry point. It is
transport plumbing only — it calls `orchestrate()` and returns whatever
comes back, with no logic of its own.

## File header convention

Every source file in `/ai` starts with:

```js
// SYSTEM: <which of the five>
// JOB: <its one job, one line>
// NEVER: <what this file must never do>
// OWNER: <product = Duc | engineering = co-founders>
```

If you can't fill in `NEVER` confidently, the file is probably doing more
than one job — that's a sign to split it before adding more code.
