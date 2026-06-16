# Changelog

## 2026-06-15 — Seamark: paginated brief deck (Chinook / Chum / Halibut / Observer)

Replaced the single scrollable data page with a paginated "brief deck" —
one comprehensive, mobile-friendly card per topic, arrow-navigated
(`src/seamark/Deck.tsx`). `App` now renders `Deck`.

- **Four built slides**, each on a shared template (long view → show the
  work → context → cited notes → methodology):
  - **Chinook** — bycatch long view; the removals denominator (every
    Chinook taken in AK) with multi-year context; full GSI origin
    breakdown; the Coastal-Western-Alaska-origin bycatch vs. river
    escapement as area-proportional squares.
  - **Chum** — bycatch long view; GSI origin (≈69% Asian hatchery, ≈11%
    Western Alaska / Yukon); Alaska-share vs. subsistence squares; a
    river-escapement squares block **wired to `salmon_escapement`
    (species=chum), rendering a placeholder until those rows ship** (see
    INGEST_SPECS P6); the Feb 2026 45,000 Western-Alaska-chum cap.
  - **Halibut** — bycatch (non-directed discard) long view; every-halibut-
    killed breakdown; bycatch by gear; bycatch vs. directed-fishery
    squares; discard mortality rates.
  - **Observer** — partial-fleet coverage by method over time against the
    ~100% full-coverage tier; the full/partial/zero trip landscape; the
    census-vs-sample note. Reads the new `observer_coverage` dataset.
- **Visual:** white background, black ink, neutral rules (`tokens.css`);
  large counts formatted compactly (`k`).
- **Perspective notes** (Seamark voice, cited to primary sources, not the
  comment that prompted them): the "reaching the river" reframing
  (≈2% Chinook / ≈1% chum of the western-Alaska return) and the
  pink-salmon / hatchery competition angle.
- **`docs/INGEST_SPECS.md`** added — backend data handoff; P6 chum
  escapement is the active blocker for the chum river graphic.

## 2026-06-11 — Whitepaper: hub-and-spoke (explorable) restructure

Moved the whitepaper off a single linear scroll into a hub-and-spoke
layout, so a lay reader gets a short complete read and the depth is
available on demand rather than forced into one long page.

- **Spine (landing `/`):** hero → Introduction → A short history →
  Conclusion → an "Explore the data" map of topic cards. A five-minute
  read on its own.
- **Spokes:** every detailed section is now a focused single-topic view
  at its own URL (`/chinook`, `/halibut`, `/federal-tac`, …), reached
  from a persistent grouped left-rail navigator (The fish · How the
  system works · Context). Each topic has back-to-overview and
  prev/next links.
- **Routing:** wired `react-router-dom` (BrowserRouter + nested routes);
  new `Shell`, `Spine`, `TopicView`, and a `topics.ts` registry that
  drives both the routes and the sidebar.
- **New sections:** `History` (drafted from the owner's outline, with
  unverified facts flagged for confirmation) and `StateManagement` (the
  State of Alaska process, the counterpart to the federal TAC spoke).
- Section markers de-numbered (each topic now stands alone); the
  appendix concept retired in favor of the Context group.

Note: deploying this needs SPA fallback (serve `index.html` for unknown
paths) on the static host. The Word-export pipeline now only captures
the current route and will need to walk all routes for a full-doc
export.

## 2026-06-08 — Whitepaper: data-first restructure (simplify for a lay reader)

Major restructure toward a simpler spine: **"this is what the best
available data say,"** with the opinion concentrated in a single signed
conclusion rather than threaded through every section. Targets the
median reader who wants to know more, not the expert.

- **New shape:** Opening (questions + method, no thesis) → four data
  movements (01 Scale · 02 Catch & bycatch · 03 Salmon [Chinook/Chum/
  Western Alaska grouped] · 04 Halibut) → **Conclusion** ("What we make
  of it" — the one signed section) → **Appendix** (harvest caps &
  biomass, observer coverage, climate, habitat, other fisheries).
