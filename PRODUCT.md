# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Indonesian retail investors who trade through Stockbit or Ajaib and hold a position, often one in
loss. They open Rata on a phone, usually next to the broker app, to check before placing an order:
how many lots to buy or sell, what the new average becomes, how much cash the order needs, and what
lands after fees.

## Product Purpose

Rata turns a position and a planned order into the numbers the broker app does not show in advance:
the new weighted average, cash needed including the buy fee, net proceeds after the sell fee,
realized and running profit or loss, the most whole lots a budget covers, and the fewest lots that
reach a target average or target net amount. Success means the investor places the order already
knowing the result, and the result matches the broker's own numbers.

## Positioning

Rata applies each broker's published fee rate and that broker's own rounding (Stockbit floors to the
whole rupiah, Ajaib keeps fractions), reads numbers the way Indonesians write them (`1.250`,
`390,37`), and warns when a price misses the IDX tick size. It runs entirely in the browser and works
offline.

## Operating Context

- Used on phones beside a broker app, and on desktop during market hours.
- Inputs are copied from the broker's portfolio screen: lots, average price, market price.
- 1 lot = 100 shares (IDX). Prices follow IDX tick rules (Kep-00023/BEI/04-2016).
- Installed as a PWA by some users; must keep working offline.

## Capabilities and Constraints

- Buy mode, sell mode, and a target-average search inside buy mode.
- Brokers: Stockbit and Ajaib only. Adding brokers needs rates confirmed from each broker's own site.
- No network requests, storage, analytics, or server-side processing of portfolio data.
- Formulas live as pure functions in `src/lib/rata.ts` with tests in `src/lib/rata.spec.ts`.
- Canonical origin: `https://rata.ekel.dev`. Pages are prerendered.
- Interface copy is Indonesian.

## Brand Commitments

- Name: Rata (plays on _rata-rata_, "average", and _rata_, "level").
- Logo: the r̄ mark (`docs/logo/rata-logo.svg`, `static/favicon.svg`).
- Visual system is binding: square corners, flat surfaces with no shadows, 1px borders, the `rata`
  and `rata-dark` daisyUI palettes (green primary on neutral greys), Geist with Geist Mono, and the
  framed content column with ruled sections.

## Evidence on Hand

- Broker fee sources: Stockbit help center and `ajaib.co.id/biaya`, rates checked 31 August 2026.
- App screenshots in `static/screenshots/`.
- No testimonials, user counts, or press. Do not invent any.

## Product Principles

1. The result must match the broker's statement to the rupiah; precision outranks decoration.
2. The answer comes first: the new average or net proceeds is the thing the investor came for.
3. Portfolio data never leaves the device.
4. Explain the formula and the fee assumptions in plain Indonesian, without investment advice.

## Accessibility & Inclusion

Keyboard-complete flows, visible focus, complete labels, one spoken result summary per change,
light and dark modes from the system, and reduced-motion support.
