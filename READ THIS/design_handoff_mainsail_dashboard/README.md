# Handoff: Mainsail Reference Dashboard

## Overview

A neutral, table-first reference dashboard for the Mainsail Alaska fisheries data pipeline. Seven topics: Fisheries Management, Biomass / TAC / ABC, Observer Coverage, Halibut Mortality by Source, Chinook Mortality & Genetics, Chum Salmon Mortality & Genetics, and Discards & Utilization.

Tone is academic, NYT-leaning. White ground, primary-color accents (red/blue/yellow), Source Serif 4 + Inter. Each topic page leads with a three-paragraph teaching narrative, then drops into tables, simple charts, and footnoted captions. The figures are sourced from `mainsail_data/docs/briefings/*.md` and the published NMFS / ADF&G / IPHC / NPFMC / AFSC literature.

## About the Design Files

The files in this bundle are **design references created in HTML** — a working prototype showing the intended look, structure, content, and behavior. They are not production code to copy directly.

Your task is to **recreate this dashboard inside Mainsail's target front-end environment** (e.g. Next.js, Remix, plain React, etc.) using its established patterns, data layer, and component library. If no front-end exists yet, choose the framework that best fits Mainsail's data-engine architecture — Next.js is the most likely fit given the static-publish flow described in `mainsail_data/README.md`.

Treat the HTML, CSS, and JSX in `Dashboard.html` + `assets/` as a precise visual and content spec. The data values currently embedded in `panels.js` are **placeholders sourced from the briefings** and should be replaced with live reads from the published Mainsail tables (`catch_weekly`, `iphc_*`, `psc_weekly`, `chinook_gsi`, `observer_discards`, etc.) once the front-end is wired to them.

## Fidelity

**High-fidelity.** Pixel-precise typography, spacing, color, table styling, and chart appearance. Implement these exactly using your codebase's component library — and if the codebase has none, build small primitives (Card, Table, StatGrid, Chart) that match the spec below.

## Architecture at a glance

```
Dashboard.html                   ← Static shell: nav, layout, CSS variables, script tags
assets/panels.js                 ← Topic content: 7 named build* functions, each builds a <section>
assets/tweaks-panel.jsx          ← Reusable Tweaks shell (provided starter component)
assets/tweaks-app.jsx            ← Project-specific Tweaks UI (palette, theme, type, layout)
```

In a real Next.js port, the equivalent layout is:

```
app/
  layout.tsx                     ← Shell: <Sidebar>, <main>, theme provider
  page.tsx                       ← Default redirect → /fisheries-management
  [topic]/page.tsx               ← One route per topic, `topic` ∈ {management, biomass, observer, halibut, chinook, chum, discards}
components/
  Sidebar.tsx                    ← Left nav with topic list + active highlight
  Card.tsx, Table.tsx, StatGrid.tsx, Note.tsx, ProportionBar.tsx, StackedBar.tsx, LineChart.tsx, FlowSteps.tsx, Pill.tsx, KV.tsx
  topics/                        ← One file per topic, holds the layout + content
    FisheriesManagement.tsx
    BiomassTacAbc.tsx
    ObserverCoverage.tsx
    HalibutMortality.tsx
    ChinookMortalityGenetics.tsx
    ChumMortalityGenetics.tsx
    DiscardsUtilization.tsx
lib/
  mainsail.ts                    ← Data-fetch helpers wrapping the published Mainsail JSON tables
styles/
  tokens.css                     ← Design tokens (replaces inline :root in Dashboard.html)
```

Each topic page is a thin composition of the primitive components plus prose. The data should come from `lib/mainsail.ts`, not be hard-coded.

## Pages / Topics

For each of the seven topics, the structure is:

1. Crumb (small uppercase: "Topic NN")
2. `h1` page title
3. **Lede block** — three serif paragraphs. The first is set in 20px serif (the `.first-sentence` style); the others in 16px serif. This is the "teaching" section.
4. Body — alternating `<h2>` section headers, intro `<p>` (15px serif), `Card` containers holding tables, charts, stat grids, or flow diagrams.
5. Footnote `<div class="note">` at the bottom — 13.5px serif, blue left border.