- **Body neutralized:** stripped the threaded advocacy, the "trawl is
  not one word" framing, and the steelman openers; the body now presents
  data plainly. `docs/THEORY.md` rewritten to match (data-first,
  opinion-last; strictly-neutral body voice).
- **Call-out boxes:** new `SmCallout` component; observer-coverage box in
  the Catch & bycatch movement and a discard-mortality (DMR) box in the
  Halibut movement — mechanism explained in the narrative with the
  supporting facts/table nearby, per the brief.
- TOC and section markers renumbered; appendix demotion of the
  management-mechanics sections.

## 2026-06-04 — Whitepaper: thesis pivot to a signed perspective

The Seamark whitepaper moves from neutral exposition to a **stated
argument**, captured in `docs/THEORY.md` as the north star for all
section prose. Thesis: *the benefits of the Bering Sea pollock fishery
are worth its cost.* The rhetorical engine is the distinction the
debate refuses to make — **"trawl" is not one word** — anchored by the
data (pelagic pollock trawl discards 0.4% of catch by weight and is ~1%
of halibut bycatch, down ~91% since 2013; bottom trawl 8% and ~33%).

**Governance.** Added a "Two voices" carve-out at the top of
`CLAUDE.md`: the whitepaper (`src/seamark/**`) may argue a position and
make causation claims in Seamark's named voice; Mainsail's data-engine
surfaces stay neutral; and the **entire data layer of both** remains
bound by every data-integrity rule (zero axes, published denominators,
manifest-only sourcing, no silent computed transforms).

**Method.** Each contested-cost section is built *steelman → test*:
state the strongest, most empathetic version of the case against pollock
first, then bring the data and show where it holds and breaks (Chinook,
chum, Western Alaska). The A80 / bottom-trawl separation is handled
*subtly* — never a stated disavowal; the halibut by-fleet data simply
names the Amendment 80 sector as the largest groundfish source.

**New content.** Sport-fishery cost added to the ledger: charter/rec
halibut mortality (IPHC-published, ~20% of coastwide total — exceeds all
groundfish bycatch) and sport Chinook catch-and-release mortality
(released = catch − harvest from `sport_harvest`, × a 10% rate that is
flagged in-prose as an explicit methodology assumption, not a published
figure). Intro reframed around the cost/reward ledger; Closing lands the
verdict.

## 2026-06-02 — Whitepaper revision: editorial voice, new tables, chart cleanup

Substantial pass on the Seamark single-page whitepaper following an
editorial review of the exported narrative draft.

**Voice & structure.** Rewrote the narrative in Seamark's stated
first-person perspective: a heritage-forward Introduction (150+ years,
state "benefit to Alaskans" vs. federal "benefit to the nation"
mandates, frayed public discourse), higher-level framing of the
federal management process in §02 (survey → SSC → biomass → OFL → TAC →
harvest), a frustration-then-data framing for the bycatch section, and
an aspirational Closing on Alaskan leadership. Removed all
`sm-stat-row` callout boxes per editorial direction and wove the
figures into prose instead.

**New data components.** Added a reusable typed `SmTable` component and
two data tables: *BSAI biomass vs. annual take* (pollock, Pacific cod,
sablefish — `stock_assessment_biomass` × `monitored_catch`) and
*halibut bycatch by gear/fleet* (`monitored_catch` Pacific Halibut
discards). Extended the pollock biomass chart back to 1960 and
reconstructed actual harvest from catch accounting (`tac_specs.catch_mt`
is unpopulated). All prose `XX` placeholders replaced with live,
manifest-computed figures.

**Chart styling.** Redesigned the `SERIES` palette for legibility
(teal-led categorical scale; brand terracotta reserved for emphasis),
added paper-colored band separators on stacked area/bar charts, forced
sans-serif (Inter) on all Recharts axis/legend/tooltip text, and pinned
the composition chart to a clean 0–100 % y-domain.

