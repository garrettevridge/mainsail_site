# Ingest specs — data needed to fill the Seamark data page

Handoff to the `mainsail_data` engine. Each spec below defines a new dataset (or
an extension of an existing one) needed to replace a placeholder on the live
data page. Conventions follow the existing manifest: one JSON array per dataset,
snake_case fields, and `source_id` / `source_url` / `provenance` /
`is_preliminary` / `ingested_at` carried on every row. Grain = "one row per …".

Priority order is by site impact. **P1 (observer coverage)** is the single
biggest gap — it is referenced in three places on the page and has no dataset at
all today.

---

## Already in the manifest — do NOT re-ingest

These are covered; the specs below deliberately avoid duplicating them.

- **Halibut removals are complete.** `iphc_mortality_by_source` (directed
  commercial, recreational, non-directed bycatch, directed discard, subsistence,
  coastwide, 1888→), `iphc_mortality_by_area` (areas 2A–4), `ifq_landings`
  (directed commercial by area), `monitored_catch` (halibut bycatch by
  gear/sector), and halibut in `subsistence_harvest`. The *only* halibut gap
  worth considering is a recreational **guided-vs-unguided × area** cross
  (ADF&G SWHS / NOAA charter logbook) — optional, low impact.
- **Chinook escapement** — `salmon_escapement` (by region/river) +
  `chinook_drainage_totals`.
- **Salmon bycatch counts** — `psc_annual_historical` (Chinook & chum, BSAI/GOA,
  1991→). Only the *genetic origin* of that bycatch needs work (P2).
- **Subsistence** — `subsistence_harvest` (by community/gear, incl. halibut).
- **Sport catch & harvest** — `sport_harvest` (Chinook, halibut; catch and kept).
- **Biomass / TAC / OFL / ABC** — `stock_assessment_biomass`, `tac_specs`.
- **DMRs** — `discard_mortality_rates`.

---

## P1 — `observer_coverage`

**Powers:** Section 4 (Observer coverage) — currently a placeholder. Also the
"how the numbers are collected" context for every federal figure.

**Grain:** one row per `year` × `fleet_segment` × `coverage_category`.

**Source:** NOAA Fisheries Alaska — **Fisheries Monitoring & Analysis (FMA) /
North Pacific Observer Program**: the *Annual Report* and the *Annual Deployment
Plan* (coverage/selection rates by stratum), plus AKFIN observer summaries.
- https://www.fisheries.noaa.gov/alaska/fisheries-observers/north-pacific-observer-program
- Annual Report PDFs (coverage-rate tables) — one per year, ~2013 → present.

**Coverage:** 2013 → present at minimum (post-restructuring). Earlier full-coverage
history (pre-2013) is a bonus if available.

| field | type | notes |
|---|---|---|
| `year` | integer | |
| `fmp_area` | string | "BSAI" / "GOA" / "Statewide" |
| `fleet_segment` | string | e.g. "BSAI pollock CP", "BSAI pollock CV", "GOA pollock", "Shoreside/Plant", "Fixed-gear partial", "Trawl partial" |
| `coverage_category` | string | "Full coverage" / "Partial coverage" / "Electronic monitoring (EM)" / "Zero" |
| `monitoring_method` | string | "Observer" / "EM" / "Shoreside observer" |
| `coverage_rate_pct` | number \| null | observed/selected share of trips or hauls (0–100) |
| `trips_total` | integer \| null | denominator if published |
| `trips_observed` | integer \| null | numerator if published |
| `observer_days` | number \| null | optional |
| `is_preliminary` | integer | 0/1 |
| `source_url` | string | the specific annual report |

**Notes:** Keep "full" vs "partial" vs "EM" distinct — that distinction is the
whole point of the chart. Shoreside plant coverage (observers per offload) is its
own segment. Flag confidential strata rather than dropping them.

---

## P2 — `salmon_bycatch_gsi`  (replaces single-year `chinook_gsi` / `chum_gsi`)

**Powers:** Section 1 (Chinook & chum stock-of-origin charts) — today these are a
single 2023 snapshot. Needed as a **2011 → present** time series, and to compute
stock-specific bycatch numbers (GSI × annual bycatch).

**Grain:** one row per `year` × `species` × `fmp_area` × `season` ×
`reporting_group`.

