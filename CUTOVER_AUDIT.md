# Mock → Production S3 Cutover Audit

**Audit date:** 2026-04-25
**Auditor:** Claude
**Scope:** every `useDataset()` call in routed code, cross-referenced
against `mainsail_data/backend/app/publish/s3_publisher.py` →
`PUBLISHED_DATASETS` and the Row interfaces in `src/api/types.ts`.

## TL;DR — much better news than feared

The **live, routed topic pages already use production dataset names.**
All 16 unique datasets fetched by topic pages are in PUBLISHED_DATASETS.
There is no rename pass needed inside the topic code.

What remains:

1. **Dead code: 5 `Story*.tsx` pages in `src/pages/`** are unrouted leftovers from an earlier prototype. They reference mock-only names (`psc_chinook_cumulative`, `chinook_mortality_summary`, etc.) that don't exist in production. **Delete them.** Two pre-shaped Row interfaces in `types.ts` exist only to support these dead pages — delete those too.
2. **Mock manifest is internally inconsistent** with the routed pages — it serves dataset names neither the topic pages fetch nor the production pipeline publishes. **Either regenerate against real S3 or delete; do not maintain.** Once `VITE_MANIFEST_URL` points at S3, mocks aren't needed for prod build. Local dev can keep them only if they're useful.
3. **Field-shape risk** — names match, but the topic pages have not been exercised against real S3 data yet. The `*DataRow` interfaces in `types.ts` were authored to match the production schema, but no end-to-end test confirms they do. First S3 publish + first dev run against it will surface any drift.

---

## Routed topic pages → production datasets

| Topic page | useDataset() calls | All present in PUBLISHED_DATASETS? |
|---|---|---|
| `topics/FisheriesManagement.tsx` | `salmon_commercial_harvest`, `salmon_escapement`, `escapement_goals_history` | ✅ |
| `topics/Biomass.tsx` | `tac_specs` | ✅ |
| `topics/Observer.tsx` | `monitored_catch` | ✅ |
| `topics/Halibut.tsx` | `iphc_mortality_by_source`, `iphc_spawning_biomass`, `iphc_tcey`, `ifq_landings`, `iphc_mortality_by_area`, `monitored_catch`, `discard_mortality_rates`, `sport_harvest` | ✅ |
| `topics/Chinook.tsx` | `psc_weekly`, `chinook_gsi`, `salmon_commercial_harvest`, `sport_harvest`, `salmon_escapement`, `fish_counts` | ✅ |
| `topics/Chum.tsx` | `salmon_commercial_harvest`, `hatchery_releases`, `sport_harvest`, `salmon_escapement`, `psc_weekly` | ✅ |
| `topics/Discards.tsx` | `monitored_catch`, `discard_mortality_rates` | ✅ |

**16 unique production datasets needed; all 16 publish.**

---

## Dead code to delete

The router (`src/App.tsx`) only mounts `topics/*.tsx`. These files are
unreachable but reference mock-only dataset names:

| File | Mock dataset(s) referenced | Action |
|---|---|---|
| `src/pages/StoryChinook.tsx` | chinook_mortality_summary, salmon_escapement_ayk_chinook, chinook_gsi, subsistence_chinook_by_region, sport_chinook_by_area | delete |
| `src/pages/StoryDiscards.tsx` | discard_utilization | delete |
| `src/pages/StoryHalibut.tsx` | halibut_mortality_by_source, iphc_spawning_biomass | delete |
| `src/pages/StoryObserver.tsx` | observer_coverage | delete |
| `src/pages/StorySeason.tsx` | psc_chinook_cumulative, catch_vs_tac_current, fish_counts_kenai_late_chinook | delete |
| `src/pages/Home.tsx` | (check before deleting — may be referenced even if not routed) | inspect |

**Type interfaces** in `src/api/types.ts` only used by the dead pages:

- `SalmonCommercialHarvestRow` (pre-shaped; the routed code uses `SalmonCommercialHarvestDataRow`)
- `SalmonEscapementRow` (pre-shaped variant; verify which is used)
- `PscWeeklyRow` (replaced by `PscWeeklyDataRow`)
- `MonitoredCatchRow` with `metric_tons` field (verify against real `monitored_catch` schema)
- `SubsistenceHarvestRow` (replaced by `SubsistenceHarvestDataRow`)
- `SportHarvestRow` (replaced by `SportHarvestDataRow`)

The "S3-native" comment block at line 139 of `types.ts` is the
authoritative set going forward. Anything above that line should be
audited and deleted if no routed page uses it.

---

## Mock data files that don't correspond to any real dataset

Files in `public/mock-data/` that have no production counterpart:

- `chinook_mortality_summary.json` — derived view, not published as a dataset
- `salmon_escapement_ayk_chinook.json` — pre-filtered subset of `salmon_escapement`
- `subsistence_chinook_by_region.json` — pre-filtered subset of `subsistence_harvest`
- `sport_chinook_by_area.json` — pre-filtered subset of `sport_harvest`
- `psc_chinook_cumulative.json` — pre-aggregated subset of `psc_weekly`
- `catch_vs_tac_current.json` — derived view of `catch_weekly` × `tac_specs`
- `fish_counts_kenai_late_chinook.json` — pre-filtered subset of `fish_counts`
- `discard_utilization.json` — derived view, not a dataset
- `halibut_mortality_by_source.json` — name matches a real dataset BUT shape is from earlier prototype; verify schema alignment
- `observer_coverage.json` — pre-aggregated; real dataset is `monitored_catch` with disposition column