### 01 — Fisheries Management
- Lede: Alaska share of US seafood, three-body management model, OFL→TAC process.
- Body: "Jurisdiction at a glance" table (fishery × waters × managing body × authority), three side-by-side `Card`s describing NPFMC / ADF&G & BoF / IPHC, "How a federal catch limit gets set" 5-step flow.

### 02 — Biomass, TAC & ABC
- Lede: How catch limits are built (OFL → ABC → TAC → Catch).
- Body: BSAI exploitable biomass table by stock, BSAI pollock chart (OFL/ABC/TAC/Catch lines, 2014–2024), GOA halibut spawning biomass chart (1997–2024).

### 03 — Observer Coverage
- Lede: Why observer data matters; full vs partial coverage; the 2013 restructure.
- Body: Coverage rate chart by sector (multi-series line, 2007–2023, with 2013 vertical reference line), coverage tier table by sector × gear length.

### 04 — Halibut Mortality by Source
- Lede: IPHC as the single coastwide ledger; TCEY → FCEY logic.
- Body: 2024 proportion bar (7 categories), source-by-source table, bycatch decomposition table, 10-year stacked-bar mortality trend.

### 05 — Chinook Mortality & Genetics
- Lede: Four counting streams; GSI as a parallel question.
- Body: 2023 mortality proportion bar, source-by-source table, BSAI Chinook PSC chart (with hard cap and performance standard), GSI table by stock reporting group.

### 06 — Chum Salmon Mortality & Genetics
- Lede: Hatchery dominance, four counting streams, GSI baseline of 7 reporting groups.
- Body: 2023 mortality proportion bar, source table, BSAI chum PSC line chart, GSI attribution table.

### 07 — Discards & Utilization
- Lede: What "discard" means, regulatory vs economic, ~97% utilization.
- Body: 4-card stat grid, "what counts as a discard" definitions table, gear-by-gear discard rate table, composition-of-58kt-discards table.

---

## Design Tokens

All tokens live as CSS custom properties under `:root` in `Dashboard.html`. Port these into your `tokens.css` (or your tokens layer).

### Colors

```css
/* Surface — light theme (default) */
--bg:         #ffffff;
--panel:      #ffffff;
--ink:        #121212;
--ink-soft:   #333333;
--muted:      #666666;
--rule:       #dcdcdc;
--rule-soft:  #ececec;
--table-alt:  #fafafa;

/* Accents — primary colors */
--accent-blue:    #1a5fb4;   /* primary */
--accent-red:     #b4261a;   /* secondary; used for numeric emphasis */
--accent-yellow:  #c79a0c;   /* tertiary */

/* Mapped */
--accent:    var(--accent-blue);
--accent-2:  var(--accent-red);
--accent-3:  var(--accent-yellow);
```

**Color usage rules (important):**
- Red (`--accent-2`) is **only** for numbers and very small accent marks (active nav counter, `.stat-val.accent-2`, the `.pill.st` state-jurisdiction badge, chart series for OFL / hard-cap / performance-standard reference lines). **Never** for narrative prose.
- Blue (`--accent`) is the primary accent — used for the breadcrumb, hover state, `.tl-year` timeline year label, `.note` left border, and the primary line in the OFL/ABC/TAC chart (TAC line).
- Yellow (`--accent-3`) is used sparingly for the ABC line in the OFL/ABC/TAC chart, and the `.pill.int` international-jurisdiction badge.
- Body prose is `--ink` (headings) or `--ink-soft` (paragraphs).

### Alternate themes (optional, ship as toggle)

```css
/* Cream */
--bg: #f7f4ec; --panel: #fbfaf5; --rule: #d9d4c3; --rule-soft: #e9e4d4; --muted: #6a655a; --table-alt: #f1ede0;

/* Dark */
--bg: #151515; --panel: #1a1a1a; --ink: #f0ede6; --ink-soft: #c8c5bd; --muted: #8a8880; --rule: #2a2a2a; --rule-soft: #222; --table-alt: #1e1e1e;
```

### Typography