**Source:** **NPFMC salmon bycatch genetics reports** prepared by NOAA AFSC Auke
Bay Lab (annual genetic stock-composition analyses of the Chinook and chum
bycatch samples), presented to the Council each year.
- Chinook: AFSC genetic stock composition of BSAI/GOA Chinook bycatch (2011 →).
- Chum: AFSC chum salmon bycatch genetic composition, by A/B season (2011 →).
- NPFMC meeting records ("Salmon Bycatch") hold the annual report PDFs/tables.

**Coverage:** 2011 → present (onset of routine genetic sampling).

| field | type | notes |
|---|---|---|
| `year` | integer | sample year |
| `species` | string | "chinook" / "chum" |
| `fmp_area` | string | "BSAI" / "GOA" |
| `season` | string \| null | "A" / "B" / "Annual" (chum splits by season) |
| `reporting_group` | string | genetic reporting group, e.g. "Coastal Western Alaska", "North Alaska Peninsula", "British Columbia", "West Coast US", "NE Asia", "SE Asia", "E GOA/PNW", "Up/Mid Yukon" |
| `mean_pct` | number | stock-composition mean (0–100) |
| `ci_lower` | number \| null | 90/95% CI |
| `ci_upper` | number \| null | |
| `n_samples` | integer \| null | genotyped fish |
| `total_bycatch_n` | integer \| null | the year's bycatch the composition applies to, if reported |
| `source_report_year` | integer | which annual report this came from |
| `source_url` | string | |

**Notes:** Reporting groups differ between species and have changed over time —
preserve the report's group labels verbatim; do not re-bin. Carrying
`total_bycatch_n` lets the site compute "fish attributable to region X" directly.

---

## P3 — `groundfish_nontarget_catch`

**Powers:** Section 1, the "What the bycatch is made of, by species" composition
chart — currently a placeholder. `monitored_catch` only has *managed groundfish*;
this adds the non-target species (jellyfish, forage fish, invertebrates) that
dominate discard weight.

**Grain:** one row per `year` × `fmp_area` × `gear` × `species_group` ×
`disposition`.

**Source:** **NOAA AKR Catch Accounting System — Nontarget / "Other species"
catch estimates** (the CAS nontarget tables; AKFIN). Also the BSAI/GOA SAFE
"Ecosystem / Nontarget Species" chapters.
- AKFIN Answers "Catch" reports with nontarget species detail.

**Coverage:** 2003 → present (CAS era) or as far back as published.

| field | type | notes |
|---|---|---|
| `year` | integer | |
| `fmp_area` | string | "BSAI" / "GOA" |
| `gear` | string | match `monitored_catch` gear labels |
| `sector` | string \| null | match `monitored_catch` sectors where available |
| `species_group` | string | non-target groups: "Jellyfish", "Pacific herring", "Smelts/Eulachon", "Grenadier", "Sea stars", "Sponges", "Corals", "Benthic invertebrates", etc. |
| `disposition` | string | "Retained" / "Discarded" |
| `metric_tons` | number | |
| `source_url` | string | |

**Notes:** Keep this **separate** from `monitored_catch` (different accounting
domain) so the site doesn't double-count. Jellyfish are typically the single
largest non-target category by weight — the whole reason for this dataset.

---

## P4 — `salmon_commercial_harvest_detail`  (extends statewide-only `salmon_commercial_harvest`)

**Powers:** Section 2 (Chinook removals) — the current dataset is **statewide
only**; the page needs commercial salmon by **region and gear** (and target
species) for the full removals picture.

**Grain:** one row per `year` × `management_area` × `gear` × `species`.

**Source:** **ADF&G** fish tickets / Commercial Operators Annual Report (COAR);
ADF&G Division of Commercial Fisheries area annual management reports (harvest by
area and gear).

**Coverage:** 1985 → present (or 1975 → from CFEC).

| field | type | notes |
|---|---|---|
| `year` | integer | |
| `region` | string | e.g. "Bristol Bay", "AYK", "Area M / South Peninsula", "Southeast", "PWS", "Kodiak", "Cook Inlet" |
| `management_area` | string \| null | finer ADF&G area code/name |
| `gear` | string | "Drift gillnet" / "Set gillnet" / "Purse seine" / "Hand troll" / "Power troll" |
| `species` | string | chinook/chum/coho/pink/sockeye |
| `harvest_fish` | number | |
| `harvest_lbs` | number \| null | |
| `exvessel_value_usd` | number \| null | nominal |
| `is_preliminary` | integer | 0/1 |
| `source_url` | string | |

