---
name: Rata
description: A ruled, flat stock-order calculator that reads like a broker's ledger.
colors:
  paper: 'oklch(97% 0 0)'
  paper-sunk: 'oklch(94% 0 0)'
  rule: 'oklch(87% 0 0)'
  ink: 'oklch(17.5% 0 0)'
  ledger-green: 'oklch(47% 0.105 157)'
  ledger-green-content: 'oklch(98% 0.008 157)'
  tick-amber: 'oklch(55% 0.12 75)'
  loss-red: 'oklch(51% 0.18 27)'
  paper-dark: 'oklch(17.5% 0 0)'
  paper-sunk-dark: 'oklch(21% 0 0)'
  rule-dark: 'oklch(30% 0 0)'
  ink-dark: 'oklch(97% 0 0)'
  ledger-green-dark: 'oklch(72% 0.13 157)'
  ledger-green-content-dark: 'oklch(16% 0.025 157)'
  tick-amber-dark: 'oklch(77% 0.12 75)'
  loss-red-dark: 'oklch(70% 0.16 27)'
typography:
  answer:
    fontFamily: "'Geist Mono Variable', ui-monospace, monospace"
    fontSize: '3rem'
    fontWeight: 500
    lineHeight: 1
    letterSpacing: '-0.04em'
    fontFeature: 'tnum'
  headline:
    fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '2.25rem'
    fontWeight: 500
    lineHeight: 1.11
    letterSpacing: '-0.035em'
  title:
    fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '1.25rem'
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: '-0.025em'
  band:
    fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '1rem'
    fontWeight: 500
    lineHeight: 1.5
  lede:
    fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '1.125rem'
    fontWeight: 400
    lineHeight: '2rem'
  body:
    fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: '1.75rem'
  body-sm:
    fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: '1.5rem'
  caption:
    fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: '1.25rem'
  figure:
    fontFamily: "'Geist Mono Variable', ui-monospace, monospace"
    fontFeature: 'tnum'
  figure-total:
    fontFamily: "'Geist Mono Variable', ui-monospace, monospace"
    fontSize: '1.25rem'
    fontWeight: 500
    fontFeature: 'tnum'
rounded:
  none: '0px'
spacing:
  gutter-sm: '16px'
  gutter-md: '24px'
  gutter-lg: '32px'
  label-gap: '8px'
  field-gap: '20px'
  section-y: '40px'
  band: '48px'
  bar: '56px'
  target: '44px'
components:
  button-primary:
    backgroundColor: '{colors.ledger-green}'
    textColor: '{colors.ledger-green-content}'
    rounded: '{rounded.none}'
    height: '{spacing.target}'
  button-ghost:
    textColor: '{colors.ink}'
    rounded: '{rounded.none}'
    height: '{spacing.target}'
  button-ghost-hover:
    backgroundColor: '{colors.paper-sunk}'
  input-field:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    typography: '{typography.figure}'
    rounded: '{rounded.none}'
    height: '{spacing.target}'
  tab:
    textColor: '{colors.ink}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.none}'
  tab-hover:
    backgroundColor: '{colors.paper-sunk}'
  tab-active:
    textColor: '{colors.ink}'
  nav-cell:
    textColor: '{colors.ink}'
    typography: '{typography.body-sm}'
    height: '{spacing.bar}'
  nav-cell-hover:
    backgroundColor: '{colors.paper-sunk}'
  column-band:
    textColor: '{colors.ink}'
    typography: '{typography.band}'
    height: '{spacing.band}'
  ledger-row:
    textColor: '{colors.ink}'
    typography: '{typography.body-sm}'
    padding: '10px 0'
  ledger-total:
    textColor: '{colors.ledger-green}'
    typography: '{typography.figure-total}'
    padding: '16px 0 0'
---

# Design System: Rata

## Overview

**Creative North Star: "The Ruled Ledger"**

Rata looks like a broker's statement printed on plain paper. One framed column, 72rem wide, runs
from the top bar to the footer, and its 1px side rails never break. Inside the frame, hairline rules
do every job other systems hand to cards, shadows, and spacing: they divide columns, carry section
headings, and underline each ledger line. The page has no ornament. Grey carries structure, one
green carries the path to the answer, and every figure sits in a monospace with tabular digits so
columns of rupiah align to the digit.

Density is moderate and work-focused. Controls hold a 44px target, labels sit 8px above their
fields, and fields stack 20px apart. The two surface types share the frame: the calculator splits
it into ruled working columns, and the reading pages split it into a narrow heading rail and a
wide text column. Light and dark follow the system setting and swap palettes without changing
structure.

**Key Characteristics:**

- One framed column with continuous 1px side rails, including the header bar and footer.
- Square corners on every surface and control.
- Flat: depth comes from a sunk grey tint, never a shadow.
- Geist for words, Geist Mono with tabular digits for every number.
- Green marks the mark, the current location, the action, focus, and the computed total.