```css
--font-serif: 'Source Serif 4', Georgia, serif;
--font-sans:  'Inter', system-ui, -apple-system, sans-serif;
--font-mono:  'JetBrains Mono', ui-monospace, monospace;
--base-size:  14.5px;
```

Fonts loaded from Google Fonts in `Dashboard.html`:
```
Source Serif 4 (opsz 8..60, wght 400/500/600/700)
Inter (400/500/600/700)
JetBrains Mono (400/500)
```

### Type scale

| Element                       | Family | Size  | Weight | Line height | Notes |
|-------------------------------|--------|-------|--------|-------------|-------|
| `body`                        | Inter  | 14.5px | 400    | 1.6         | Default sans body |
| `.brand` (sidebar title)      | Serif  | 22px  | 600    | 1.15        | Letter-spacing −0.015em |
| `.brand-sub`                  | Inter  | 10.5px | 500    | —           | Uppercase, letter-spacing 0.14em |
| `.nav-section` label          | Inter  | 10px  | 600    | —           | Uppercase, letter-spacing 0.16em |
| `.nav-list li`                | Inter  | 13.5px | 400    | —           | Active: 600, color `--ink` |
| `.nav-list li .num`           | Mono   | 10.5px | 400    | —           | Color muted; active = `--accent-2` |
| `.crumb`                      | Inter  | 10.5px | 600    | —           | Uppercase, letter-spacing 0.16em |
| `h1.page-title`               | Serif  | 44px  | 600    | 1.05        | Letter-spacing −0.02em |
| `.page-lede.first-sentence`   | Serif  | 20px  | 400    | 1.4         | Color `--ink` |
| `.page-lede`                  | Serif  | 16px  | 400    | 1.55        | Color `--ink-soft`, max-width 780px |
| `h2.h2`                       | Serif  | 24px  | 600    | —           | Letter-spacing −0.01em; top border 1px `--rule`; padding-top 18px |
| `h3.h3`                       | Inter  | 11px  | 600    | —           | Uppercase, letter-spacing 0.14em, color `--muted` |
| `.section-intro`              | Serif  | 15px  | 400    | —           | Color `--ink-soft`, max-width 760px |
| `.card-title`                 | Serif  | 17px  | 600    | —           | Color `--ink` |
| `.card-sub`                   | Inter  | 12px  | 400    | —           | Color `--muted` |
| Table headers                 | Inter  | 10.5px | 700    | —           | Uppercase, letter-spacing 0.1em; bottom border 1.5px `--ink` |
| Table body cells              | Inter  | 13.5px | 400    | —           | 9px 12px 9px 0 padding |
| Table numeric cells           | Mono   | 12.5px | 400    | —           | `text-align: right`, `font-variant-numeric: tabular-nums` |
| Stat value (large)            | Serif  | 26px  | 600    | —           | Letter-spacing −0.01em |
| Stat label                    | Inter  | 10px  | 600    | —           | Uppercase, letter-spacing 0.12em, color `--muted` |
| Stat sub                      | Serif  | 12px  | 400    | —           | Color `--ink-soft` |
| `.note`                       | Serif  | 13.5px | 400    | 1.5         | Background `#fbfbfb`, left border 2px `--accent` |
| Pill                          | Inter  | 10px  | 600    | —           | Uppercase, letter-spacing 0.12em, padding 3px 8px, border 1px |

### Spacing & layout

- Shell: 260px sidebar + flex content, `min-height: 100vh`.
- Sidebar padding: `32px 26px 40px`. Background `#fafafa`, right border 1px `--rule`.
- Main padding: `48px 64px 96px`, `max-width: var(--col-max, 1060px)`.
- Card: `padding: 20px 22px`, border 1px `--rule`, border-radius **2px** (intentionally tight, not rounded), margin `14px 0`.
- `h2.h2` separator: 1px top border `--rule` + 18px padding-top + 40px margin-top.
- Stats grid: 4 columns, top border 1.5px `--ink`, bottom border 1px `--rule`, internal cells separated by 1px `--rule-soft`. Mobile: 2 columns.
- Flow steps: 5-column grid, no gap, each step 1px `--rule` border with `→` arrow placed at `right: -9px; top: 50%`. Arrow color `--accent`.
- Mobile breakpoint: `max-width: 900px` collapses sidebar above content and switches grids to single column.

