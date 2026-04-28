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