## Colors

Neutral achromatic greys on a near-white paper, with one forest green and two signal colors for
warnings and losses.

### Primary

- **Ledger Green** (`ledger-green`, dark `ledger-green-dark`): the logo mark, the 2px underline on
  the current nav cell and selected tab, primary buttons, focus outlines, text selection, the input
  caret, the computed total in a ledger, the moved segment and marker of the price ruler, and gains
  (daisyUI `success` and `accent` alias this value).
- **Ledger Green Content** (`ledger-green-content`): text on green fills.

### Neutral

- **Paper** (`paper`): page and frame background, field background.
- **Paper Sunk** (`paper-sunk`): hover fill on nav cells, tabs and ghost buttons; table heads. At
  40 to 60 percent opacity it tints the result column, the result echo, formula blocks, and the
  target-average result.
- **Rule** (`rule`): every structural line: frame rails, section rules, column dividers, ledger
  underlines, table borders, the arrow-node outline.
- **Ink** (`ink`): headings and figures at full strength. Secondary text uses ink at reduced
  opacity: 75 percent for reading-page prose, 70 percent for ledes and footer copy, 65 percent for
  labels in ledgers and help text, 60 percent for captions and icons.

### Signal

- **Tick Amber** (`tick-amber`): IDX tick-size warnings under price fields and an unmet sell target.
- **Loss Red** (`loss-red`): validation errors, invalid field borders, and negative profit or loss.

### Named Rules

**The Green Path Rule.** Green marks where you are, what you can press, where focus sits, and the
total the order produces. Labels, borders, backgrounds, and the large answer figure stay neutral.

**The Opacity Ladder Rule.** Secondary text is ink at 75, 70, 65 or 60 percent, never a separate grey
token, so both themes stay correct from one class.

## Typography

**Display Font:** Geist Variable (with ui-sans-serif, system-ui)
**Body Font:** Geist Variable
**Label/Mono Font:** Geist Mono Variable (with ui-monospace), tabular numerals

**Character:** a neutral grotesk for language and a monospace for money. Headings carry weight 500
and negative tracking. Running text never exceeds 500; daisyUI buttons keep their 600 label weight.

### Hierarchy

- **Answer** (Mono 500, 2.75rem on phones, 3rem from 640px, line-height 1, -0.04em): the one result
  figure in the result column. The `Rp` prefix beside it drops to Geist 400 at 1.25rem in ink 60
  percent.
- **Headline** (500, 1.875rem on phones, 2.25rem from 640px, -0.035em): page H1, once per page.
- **Title** (500, 1.25rem, -0.025em): section headings in the reading-page heading rail.
- **Band** (500, 1rem): column and sub-section headings inside 48px ruled bands, link-card titles.
- **Lede** (400, 1.125rem, 2rem leading): the paragraph under a reading-page H1, max 42rem.
- **Body** (400, 1rem, 1.75rem leading): reading-page prose, capped at 68ch.
- **Body small** (400, 0.875rem, 1.5rem leading): field labels at 500, ledger rows, nav, tabs.
- **Caption** (400, 0.75rem, 1.25rem leading): help text, validation, ruler labels, working lines.
- **Figure total** (Mono 500, 1.25rem): the total row of a ledger, in green.

### Named Rules

**The Mono Figure Rule.** Every number renders in Geist Mono with tabular digits: inputs, ledger
values, table cells, fee rates, and figures inside running prose.

**The 500 Ceiling Rule.** Headings, labels and inline emphasis top out at weight 500. Use size,
tracking, and ink strength for hierarchy. Button labels are the one exception, at daisyUI's 600.

## Layout

The page is a single framed column, `max-width: 72rem`, centered, with 1px rule rails on both
sides. The header bar (56px) and the footer repeat the same rails so the frame reads unbroken.
Horizontal gutters step 16px, 24px from 640px, and 32px from 1280px. Each region ends in a 1px
bottom rule; the last child of `main` drops its rule because the footer supplies one.

Two grids recur inside the frame:

- **Working columns** (calculator): from 1024px, ruled columns with no gap between them, each
  opened by a 48px heading band. The calculator uses `1fr 1fr 1.3fr` for position, order, and
  result. Below 1024px the columns stack, each separated by a rule, and a one-line result echo
  under the tabs links down to the result.
- **Heading rail** (reading pages and the target-average panel): from 1024px, `1fr 2.3fr`, the
  heading in the narrow left cell behind a vertical rule, content right. Section padding is 40px
  vertical. Below 1024px the heading stacks above its content with a 24px gap.

Breadcrumbs, tab rows, and column headings sit in 48px ruled bands. Field stacks use a 20px gap;
label to control is 8px.

### Named Rules

**The Ruled Frame Rule.** Divide space with 1px rules that touch the frame, never with gaps,
floating cards, or margins between panels.

## Elevation & Depth

