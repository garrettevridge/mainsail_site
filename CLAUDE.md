# Mainsail Site — Coding Protocol

Binding rules for all code changes in this repository, whether
authored by a human or an AI assistant. This site's purpose is
neutral and objective presentation of Alaska fisheries data. Every
rule here serves that purpose.

## Neutral presentation — non-negotiable

- **Every chart reads the same way to every reader.** We do not
  select scales, time windows, or phrasing to favor any particular
  reading. When in doubt, pick the wider time window and let the
  reader see the trend.
- **No causation claims in Mainsail's voice.** When a topic has
  contested explanations in the scientific or policy literature, we
  describe the published range of views and cite the sources.
  Readers reach their own conclusions.
- **Axes start at zero** unless a clearly labeled reason requires
  otherwise. Time windows span the longest period for which
  comparable data exists; methodology changes within the window
  are annotated.
- **Adjectives must be anchored.** "High," "low," "significant,"
  "efficient," "wasteful" — none of these belong in chart captions
  or prose without a comparative anchor. If the data says 97%
  utilization, say "97%" — not "high utilization."
- **Country names use precise official designations.** Use the UN's
  short-name designation or the agency / treaty's official wording
  for every country reference in dataset values, page copy, table
  cells, briefings, and CHANGELOG entries. Casual short forms
  ("Korea", "Britain", "Holland") are editorial choices that don't
  belong in a neutral data engine. Specifically: "Republic of Korea"
  (not "Korea"); "Russian Federation" or "Russia" (not "USSR");
  "United Kingdom" (not "Britain" or "England"); "United States"
  preferred over "U.S." in dataset values, abbreviations OK in tight
  UI labels with a key. The rule applies to presentation; it does
  NOT apply to URL slugs, file names, or technical identifiers.
- **Real-dollar base year is pinned.** All monetary figures default
  to real (inflation-adjusted) dollars using a single site-wide base
  year, currently **2025**. The base year is pinned — not floating —
  so figures don't shift under the reader on every data refresh.
  Re-pin roughly every 5 years and log the change in CHANGELOG.
  Charts that show nominal values must label them as nominal in the
  axis title.
- **Bycatch context uses denominators the source publishes.** When
  contextualizing bycatch against stock size, use values agencies
  actually publish: counted escapement for Chinook/chum, coastwide
  spawning biomass for halibut. Do not reconstruct "total run size"
  or other modeled denominators — those are methodology decisions for
  the original agencies, not for Mainsail.

## Information architecture

The site's top-level structure and per-page table inventory live in
[`docs/INFORMATION_ARCHITECTURE.md`](docs/INFORMATION_ARCHITECTURE.md).
Update that doc when adding or restructuring top-level pages.

## Visual direction

- Reference is NYT quantitative section, slightly denser.
- Headers/titles/display copy use the **serif** family
  (Source Serif 4). Narrative body, table cells, chart
  axes/labels/legends use **sans-serif** (Inter). Number cells use
  monospaced tabular figures. All three are wired in
  `tailwind.config.js` / `src/index.css` — no new font imports needed.
- The landing page leads with a **horizontal row of section buttons**
  (Communities, Harvest, Markets, Management, Bycatch). Interior
  pages may keep the existing left sidebar.

## Data integrity

- **Read data exclusively from the S3 manifest.** No hardcoded
  dataset URLs, no fallback JSON embedded in the bundle, no
  inline values. The manifest is the contract.
- **Display the data-generated-at timestamp visibly.** Readers must
  be able to tell when the data was last published. The footer
  carries this from `manifest.generated_at`.
- **Flag preliminary values explicitly.** Rows with
  `is_preliminary=1` (or equivalent for other datasets) must
  render with a visible "preliminary" marker. Do not omit or soften
  the flag.
- **Do not compute numbers the source didn't.** If we want
  catch-and-release mortality applied to sport catch, that's a
  methodology decision to document in the story, not a silent
  transformation in a chart component.

## Component discipline

- **One chart type per component.** No generic "chart" component
  that does everything. Bar, stacked bar, line-with-band, pie —
  each its own file. Makes behavior and styling predictable.
- **Components accept typed data props, not dataset names.** The
  chart doesn't know about the manifest; the page fetches the
  dataset, shapes the data, and passes it in. Keeps charts
  reusable.
- **No inline styles.** Tailwind classes or the `@layer components`
  utilities in `index.css`. No `style={{}}` props.
- **No `any`.** If a type is genuinely unknown, use `unknown` and
  narrow with a type guard.

## Accessibility

- **Every chart has a visible title.** Screen-reader support comes
  from Recharts' built-in semantics; the title makes the chart
  readable to a sighted user who arrives mid-page.
- **Chart tooltips format numbers with units.** "47.2%" not "47.2",
  "11,855 fish" not "11855".
- **Color is never the only cue.** Any chart with colored categories
  must also have a legend with text labels.

## Routing and layout

- **One story per page.** Do not try to cram multiple stories into
  a single route. The scroll experience is the product, and short
  pages are easier to review in isolation.
- **Anchor links within a story are fine** for jumping between
  sections of a long page. No tabs, no collapsibles by default.
- **External links** (to agency publications, IPHC, NMFS, ADF&G)
  always open in a new tab with `target="_blank" rel="noreferrer"`.

## Build and deploy

- **Build must pass on every commit.** `npm run build` is the gate.
- **Do not commit `dist/`, `node_modules/`, or `.env`.**
- **The site must work against the production S3 manifest by default.**
  Anyone who clones the repo and runs `npm run dev` sees a working
  site against the live `mainsail-public-data` bucket. The fallback
  URL in `src/api/manifest.ts` makes this true without any env setup.
  No mock fixtures are committed; contributors who need staging data
  set `VITE_MANIFEST_URL` in a local `.env`.

## When the contract evolves

- If the S3 manifest schema changes (e.g., `v2/`), update
  `src/api/types.ts` and pin the manifest URL to the new version.
- If a dataset's row shape changes, update the type and the
  consuming pages in the same commit.
- Log substantive changes in this repo's CHANGELOG.md.
