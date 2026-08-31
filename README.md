# Rata

Rata is a client-side stock transaction calculator for Indonesian equities. It helps investors
estimate the effect of a planned purchase or sale before submitting an order to their broker.

The application calculates the post-purchase average price, position size, invested value,
required buying power, net sale proceeds, realized and unrealized profit or loss, and the minimum
number of lots needed to reach a target average price.

## Features

- Calculate the weighted average price after a planned purchase.
- Convert lots to shares using the Indonesian market standard of 100 shares per lot.
- Estimate Stockbit buy and sell fees, required buying power, and net sale proceeds.
- Project the final lot count, share count, invested value, and unrealized profit or loss.
- Estimate realized profit or loss after a partial or complete sale.
- Find the minimum whole-lot purchase required to reach a target average price.
- Reject non-positive prices, fractional lots, and sales larger than the current position.
- Keep all portfolio data and calculations in the browser.
- Support responsive layouts, keyboard navigation, and system light or dark mode.

## Calculation Model

Rata uses a weighted-average model based on transaction prices:

```text
current shares        = current lots × 100
additional shares     = additional lots × 100
final shares          = current shares + additional shares
current investment    = current shares × current average price
purchase value        = additional shares × purchase price
final average price   = (current investment + purchase value) ÷ final shares
buy fee               = purchase value × 0.15%
required buying power = purchase value + buy fee
```

For planned sales:

```text
sold shares          = sale lots × 100
sale value           = sold shares × sale price
sell fee             = sale value × 0.25%
net proceeds         = sale value − sell fee
sold cost basis      = sold shares × current average price
realized profit/loss = net proceeds − sold cost basis
remaining lots       = current lots − sale lots
```

A partial sale does not change the average price of the remaining shares. Transaction fees are
excluded from the displayed purchase average and invested value. Realized profit or loss includes
the planned sell fee but excludes historical buy fees because they cannot be derived from the
available inputs.

### Stockbit Fee Assumptions

The calculator applies the following Stockbit Sekuritas rates:

- Stock purchase fee: 0.15%
- Stock sale fee: 0.25%

A Rp10,000 stamp duty may apply when the total daily transaction value exceeds Rp10 million. Rata
does not add it automatically because eligibility depends on aggregate daily activity rather than
a single planned order.

See the official [Stockbit transaction fee documentation](https://help.stockbit.com/id/article/transaksi-saham-berapa-biaya-trading-di-stockbit-sekuritas-1lbkyq9/).

## Technology Stack

- SvelteKit and Svelte 5
- TypeScript
- Tailwind CSS 4
- daisyUI 5
- Vitest
- Bun

## Requirements

- Bun 1.3.11 or later

## Getting Started

Install the locked dependencies:

```sh
bun install --frozen-lockfile
```

Start the development server:

```sh
bun run dev
```

Open the local URL printed by Vite, typically `http://localhost:5173`.

## Verification

Run the complete local verification suite before submitting changes:

```sh
bun run lint
bun run check
bun run test
bun run build
```

| Command         | Purpose                                  |
| --------------- | ---------------------------------------- |
| `bun run lint`  | Check formatting and ESLint rules        |
| `bun run check` | Run Svelte and TypeScript diagnostics    |
| `bun run test`  | Run deterministic unit tests with Vitest |
| `bun run build` | Produce a production SvelteKit build     |

The same checks run in GitHub Actions for pushes to `main` and pull requests.

## Deploying to Cloudflare Pages

Use the following Cloudflare Pages build configuration:

| Setting                | Value                    |
| ---------------------- | ------------------------ |
| Framework preset       | SvelteKit                |
| Build command          | `bun run build`          |
| Build output directory | `.svelte-kit/cloudflare` |
| Root directory         | Repository root          |

Set `BUN_VERSION` to `1.3.11` in the Pages environment variables. The build script performs a
frozen Bun install before invoking Vite because Cloudflare Pages may not automatically detect the
text-based `bun.lock` format. This guarantees that build-time dependencies are present without
moving Vite into production dependencies.

## Smoke Test

The initial example uses the following values:

| Input                  |    Value |
| ---------------------- | -------: |
| Current position       | 297 lots |
| Current average price  |    Rp397 |
| Current market price   |    Rp342 |
| Planned purchase       |  39 lots |
| Planned purchase price |    Rp342 |

Expected results:

| Result                     |        Value |
| -------------------------- | -----------: |
| Final position             |     336 lots |
| Final average price        |     Rp390,62 |
| Final invested value       | Rp13.124.700 |
| Estimated Stockbit buy fee |      Rp2.001 |
| Required buying power      |  Rp1.335.801 |

The sell tab uses the same current position with a planned sale of 39 lots at Rp342:

| Result                         |       Value |
| ------------------------------ | ----------: |
| Remaining position             |    258 lots |
| Gross sale value               | Rp1.333.800 |
| Estimated Stockbit sell fee    |     Rp3.335 |
| Net proceeds                   | Rp1.330.466 |
| Estimated realized profit/loss |  −Rp217.835 |

## Project Structure

```text
src/
├── lib/
│   ├── CalculatorTabs.svelte  # Accessible transaction-mode tabs
│   ├── rata.ts                # Pure financial calculation functions
│   └── rata.spec.ts           # Formula and boundary unit tests
└── routes/
    ├── +page.svelte      # Calculator interface and client state
    └── layout.css        # Tailwind, daisyUI themes, and design tokens
```

## Privacy and Limitations

- Rata does not submit, persist, or transmit portfolio inputs.
- Results are estimates and may differ from broker statements because of rounding, fee changes,
  taxes, or other account-specific charges.
- Rata does not provide market data or execute trades.
- The application is an educational planning tool and does not provide investment advice.

Always verify the final order value and applicable charges with the broker before trading.
