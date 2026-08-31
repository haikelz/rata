# Repository Guidelines

## Project Overview

Rata is a client-side stock purchase calculator built with SvelteKit, TypeScript, Tailwind CSS, and
daisyUI. Portfolio inputs must remain local to the browser. The application has no persistence,
analytics, or transaction-submission layer.

## Canonical Commands

- Install dependencies: `bun install --frozen-lockfile`
- Start development: `bun run dev`
- Check formatting and lint: `bun run lint`
- Check Svelte and TypeScript: `bun run check`
- Run unit tests: `bun run test`
- Build for production: `bun run build`

Use Bun exclusively and treat `bun.lock` as authoritative.

## Architecture

- Keep financial formulas as pure functions in `src/lib/rata.ts`.
- Keep formula and boundary tests in `src/lib/rata.spec.ts`.
- Keep route state and presentation in `src/routes/+page.svelte`.
- Keep global design tokens and daisyUI themes in `src/routes/layout.css`.
- Do not add network requests, storage, analytics, or server-side portfolio processing.
- Avoid speculative abstractions, stores, services, or directories.

## Implementation Standards

- Use strict TypeScript without `any`, unchecked assertions, or weakened compiler settings.
- Preserve Indonesian interface copy unless a product requirement explicitly changes the locale.
- Use native semantic controls, visible focus states, complete labels, and keyboard-accessible flows.
- Preserve responsive behavior, system light and dark modes, and reduced-motion support.
- Use daisyUI components and semantic theme tokens rather than hard-coded component colors.
- Keep calculations deterministic and independent of browser APIs.

## Verification Requirements

- Add or update unit tests whenever formulas, validation, lot rounding, or fee handling change.
- Run `bun run lint`, `bun run check`, `bun run test`, and `bun run build` before completing code
  changes.
- Render interface changes at desktop and mobile widths and verify keyboard and accessibility
  behavior.