These align 1:1 with the dead `Story*` pages above. Once those pages
are deleted, these mock files are also unused.

**Mock files that should be regenerated to match production shape** if mocks are kept for local dev:

- `salmon_commercial_harvest.json` (used by routed Chum + FisheriesManagement)
- `chinook_gsi.json` (used by routed Chinook)
- `iphc_spawning_biomass.json` (used by routed Halibut)

Or: drop mock fixtures entirely after S3 cutover, and let local dev
fetch from real S3. The mocks were valuable during prototyping; they
add maintenance burden once real S3 is live.

---

## Production datasets the site does NOT yet use

These exist in PUBLISHED_DATASETS but no topic page fetches them:

| Dataset | Plausible home | Priority |
|---|---|---|
| `subsistence_harvest` | Chinook, Chum, Halibut topics — currently mentioned in body copy but never fetched | **medium** — body copy is making claims with no data backing |
| `foss_trade` | Future Seafood 101 / economics topic | low — paid-site material |
| `alaska_export_share` | Future economics topic | low — paid-site material |
| `cfec_earnings` | Future economics topic | low — paid-site material |
| `aspr_prices` | Future economics topic | low — paid-site material |
| `coar_buying`, `coar_production`, `coar_production_detail`, `coar_production_by_area`, `coar_production_by_permit_type` | Future Seafood 101 | low — paid-site material |
| `crab_landings` | Future Crab topic? | low |
| `production_cumulative` | Discards expansion | low |
| `salmon_run_forecasts` | Could enhance Chinook + Chum | medium |
| `rec_halibut_harvest` | Halibut topic — currently 0 rows, blocked | n/a — backend blocker |

---

## Datasets stories.yaml expects that DON'T publish

These are the ones I previously framed as "site expects but backend doesn't publish." Re-checking against actual fetches in routed code:

| Dataset | In stories.yaml? | Fetched in routed code? | Verdict |
|---|---|---|---|
| `safe_biomass` | yes (pending) | **no** | not a cutover blocker |
| `salmon_landings_historical` | yes | **no** | not a cutover blocker |
| `chinook_cas_historical` | yes (pending) | **no** | not a cutover blocker |
| `nmfs_adp` | yes (pending) | **no** | not a cutover blocker |
| `observer_discards` | yes | **no** | not a cutover blocker (site uses `monitored_catch`) |

Earlier framing was overstated. **These are aspirational, not site-blocking.** The site already gracefully omits them.

---

## Cutover checklist (for whoever does this work)

In order:

