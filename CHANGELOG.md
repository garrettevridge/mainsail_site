# Changelog

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
