# Changelog

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
