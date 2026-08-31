# Agent Guide

## Commands

- Install: `bun install --frozen-lockfile`
- Develop: `bun run dev`
- Format and lint check: `bun run lint`
- Type and Svelte check: `bun run check`
- Unit tests: `bun run test`
- Production build: `bun run build`

Use Bun only and keep `bun.lock` authoritative.

## Boundaries

- Keep financial calculations as pure functions in `src/lib/rata.ts`.
- Keep route state and presentation in `src/routes/+page.svelte`.
- Calculations must remain client-side. Do not add persistence, analytics, or network submission.
- Use daisyUI components and semantic theme tokens from `src/routes/layout.css`.
- Preserve Indonesian copy, native form semantics, visible focus, and reduced-motion behavior.
- Add or update unit tests whenever formulas, lot rounding, or fee handling change.