1. ☐ Delete `src/pages/Story*.tsx` (5 files). Confirm no imports from elsewhere first.
2. ☐ Inspect `src/pages/Home.tsx` — is it routed (it isn't in current App.tsx) and does it reference any mock-only datasets?
3. ☐ Delete unused Row interfaces in `src/api/types.ts` (the pre-S3-native ones).
4. ☐ Run `tsc -b` to confirm no broken imports.
5. ☐ Decide on mock data policy: regenerate to match production shape, or delete and rely on real S3 in local dev.
6. ☐ Once `mainsail_data` GH Secrets are placed and first publish succeeds: set `VITE_MANIFEST_URL` in `mainsail_site` GitHub Actions to the live S3 URL.
7. ☐ Push to `main` to trigger deploy; visit each topic page; verify no console errors and charts render with real data.
8. ☐ Field-level shape verification: for each `*DataRow` interface, confirm the actual S3 JSON has every field at the expected type. Most likely failure mode: a field that's `string | null` in production but typed as `string` here, or vice versa.
9. ☐ File backend issues for any field mismatches found in step 8.
10. ☐ Add `subsistence_harvest` fetch to Chinook + Chum + Halibut topic pages where body copy makes claims without data backing.

**Estimated effort:** half a day for steps 1–5, then steps 6–8 are blocked on the backend's first publish.

---

## Update — 2026-04-25 follow-up commit

After this audit was written, I verified each suspected bug against the
actual published JSON in `mainsail_data/backend/_publish/*.json` rather
than relying on the dataset YAMLs (which turned out to be wrong in one
case). Outcome:

- **BUG 1 (psc_type missing) — confirmed and fixed.** Added `psc_type`
  to `PscWeeklyDataRow` and made `species_code` nullable to match the
  published shape. Note: the canonical store currently only contains
  `psc_type='salmon'` rows — halibut and crab streams haven't been
  ingested yet, but the discriminator field still publishes.
- **BUG 2 (MonitoredCatchRow case mismatch) — RETRACTED.** The actual
  published JSON uses capitalized `"Retained"`, `"Discarded"`,
  `"Monitored"`, `"Observed"`, `"Total"` — i.e., types.ts is correct
  and the **mainsail_data YAML doc is wrong.** This is a backend-side
  YAML fix, not a site-side bug. Filed as a follow-up task for
  mainsail_data.
- **BUG 3 (count_method filter) — confirmed and fixed.** Added
  `filterCountableEscapement()` helper in `src/api/datasetHelpers.ts`
  and applied it in `Chinook.tsx`, `Chum.tsx`, and
  `FisheriesManagement.tsx`. Backend confirms 36 of 810 escapement
  rows (~4.4%) carry `not_operated_*` or `partial_season_*` count
  methods that should not be aggregated against goals.

**Other follow-up cleanup landed in the same commit:**
- Deleted 5 dead `Story*.tsx` pages + `Home.tsx` (all unrouted, all
  used mock-only dataset names).
- Pruned 8 unused pre-S3 Row interfaces from `src/api/types.ts`
  (`SalmonCommercialHarvestRow`, `PscWeeklyRow`, `SubsistenceHarvestRow`,
  `SportHarvestRow`, `IphcMortalityBySourceRow`, `IphcTceyRow`,
  duplicate-shape definitions).
- `tsc -b` clean.

Cutover is now blocked only on (a) GH Secrets in `mainsail_data`
unblocking the first S3 publish and (b) `VITE_MANIFEST_URL` being set
in this repo's GitHub Actions Variables.

---

## Field-shape spot-check findings (deep audit, 3 highest-risk datasets)

Ran a column-by-column comparison between `src/api/types.ts` interfaces
and the authoritative dataset YAMLs in
`mainsail_data/backend/reference/semantic/datasets/`. Three real bugs
surfaced — these will produce silent wrong rendering after S3 cutover
unless fixed.

### 🔴 BUG 1 — `PscWeeklyDataRow` missing `psc_type` discriminator

YAML `psc_weekly.yaml` documents the table as containing **three
prohibited-species streams unioned together**: salmon, halibut, crab.
The discriminator column is `psc_type`. types.ts does NOT include it.

Consequence: any topic page summing `psc_count` across rows will
double-count — it's mixing salmon counts (in fish), crab counts (in
crabs), and halibut counts (which use `psc_weight_kg`/`psc_mortality_mt`
instead). Halibut rows have `species_code = NULL`, so filtering by
species_code only partially separates them.

**Fix:** Add `psc_type: "salmon" | "halibut" | "crab"` to
`PscWeeklyDataRow`. Audit Chinook + Chum topic pages to confirm they
filter `psc_type === "salmon"` (and ideally `species_code === "CHNK"`
or `"NCHNK"`) before any aggregation.

### 🔴 BUG 2 — `MonitoredCatchRow` enum case mismatch

types.ts:
```ts
disposition: "Retained" | "Discarded";
monitored_or_total: "Observed" | "Monitored" | "Total";
```

YAML vocabulary (`column_vocabulary.disposition.vocabulary`):
```
["retained", "discarded"]
["monitored", "total"]
```

YAML is lowercase; types.ts is capitalized. Also types.ts lists
`"Observed"` as a valid value for `monitored_or_total`, which the YAML
does not — only `monitored` and `total`.

Consequence: any topic-page filter like
`r => r.disposition === "Retained"` will return zero rows after S3
cutover. Observer.tsx and Discards.tsx both use this column.

**Fix:** Lowercase the enum values in types.ts; remove `"Observed"`.
Then audit `Observer.tsx` and `Discards.tsx` for filters and update
the comparison strings.

### 🟡 RISK 3 — `salmon_escapement` queries don't filter `count_method`

Not a type bug, but a binding rule from `mainsail_data/CLAUDE.md`:

> Any goal-compliance or trend analysis against `salmon_escapement`
> MUST exclude rows whose `count_method` starts with
> `not_operated_` or `partial_season_`.

These rows have `actual_count = NULL` or undercount values; including
them in totals or goal comparisons silently understates escapement.

`topics/Chinook.tsx`, `topics/Chum.tsx`, and
`topics/FisheriesManagement.tsx` all read this dataset. Audit them for
trend / aggregate computations and add the filter.

**Fix:** In the data-shaping helpers (or wherever these aggregations
happen), add:

```ts
.filter(r => r.count_method &&
             !r.count_method.startsWith("not_operated_") &&
             !r.count_method.startsWith("partial_season_"))
```

### Other datasets — spot-checked, no bugs found

`SalmonEscapementRow`, `EscapementGoalsHistoryRow`, `IphcTceyDataRow`,
`IphcSourceMortalityRow`, `IphcSpawningBiomassRow`, `IfqLandingsRow`,
`DiscardMortalityRateRow`, `HatcheryReleasesRow`, `TacSpecsRow`,
`SportHarvestDataRow`, `ChinookGsiRow`, `FishCountsRow`,
`SalmonCommercialHarvestDataRow` — types align with YAML schemas at
the field level. (Not a guarantee of value correctness or nullability
edge cases — that's what S3 cutover smoke-testing catches.)

**Recommendation:** fix the three issues above before S3 cutover, not
after. Easier to reason about a clean type layer than to debug "why
is my chart empty" once production data is flowing.