**Pending data.** Items that require upstream ingest (all-species
landings back to 1950, discard species composition, multi-year Chinook
GSI × run reconstructions, marine-survival indices, observer-coverage,
climate, and EFH-habitat series) are flagged inline and catalogued in
`docs/PENDING_DATA.md`.

## 2026-05-12 — IA pivot: broaden site from deep stories to "economic 101" walkthrough

Documentation-only commit recording a planned restructuring of the
site. The site is being broadened from seven deep single-topic data
stories (Chinook, Chum, Halibut, Discards, Observer, Biomass,
Fisheries Management) into a layered overview aimed at a general
Alaskan audience that has little prior exposure to Alaska commercial
fisheries. Top-level structure becomes **Landing → Communities →
Harvest → Markets → Fisheries Management → Bycatch**, with the
existing deep pages retained as second-level / linked content.
Discards moves from a standalone page into a sub-section of Harvest.
This will be built **in this repo**, not in a separate Webflow
front-end (an earlier plan that has now been dropped).

New editorial rules added to `CLAUDE.md`: real-dollar base year is
pinned site-wide (initially 2025, re-pinned ~every 5 years and logged
in CHANGELOG) so figures don't shift under the reader on each data
refresh; bycatch context uses denominators the source agencies
actually publish (counted escapement for Chinook/chum, coastwide
spawning biomass for halibut) rather than reconstructed run-size
totals. Page-by-page table inventory, build order, and the list of
new datasets required from `mainsail_data` (NMFS commercial landings
with regional breakouts, NMFS first-wholesale value, NMFS "Fisheries
of the United States" port tables, CFEC vessel/permit registry, NMFS
processor count, NMFS Foreign Trade exports, FAO FishStat capture
production, CPI-U deflator) are in the new
`docs/INFORMATION_ARCHITECTURE.md`. No code changes in this commit;
the existing site continues to render unchanged.

---

## 2026-05-05 — Wire long-window Chinook mortality sources + chum GSI

Picks up four new datasets that the `mainsail_data` engine published on 2026-05-05 and threads them into the Chinook and Chum topic pages. **Chinook mortality stack** now sources Bycatch (PSC) from `psc_annual_historical` (NMFS BSAI+GOA chinook PSC mortality 1991-present, combining the AKRO 1991-2010 PDF and 2011+ HTML rollups) instead of `psc_weekly` — extends the prior 2013-only weekly coverage by 22 years; `psc_weekly` is retained as the source for the by-target-fishery and by-reporting-area sub-tables since the historical series doesn't carry sub-annual breakdown. Subsistence now sources from `subsistence_harvest_statewide` (NPAFC-sourced statewide chinook 1985-2023) instead of summing community-level rows from `subsistence_harvest` — extends back to 1985 and runs one year fresher (NPAFC has 2023 vs the dashboard's 2022). The 20-year window cap is removed; the chart and table now show the full available time series, currently 1985-2026 (42 years). Commercial bucket continues to read `salmon_commercial_harvest`, which will automatically extend back to 1985 once the engine's NPAFC commercial 1985-2018 backfill (committed in mainsail_data, awaiting next refresh-annual run) reaches S3 — no further site change needed. Methodology Note rewritten to document the four publication windows and the new partial-coverage rule. **Chum page** gains a "Genetic stock identification (GSI) — BSAI pollock chum bycatch attribution" section reading `chum_gsi`, mirroring the Chinook GSI table; renders the six reporting groups (NE Asia, SE Asia, W Alaska, Up/Mid Yukon, SW Alaska, E GOA/PNW) with mean attribution %, 95% CI in fish counts, point estimate, total catch, and sample size. v1 covers BSAI 2023 B-season aggregate only, sourced from the NPFMC C2 Chum Salmon Genetics Report (Barry et al., AFSC Auke Bay). New row types: `ChumGsiRow`, `PscAnnualHistoricalRow`, `SubsistenceHarvestStatewideRow`. Build clean.

