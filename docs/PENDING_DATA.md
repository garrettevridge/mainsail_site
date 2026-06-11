# Pending data — whitepaper figures awaiting upstream ingest

The Seamark whitepaper narrative references several figures and claims that
**cannot be built from the current S3 manifest** (`mainsail-public-data`, v1).
Per the project contract, the site reads data exclusively from the manifest —
no hardcoded values, no bundled fallbacks — so these items render as
clearly-labeled placeholders or carry an inline **"Pending data:"** flag until
the underlying tables are published upstream in `mainsail_data`.

This doc is the work-list to light them up.

| # | Whitepaper element | What it needs | Why current manifest can't serve it |
|---|---|---|---|
| 1 | **Hero / composition charts back to 1950** (Intro, Scale) | All-species statewide commercial landings, 1950–1984, by species group | `nmfs_commercial_landings` starts **1985**. `commercial_landings_pre1950` (1878–1949) is **salmon + herring only**. Hard 1950–1984 gap for all species. Ingest the older NMFS FOSS landings + a 1950–84 bridge. |
| 2 | **"What the bycatch is" composition** (Bycatch overview) | Federal discard tonnage by *species* (jellyfish, non-target groundfish, sharks, skates, …) | `monitored_catch` only carries target groundfish groups + halibut/sharks/skates — no jellyfish / full non-target breakdown. Needs the NMFS non-target catch ("Catch of Other Species") tables. |
| 3 | **Run-by-run Chinook attribution** (Chinook) | Multi-year BSAI Chinook genetic stock-of-origin × per-drainage run reconstructions | `chinook_gsi` is a **6-row, single-year** snapshot. No multi-year GSI series, and no join to Yukon/Kuskokwim run sizes. Translating bycatch → "fish that would have reached river X" is not yet possible without modeling we don't do here. |
| 4 | **Western AK marine-survival figure** (Fig 3.5, Western Alaska) | Return-per-spawner / marine-survival indices for AYK Chinook & chum, with Bering Sea temperature | Not gathered. Needs AFSC ESR / ADF&G survival-index ingest. |
| 5 | **Multi-year Chinook bycatch attributable to Western AK** (Chinook, secondary) | Per-year GSI × per-year BSAI bycatch | Same blocker as #3 — multi-year genetics not wired. |
| 6 | **Observer coverage time series** (Fig 5.1) | Coverage rates by fleet segment over time | `Observer` program coverage dataset not gathered. |
| 7 | **Climate panel** (Figs 6.1–6.3) | Bering Sea SST anomaly, cold-pool extent (km² < 2 °C), ESR indicator dashboard | Not gathered. Needs NOAA AFSC ESR / NCEI / AOOS ingest. |
| 8 | **Habitat / seafloor impact** (Fig 7.1) | Cumulative EFH impact by gear, BSAI & GOA | Not gathered. Needs NOAA EFH 5-Year Review ingest. Section also flagged **"Confirm: keep?"**. |

## What WAS buildable and is now live (this revision)

- **Fig 2.1** pollock biomass extended back to **1960** (was 1980); actual harvest
  now reconstructed from `monitored_catch` because `tac_specs.catch_mt` is empty.
- **Fig 2.2** new table — *BSAI biomass vs. annual take* for pollock, Pacific cod,
  sablefish (`stock_assessment_biomass` × `monitored_catch`).
- **Fig 3.7** new table — *halibut bycatch by gear/fleet* (`monitored_catch`,
  Pacific Halibut discards).
- Grounded, live-computed figures replacing prose `XX` placeholders: 2026 pollock
  TAC 35 % below ABC / 47 % below OFL; BSAI take ≈14 % of biomass; Chinook bycatch
  ≈8 % of all Chinook taken by people; chum BSAI ~260 k/yr avg; halibut non-directed
  bycatch ≈16 % of coastwide mortality; total federal discards ~150 M lb/yr.

## Editorial items still open (no data needed — your call)

- **03e · Other fisheries** and **07 · Habitat** carry "Confirm: keep?" tags.
- Headline scale figures (60 %+ US volume, 42 k jobs, 140+ communities) are cited
  to ASMI / McKinley in prose but are **not** manifest-sourced — confirm wording.