The system is flat. daisyUI depth and noise are off (`--depth: 0`, `--noise: 0`) in both themes.
Depth comes from tone: the result column and formula blocks sit on paper-sunk at reduced opacity,
and hover fills use paper-sunk. Focus is a 2px green outline offset 3px (Highlight in forced-colors
mode).

### Named Rules

**The Flat Ledger Rule.** No shadows on any surface. A region that must read as recessed takes a
paper-sunk tint and a rule border.

## Shapes

Every corner is square: `--radius-box`, `--radius-field` and `--radius-selector` are 0 in both
themes. Borders are 1px. The only heavier strokes are the 2px green underline on the current nav
cell and selected tab, the 2px marker on the price ruler, and the 4px moved segment. Icons are
inline SVG at 12 to 20px, stroked at 1.5.

### Named Rules

**The Square Rule.** Radius is 0 everywhere, including buttons, fields, the arrow node, and focus
outlines.

## Components

### Buttons

- **Shape:** square (0px), 44px minimum height.
- **Primary:** green fill with green-content text, label weight 600 (daisyUI default), used once per reading section as the route back
  to the calculator.
- **Ghost:** no fill, ink text, paper-sunk on hover. Reset in the tab row and secondary actions.
- **Focus:** 2px green outline, 3px offset.

### Inputs / Fields

- **Style:** daisyUI bordered input on paper, square, 44px minimum height, figure typography.
  Currency fields carry an inline `Rp` prefix in ink 65 percent inside the same border.
- **Focus:** the border color switches to green; the caret is green.
- **Error:** `aria-invalid` switches the border to loss red; the message sits under the field in
  caption size, red for errors and amber for tick warnings, followed by help text in ink 65 percent.
- **Selects:** daisyUI bordered select, same shape and height.

### Navigation

- **Top bar:** static, 56px, logo mark and wordmark left. Nav links are full-height cells divided by
  left rules, body-small in ink 65 percent, paper-sunk and full ink on hover. The current page keeps
  full ink and a 2px green bottom border. Cell padding narrows from 20px to 10px on phones.
- **Tabs:** the same cell treatment inside a 48px band, with a right rule and a 2px green bottom
  border on the selected tab. Arrow keys, Home and End move between tabs.
- **Breadcrumb:** a 48px ruled band, ink 65 percent links, a `/` separator at ink 40 percent.
- **Footer:** two-column grid from 640px, prose left, links right, a caption disclaimer below.

### Column Band

A 48px band with a bottom rule that opens each working column, heading left and an optional caption
annotation right. On the dividers between working columns, from 1024px, a 24px square arrow node
(paper fill, rule border, 12px chevron in ink 60 percent) sits centered on the rule at band height
to mark the flow left to right.

### Ledger

A definition list opened by a top rule. Each row is label left (ink 65 percent) and mono value right
on a baseline, 10px vertical padding, bottom rule. The total row drops the rule, takes 16px top
padding, a 500 label, and a 1.25rem green mono value. Gains and losses tint the value green or red.
Reading pages use a variant row that adds a caption-size mono working line under the label.

### Price Ruler (signature)

A horizontal scale drawn from the order price to the old average, with 11 ticks at ink 25 percent
(the two ends full height), a 1px baseline, the moved distance as a 4px green bar, and a 2px green
marker at the new average. The new-average label rides above the marker; the two end labels sit
below. The figures appear in text elsewhere, so the drawing is `aria-hidden`.

### Disclosure

A full-width `details` row, 64px minimum, title and caption left, a 16px plus icon right that
rotates 45 degrees over 200ms `cubic-bezier(0.22, 1, 0.36, 1)` when open; reduced motion removes the
rotation transition. Hover fills with paper-sunk at 60 percent.

### Link Cards

Related-reading links split the frame into ruled cells (two columns from 640px), band-size title
that underlines on hover, body-small description, 24px vertical padding, paper-sunk hover fill.

## Do's and Don'ts

### Do:

- **Do** set every number in Geist Mono with tabular digits, including figures inside prose.
- **Do** separate regions with 1px rule-colored borders that run to the frame rails.
- **Do** open working columns, tab rows, and breadcrumbs with a 48px ruled band.
- **Do** use the `1fr 2.3fr` heading rail for reading sections from 1024px.
- **Do** step gutters 16px, 24px, 32px at 0, 640px, and 1280px.
- **Do** express secondary text as ink at 75, 70, 65 or 60 percent opacity.
- **Do** keep controls at 44px minimum height and focus as a 2px green outline offset 3px.

### Don't:

- **Don't** round any corner; radius is 0 in both themes.
- **Don't** add box shadows; recess with a paper-sunk tint instead.
- **Don't** use green for borders, backgrounds, labels, or decoration outside the Green Path Rule.
- **Don't** set figures in proportional Geist or headings and text emphasis above weight 500.
- **Don't** float panels inside the frame with gaps or margins between them.