---

## 2026-05-01 — Mortality-by-source charts on Chinook & Chum, Observer cleanup, GSI bug fix

Three sets of changes shipped together. (1) **Chinook and Chum each get a "mortality by source, last 20 years" stacked bar chart** with four buckets in fish counts: commercial directed (`salmon_commercial_harvest` statewide), bycatch (`psc_weekly` CHNK/CHUM, non-confidential), subsistence (`subsistence_harvest` chinook_harvest_fish / chum_harvest_fish summed across reporting communities), and sport kept (`sport_harvest` species_code KS/CS, record_type=harvest). PSC and commercial figures are treated as 100% mortality. Sport reflects kept fish only — release mortality is not included; ADF&G has site-specific hooking-mortality studies (e.g. Kenai River, Bendock & Alexandersdottir, FDS 91-39) but does not publish a single fleetwide rate. Subsistence reporting ends in 2022; later years render as a gap rather than a zero. The Halibut page already carries an equivalent IPHC stacked-bar chart in net-pounds (DMR-adjusted at source) and is not modified. (2) **Chinook gains an "annual mortality by source — with counted escapement" table** that adds a final column summing `salmon_escapement.actual_count` across all Chinook river systems present in the dataset for that year. The column is marked with a ‡ footnote stating that this is partial coverage — only systems with reported counts — and should be read as context, not a complete return total or a denominator. (3) **GSI bug fix**: `chinook_gsi.mean_pct` is published as a percentage value (e.g. 47.2 = 47.2%), but the page was passing it through a fraction-based formatter that re-multiplied by 100, producing values like 4720%. Added `fmtPctValue` helper that formats already-percentage inputs and replaced the call site at the GSI table. (4) **Observer page cleanup**: removed the two `MultiLineTrend` line charts ("Monitoring coverage by sector, 2013–YYYY" and "Coverage by FMP area"). The lines were misleading — coverage is best read as a current-year fleet table, and the underlying `Observed`/`Total` ratio occasionally exceeds 100% in small sectors when reported monitored tons round above the corresponding total estimate, which the line chart's hard 100% clamp obscured. Kept the by-sector, by-gear, and by-species-group tables and added a `<Note>` explaining how the ratio is computed and why values are clamped. New `subsistence_harvest` entries added to the Chinook and Chum `DataContext.use` blocks. Build clean.

---

## 2026-04-30 — Migrate hosting from GitHub Pages to AWS Amplify Hosting

The site moves off GitHub Pages and onto AWS Amplify Hosting. Amplify watches `main` and runs `amplify.yml` (added at repo root) on every push: `npm ci` → `npm run build` → publish `dist/`. The site is now served at the root path (`/`) instead of the `/mainsail_site/` subpath GitHub Pages required, which lets us remove the GH-Pages-specific scaffolding: `VITE_BASE` env reading and the `import.meta.env.BASE_URL` router basename are gone from `vite.config.ts` and `src/App.tsx`; `public/404.html` and the matching path-decode snippet in `index.html` (the spa-github-pages hack) are deleted, since Amplify Hosting handles SPA fallbacks via a console rewrite rule (`</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|webmanifest)$)([^.]+$)/>` → `/index.html` 200) instead of a static 404 with a query-string trick. `.github/workflows/deploy.yml` is removed — Amplify pulls from GitHub directly and replaces the GH Pages Actions deploy. README's Deploy section rewritten to document the one-time Amplify Console setup (connect repo, add the SPA rewrite rule, optional `VITE_MANIFEST_URL` env var, optional custom domain) and note the S3 CORS update needed on `mainsail-public-data` once the Amplify origin is live. Build clean (`tsc -b && vite build`); deep links and root redirect verified in dev preview.

---