**Companion (small):** `area_m_gsi` — ADF&G Gene Conservation Lab stock-of-origin
for the Area M (South Alaska Peninsula / False Pass) chum & sockeye fisheries:
`year`, `species`, `reporting_group`, `mean_pct`, `n_samples`, `source_url`.

---

## P5 — `discard_detail`  (extends `monitored_catch` with reason + donations)

**Powers:** Section 3 (Discards) — adds the **regulatory discard status**,
**utilization**, and **donations** context from your list (item C).

**Grain:** one row per `year` × `fmp_area` × `gear` × `sector` × `species_group`
× `discard_reason`.

**Source:** NOAA AKR Catch Accounting (discard with regulatory status:
prohibited-species / regulatory / economic discard) and the **Prohibited Species
Donation (PSD)** program reports.

| field | type | notes |
|---|---|---|
| `year` | integer | |
| `fmp_area` / `gear` / `sector` / `species_group` | string | match `monitored_catch` |
| `discard_reason` | string | "Prohibited species" / "Regulatory" / "Economic" |
| `metric_tons` | number | |
| `donated_lbs` | number \| null | PSD program (salmon/halibut donations) |
| `source_url` | string | |

**Notes:** Utilization (retained ÷ total) is already computable from
`monitored_catch`; this dataset adds the *why* of the discard and the donation
offset.

---

## Optional / lower priority

- **`marine_survival`** — return-per-spawner / marine-survival indices for AYK
  Chinook & chum, plus Bering Sea SST anomaly and cold-pool extent (NOAA AFSC ESR
  / NCEI). Powers the Western Alaska "marine survival" placeholder. Not in the
  core data list, but the placeholder exists.
---

## P6 — chum escapement (extend `salmon_escapement` to `species = "chum"`)

**Powers:** the Chum slide's "Western Alaska share, against those rivers" graphic
— the direct chum analog of the Chinook bycatch-vs-escapement squares, which the
Chinook slide already gets from `chinook_drainage_totals` + `salmon_escapement`.
Today `salmon_escapement` is chinook + sockeye only, so the chum slide can only
compare against subsistence harvest. **Same row shape as `salmon_escapement` —
just add chum rows; no new dataset needed.**

**Grain:** one row per `system_name` × `year` (species = "chum"), matching the
existing `SalmonEscapementRow`.

**Source:** ADF&G AYK (Yukon & Kuskokwim area season summaries / escapement
databases), USFWS weirs, and the ADF&G escapement-goal reports.

**Systems that are "in the conversation"** (struggling, news-relevant — these are
what the graphic needs):

| system_name | run | goal_type / goal | recent counts |
|---|---|---|---|
| Yukon summer chum (Pilot Station) | summer | drainagewide 500,000–1,200,000 | met lower end 2024 |
| Yukon fall chum (Pilot Station)   | fall   | drainagewide ≈ 300,000 (+ Canada treaty floor) | ≈124k in 2024, below goal |
| Kuskokwim chum (Kogrukluk weir)   | —      | weir BEG | ~81% below 2000–2019 avg (2020–22) |
| Kuskokwim chum (George River weir)| —      | weir BEG | ~69% below 2000–2019 avg (2020–22) |
| Norton Sound chum (e.g. Kwiniuk/Niukluk) | — | district goals | depressed |

Carry the existing `goal_lower` / `goal_upper` / `goal_type` / `goal_met`
fields. Add a `run` qualifier (`"summer"` / `"fall"` / `null`) if the
`system_name` doesn't already encode it, since Yukon chum splits into two runs
with separate goals. Once these rows land, the chum slide's river graphic wires
up with a one-line filter (`species === "chum"`) — no component rewrite.

---

## Optional / lower priority

- **`marine_survival`** — return-per-spawner / marine-survival indices for AYK
  Chinook & chum, plus Bering Sea SST anomaly and cold-pool extent (NOAA AFSC ESR
  / NCEI). Powers the Western Alaska "marine survival" placeholder. Not in the
  core data list, but the placeholder exists.

---

## Manifest / handoff checklist

For each new dataset, the engine should publish (matching existing datasets):
`v1/<name>.json`, `v1/<name>.parquet`, `v1/<name>.schema.json`, and a manifest
entry with `row_count` + checksums. Site wiring is then a small typed change in
`src/api/types.ts` + the consuming section component.