### Borders, shadows

- No drop shadows. The aesthetic is flat printed-page.
- Border radii are mostly 2px or 0. Pills are 2px. Charts are unrounded. Drop-cap toggle exists in Tweaks but defaults off.
- Active nav state is weight + color, no underline or filled background.

---

## Components to build

### `<Sidebar topics={...} active={...} />`

- 260px fixed-width left rail, `position: sticky; top: 0`, `height: 100vh; overflow-y: auto`.
- Brand block: `Alaska Fisheries Reference Dashboard` (serif, 22px), with a 22px-wide × 2px-tall ink rule above it as a pseudo-element. Sub-line `MAINSAIL · DATA ENGINE V0.1` (uppercase, tracked).
- "TOPICS" section label.
- Topic list: each row = monospace 2-digit number (`01`, `02`, …) + topic title in sans 13.5px. Active row: ink text, weight 600, with the number in `--accent-2` (red).
- Footer: 11.5px serif, color muted, top border 1px `--rule`. Text: "Figures sourced from NMFS, ADF&G, IPHC, NPFMC and AFSC publications. Nothing on this page is an advocacy statement."

### `<Crumb />`

- "DASHBOARD / FISHERIES MANAGEMENT" — uppercase 10.5px Inter, letter-spaced 0.16em. Topic part in `--accent` blue. Separator `/` in `--rule` color.

### `<Card title? sub? children>`

- Container, see spacing above. Optional title/sub render as `.card-title` + `.card-sub`.

### `<Table columns={[{label, num?}]} rows={[[...]]} foot? caption?>`

- See type scale. Numeric columns right-aligned, mono, tabular-nums. Header bottom border 1.5px ink; row separators 1px `--rule-soft`. Hover row gets `--table-alt` background. Optional `<tfoot>` row with 1.5px top border ink, weight 600.
- Optional 11px muted caption below.

### `<StatGrid stats={[{val, label, sub, accent?}]} />`

- 4-up grid (2-up on mobile). See spacing. `accent` ∈ `'accent' | 'accent-2'` swaps the value color.

### `<FlowSteps steps={[{label, value, sub}]} />`

- 5-up no-gap grid. Each step: 12-14px padding, 1px border, label (10px uppercase muted), value (15px serif weight 600), sub (10.5px muted). Arrow `→` between steps, see spacing.

### `<KV pairs={[{dt, dd}]} />`

- 2-column grid: 170px label column (color muted) + value column. 13.5px Inter.

### `<Pill kind="fed"|"st"|"int">`

- Small uppercase tracked badge with thin border. `fed` → blue, `st` → red, `int` → yellow-brown (`#8a6a00` text on yellow border).

### `<Note>`

- Serif, 13.5px, color `--ink-soft`, line-height 1.5. Background `#fbfbfb`. Left border 2px `--accent` blue. Padding `10px 16px`. Margin `16px 0`. `<b>` inside is `--ink`.

### `<ProportionBar parts={[{label, value, color}]} height={42} />`

- Single horizontal bar (full-width SVG, default 42px tall) sliced into segments by value. If a segment is wide enough (>60px), render a white centered percentage label inside it.

### `<StackedBar categories={[...]} series={[{color, data: number[]}]} yFmt? />`

- Multi-series stacked vertical bars. X axis is the categories (years), y axis auto-scales to the stacked max with 4 ticks, labels in mono. Axis color `--ink`, gridline color `--rule-soft`.

### `<LineChart series={[{color, data: [[x,y],...]}]} xDomain yDomain xTicks yTicks annotations? />`

- SVG line chart, supports vertical annotation lines (drawn dashed in `--accent-2` with a small text label). Gridlines `--rule-soft`, axes `--ink`, tick labels mono `--muted`.

### `<Legend items={[{color, label}]} />`

- Small inline legend below charts: 10px square swatch + 11.5px Inter label.