## 2026-04-29 — Biomass page Phase 2: 5 Tier 1 stocks + country naming rule

Extends the Biomass page from one biomass chart (BSAI EBS pollock) to five — adds GOA pollock, BSAI EBS Pacific cod, GOA Pacific cod, and Alaska-wide sablefish. Replaces the single hand-coded chart block with a `STOCK_CHARTS` config array + a generic `stockTrends` join that maps each stock's biomass series to the matching `tac_specs` rows (via per-stock filter predicates that exclude state Guideline Harvest Levels). Each stock gets its own chart with the same visual contract (biomass + OFL + ABC + TAC, single y-axis in kt). The glossary block gains a "Total biomass" entry covering the per-stock age-cutoff heterogeneity (pollock age-3+; sablefish age-2+; GOA cod age-0+; BSAI cod 'total'). Type updates in `api/types.ts`: `StockAssessmentBiomassRow` gains `total_biomass_kt`, `biomass_age_cutoff`, `recruit_millions`, `recruit_age` to match the engine schema additions; `age_3plus_biomass_kt` retained as backward-compat alias. Country naming rule added to `CLAUDE.md`: every country reference in dataset values, page copy, table cells must use the precise official short-name designation (Republic of Korea, Russian Federation, United Kingdom) rather than casual short forms; existing NPAFC parties row on the Fisheries Management page corrected from "U.S., Canada, Japan, Russia, Korea" to "Canada, Japan, Republic of Korea, Russian Federation, United States". Build clean.

---

## 2026-04-29 — Biomass page: bug fixes + age-3+ pollock biomass series

The "Biomass, TAC & ABC" page now actually shows biomass. Five behaviour-affecting changes shipped together. (1) The BSAI/GOA TAC-by-species aggregator no longer double-counts species like Atka mackerel and Pacific ocean perch that are stored at two granularities in `tac_specs` (rollup row + per-subarea rows); the new `aggregateByComplex` helper picks the rollup when present and falls back to summing subareas otherwise. The previously-rendered "Total BSAI TAC (2026)" of 2,124,172 mt was 6% inflated; the corrected value is 2,004,593 mt. (2) The "% of optimum yield" stat now references the BSAI FMP's actual 1.4–2.0 Mt range and explicitly excludes state Guideline Harvest Levels (rows flagged `state_ghl`) from the federal-OY denominator. (3) Catch-vs-TAC tables now end at the most recent year that has any non-null catch in the dataset rather than rendering 2026 with implied zero catch four months into the fishing year; an explanatory `<Note>` renders in place of the tables when no current-year catch exists. (4) ABC sub-text now describes the SSC's role under the Tier 1–6 control rule rather than the simplistic "step-down from OFL for assessment uncertainty." (5) New glossary block at the top of the page defines OFL, ABC, TAC, Tier, and age-3+ biomass for non-specialist readers. The pollock trend chart adds a fourth line — age-3+ biomass from the new `stock_assessment_biomass` dataset (1964–2024 from the 2024 EBS Pollock SAFE Table 26) — extending the chart's time window back to the start of the assessment so readers see the full historical biomass context. New `StockAssessmentBiomassRow` type in `api/types.ts`. Build clean (`tsc --noEmit` and `vite build` both pass).

## 2026-04-29 — SPA deep-link support on GitHub Pages

Added a `public/404.html` fallback and a small history-rewrite snippet
in `index.html` so direct navigation to deep links such as
`/mainsail_site/topics/halibut` resolves correctly. Previously the
SPA only worked from the root because GitHub Pages serves static files
and 404s on any path that doesn't exist on disk; the new fallback
captures the path, redirects to `/mainsail_site/?/<path>`, and the
snippet rewrites history before React mounts. URLs stay clean and the
in-app `NotFound` route now handles unknown deep links instead of
GitHub's stock 404. Technique:
https://github.com/rafgraph/spa-github-pages.