---

## Interactions & Behavior

- **Topic navigation**: Clicking a sidebar row navigates to that topic. URL pattern `/{topic-slug}` or hash `#{topic-id}`. Page scrolls to top on change.
- **Active state**: Sidebar row updates immediately; crumb updates with topic title.
- **No animations** in current design (the original had a fade-in but it was removed for steadiness). Page transitions can be instant or a 100ms cross-fade.
- **No hover effects** beyond table rows getting a `--table-alt` background and nav rows changing color to `--accent`.
- **Tweaks panel** (optional in the production build): floating bottom-right panel with controls for theme (light/cream/dark), accent palette, serif/sans family, base size, drop-cap on/off, column width. See `assets/tweaks-app.jsx` for the current spec. In a production front-end you'd usually drop the Tweaks panel and pick one final configuration — keep it only if you want a built-in theme switcher for users.

---

## Data integration

The current `panels.js` embeds all values inline (sourced from `mainsail_data/docs/briefings/*.md`). For the production port, replace these with calls into a `lib/mainsail.ts` data layer that reads the published tables described in `mainsail_data/README.md` and `mainsail_data/docs/DATA_INVENTORY.md`:

| Topic page          | Mainsail tables to read                                                  |
|---------------------|--------------------------------------------------------------------------|
| Fisheries Mgmt      | Static content; no live data                                             |
| Biomass / TAC / ABC | `catch_weekly`, SAFE-derived biomass tables (Phase 2 in the inventory)  |
| Observer Coverage   | `observer_discards` (and the supporting AKR coverage report)             |
| Halibut Mortality   | `iphc_*` four tables; `monitored_catch` for cross-check                  |
| Chinook Mortality   | `psc_weekly`, `chinook_gsi`, `subsistence_harvest`, `sport_harvest`, `salmon_commercial_harvest` |
| Chum Mortality      | `psc_weekly` (chum strata), `salmon_commercial_harvest`, GSI (Phase 2)   |
| Discards            | `monitored_catch`, `discard_mortality_rates`                             |

Read the `mainsail_data/docs/briefings/0X_*.md` briefing for each table — they document units, lag, gotchas, and the unit conversions required (especially for halibut: net lb vs round lb).

---

## State management

- **Active topic** — keep in route (`/[topic]`) or hash. No client-side state needed beyond derived `useParams`.
- **Theme tweaks** (if shipped) — single object held in React context or zustand, applied as CSS custom properties on `<html>`. Persist to localStorage if user-facing.

---

## Assets

- Fonts: Google Fonts CDN (Source Serif 4, Inter, JetBrains Mono).
- No icons, no images, no logos. The brand is type-only (a small ink rule above the sidebar title).
- All charts and visuals are inline SVG generated from data. No chart library is required, but if you bring one (Recharts, Visx, Observable Plot), wire it to the same color tokens.

---

## Files in this bundle

- `Dashboard.html` — full working prototype, opens directly in any browser.
- `assets/panels.js` — vanilla JS, ~1000 lines, that builds all 7 topic sections with inline data and SVG charts. Read it as a content + data spec.
- `assets/tweaks-app.jsx` — Tweaks panel app (palette, theme, type, layout controls).
- `assets/tweaks-panel.jsx` — reusable Tweaks shell (host protocol + form controls). Skip both if you're not shipping a theme switcher.

The HTML/JSX in this bundle is the canonical reference for spacing, color, and type. The README is the canonical reference for component decomposition and data wiring.

## Open questions for the implementer

1. **Routing scheme** — file-based per topic, or single page with anchor scroll? Current prototype uses anchors.
2. **Theme switcher** — ship the Tweaks panel, or pick one configuration (recommend: light + primary palette, no panel) for users?
3. **GSI tables** — Mainsail's `chinook_gsi` table is documented but the chum equivalent is Phase 2. The chum page currently uses illustrative averages and notes this in the caption — confirm this is acceptable or block the chum genetics card behind a "coming soon" state.
4. **Sidebar collapse on mobile** — current prototype just stacks; consider a hamburger drawer for small screens.
