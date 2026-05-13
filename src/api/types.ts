// Types mirroring the Mainsail S3 publish contract.
// Every field here corresponds to a column published by the data pipeline.
// See: mainsail_data/backend/app/publish/s3_publisher.py

export interface ManifestDataset {
  name: string;
  json_url: string;
  parquet_url: string;
  schema_url: string;
  row_count: number;
  json_bytes: number;
  parquet_bytes: number;
  json_sha256: string;
  parquet_sha256: string;
}

export interface Manifest {
  schema_version: string;
  generated_at: string; // ISO 8601
  bucket: string;
  region: string;
  datasets: ManifestDataset[];
}

// ── S3-native row shapes (match actual published columns) ────────────────────
// Authoritative: these mirror the columns the mainsail_data pipeline writes
// to s3://mainsail-public-data/v1/<dataset>.json. Confirmed against
// backend/_publish/*.json staging artifacts on 2026-04-25.

export interface ChinookGsiRow {
  id: number;
  year: number;
  region: string; // stock reporting group
  mean_pct: number;
  total_catch: number;
  n_samples: number;
}

// chum_gsi — BSAI pollock chum bycatch genetic stock identification.
// v1 ships 2023 BSAI B-season aggregate from the NPFMC C2 Chum Salmon
// Genetics Report (Barry et al., April 2024). Six reporting groups:
// NE Asia, SE Asia, W Alaska, Up/Mid Yukon, SW Alaska, E GOA/PNW.
// mean_pct is a percentage value (e.g. 16.3 = 16.3%).
// point_count / lower_95_ci / upper_95_ci are fish counts derived
// from total_catch × the GSI mean and 95% CI.
export interface ChumGsiRow {
  id: number;
  year: number;
  fmp_area: string;
  region: string;
  mean_pct: number;
  point_count: number;
  lower_95_ci: number;
  upper_95_ci: number;
  total_catch: number;
  n_samples: number;
  source_report_year: number;
  source_url: string;
}

// psc_annual_historical — annual chinook PSC mortality by FMP area,
// 1991-present. BSAI series combines NMFS's 1991-2010 hand-coded PDF
// with rolled-forward NMFS HTML pages 2011+; GOA series is rolled-forward
// HTML 1991+. Use this for long-window mortality-by-source charts;
// psc_weekly remains the source for sub-year and by-fishery breakdowns.
export interface PscAnnualHistoricalRow {
  fact_id: string;
  source_id: string;
  region: "BSAI" | "GOA";
  year: number;
  species: string; // currently "chinook" only
  mortality_count: number | null;
  granularity: string;
  is_preliminary: 0 | 1;
  source_document: string | null;
  source_url: string | null;
}

// subsistence_harvest_statewide — NPAFC-sourced statewide annual
// subsistence harvest by species, 1985-present. Companion to the
// granular community-level subsistence_harvest dataset; runs one year
// fresher (NPAFC publishes 2023 vs the dashboard's 2022) and provides
// pre-1985 community gaps coverage.
export interface SubsistenceHarvestStatewideRow {
  fact_id: string;
  year: number;
  species: "chinook" | "sockeye" | "coho" | "pink" | "chum";
  harvest_count: number | null;
  harvest_weight_mt: number | null;
  is_preliminary: 0 | 1;
  source_document: string | null;
  source_url: string | null;
}

export interface FishCountsRow {
  id: number;
  location: string;
  species: string;
  count_date: string;
  daily_count: number | null;
  cumulative_count: number | null;
}

export interface SalmonEscapementRow {
  fact_id: string;
  system_name: string;
  region: string | null;
  species: string;
  year: number;
  goal_type: string | null;
  goal_lower: number | null;
  goal_upper: number | null;
  actual_count: number | null;
  count_method: string | null;
  goal_met: 0 | 1 | null;
  provenance: string | null;
}

export interface EscapementGoalsHistoryRow {
  id: number;
  system_name: string;
  species: string;
  goal_type: string;
  goal_lower: number | null;
  goal_upper: number | null;
  effective_year_start: number;
  effective_year_end: number | null;
  source_document: string | null;
}

// monitored_catch publishes Capitalized enum values ("Retained"/"Discarded",
// "Monitored"/"Observed"/"Total"); the YAML docs in mainsail_data say
// lowercase, but the published JSON is the source of truth.
export interface MonitoredCatchRow {
  id: number;
  year: number;
  fmp_area: string;
  sector: string;
  gear: string;
  species_group: string;
  disposition: "Retained" | "Discarded";
  monitored_or_total: "Observed" | "Monitored" | "Total";
  metric_tons: number;
}

// ── Authoritative *DataRow shapes (production publish-confirmed) ─────────────

export interface TacSpecsRow {
  spec_id: string;
  year: number;
  fmp_area: string;
  species_complex: string;
  species_code: string | null;
  area_detail: string | null;
  ofl_mt: number | null;
  abc_mt: number | null;
  tac_mt: number | null;
  catch_mt: number | null;
  percent_tac_taken: number | null;
  status: string;
  data_quality_flags: string | null; // JSON-encoded array; "state_ghl" marks
                                     // rows that are state allocations and
                                     // do NOT count against the federal OY.
}

// stock_assessment_biomass — Federal Alaska groundfish biomass time series.
// Hybrid pipeline (mainsail_data ADR 0003): total_biomass_kt + cutoff
// from hand-coded 2024 SAFE constants, ssb_kt + recruit_* from NOAA
// Stock SMART API. ~277 rows for five Tier 1 stocks: BSAI EBS pollock
// 1964-2024, GOA pollock 1970-2024, BSAI EBS Pacific cod 1977-2024,
// GOA Pacific cod 1977-2024, Alaska sablefish 1960-2024.
// `source_safe_year` pins each row to a specific assessment vintage.
export interface StockAssessmentBiomassRow {
  biomass_id: string;
  stock_id: string;             // canonical stock id, e.g. "bsai_ebs_pollock"
  fmp_area: string;             // "BSAI" | "GOA" | "alaska_wide"
  species_complex: string;      // joins to tac_specs.species_complex
  area_detail: string | null;
  year: number;
  // Headline biomass series for this stock — the column the chart plots.
  // Each stock's assessment uses its own age cutoff; see biomass_age_cutoff.
  total_biomass_kt: number | null;
  biomass_age_cutoff: string | null; // "age_3+" | "age_2+" | "age_0+" | "total"
  ssb_kt: number | null;
  recruit_millions: number | null;
  recruit_age: number | null;
  total_biomass_cv: number | null;
  source_safe_year: number;
  source_table: string | null;
  source_url: string | null;
}

// psc_weekly is a unioned table: salmon, halibut, and crab PSC streams in
// one table, distinguished by psc_type. Halibut rows have species_code=null
// and use psc_weight_kg/psc_mortality_mt; salmon/crab use psc_count.
// Filter by psc_type before any aggregation across PSC types.
export interface PscWeeklyDataRow {
  fact_id: string;
  psc_type: "salmon" | "halibut" | "crab";
  year: number;
  stat_week: number;
  week_end_date: string | null;
  species_code: string | null;
  species_name: string;
  gear: string;
  reporting_area: string;
  target_fishery: string;
  sector: string;
  groundfish_mt: number | null;
  psc_count: number | null;
  psc_rate: number | null;
  psc_weight_kg: number | null;
  psc_mortality_mt: number | null;
  is_confidential: 0 | 1;
}

export interface IphcSourceMortalityRow {
  id: number;
  year: number;
  source: string;
  mortality_mlb: number | null;
  mortality_tonnes: number | null;
  is_preliminary: 0 | 1;
}

export interface IphcAreaMortalityRow {
  id: number;
  year: number;
  area: string;
  mortality_mlb: number | null;
  mortality_tonnes: number | null;
  is_preliminary: 0 | 1;
}

export interface IphcSpawningBiomassRow {
  id: number;
  year: number;
  model: string;
  sb_mlb: number | null;
  sb_low_ci_mlb: number | null;
  sb_high_ci_mlb: number | null;
  sb_tonnes: number | null;
  sb_low_ci_tonnes: number | null;
  sb_high_ci_tonnes: number | null;
}

export interface IphcTceyDataRow {
  id: number;
  year: number;
  area: string;
  tcey_type: string;
  tcey_mlb: number | null;
  tcey_tonnes: number | null;
}

export interface IfqLandingsRow {
  fact_id: string;
  year: number;
  program: string;
  species: string;
  area: string;
  vessel_landings: number | null;
  catch_lbs: number | null;
  allocation_lbs: number | null;
  remaining_lbs: number | null;
  pct_landed: number | null;
  catch_mt: number | null;
  allocation_mt: number | null;
  is_confidential: 0 | 1;
}

export interface DiscardMortalityRateRow {
  dmr_id: string;
  fmp_area: string;
  gear_type: string;
  species: string;
  dmr_value: number;
  effective_year_start: number;
  effective_year_end: number | null;
  source: string;
  notes: string | null;
}

export interface HatcheryReleasesRow {
  country: string;
  region: string;
  facility: string;
  species: string;
  species_code: string;
  release_year: number;
  brood_year: number | null;
  life_stage: string;
  number_released: number | null;
  avg_weight_g: number | null;
  mark_type: string | null;
  data_level: string;
}

export interface SubsistenceHarvestDataRow {
  id: number;
  year: number;
  community_name: string;
  district: string;
  fishery: string;
  permit_type: string;
  gear_type: string;
  chinook_harvest_fish: number | null;
  sockeye_harvest_fish: number | null;
  coho_harvest_fish: number | null;
  chum_harvest_fish: number | null;
  pink_harvest_fish: number | null;
  total_salmon_harvest_fish: number | null;
  halibut_harvest_fish: number | null;
}

export interface SportHarvestDataRow {
  id: number;
  year: number;
  species_code: string;
  species_name: string;
  region: string;
  area_code: string;
  area_name: string;
  record_type: string;
  fish_count: number | null;
}

export interface SalmonCommercialHarvestDataRow {
  fact_id: string;
  year: number;
  species: string;
  region: string;
  harvest_fish: number | null;
  harvest_pounds: number | null;
  exvessel_value_usd: number | null;
  is_preliminary: 0 | 1;
  source_document: string | null;
  source_url: string | null;
}

// ── IA-pivot datasets (Communities / Harvest / Markets / Landing pages) ──────
// Eight datasets shipped by mainsail_data PRs #14, #15, #16, #17 to back
// the IA pivot. See:
//   - ADR 0007: https://github.com/garrettevridge/mainsail_data/blob/main/docs/decisions/0007-ia-pivot-datasets-and-deflator.md
//   - Briefings 26–33: https://github.com/garrettevridge/mainsail_data/tree/main/docs/briefings
//
// Shared vocabularies — IA-pivot brief §8 and `_alaska_taxonomy.py`:

/** 8 standard region keys the IA-pivot rolls up to.
 *  `nmfs_commercial_landings` ships region='Statewide' only in v1
 *  (the FOSS endpoint is state-grain); the full vocabulary is
 *  reserved so a Phase 2 AKFIN CAS / CFEC-by-area adapter can
 *  populate finer rows without a contract bump. */
export type Region =
  | "Statewide"
  | "BSAI"
  | "Bristol Bay"
  | "Kodiak"
  | "PWS"
  | "Southeast"
  | "AYK"
  | "Westward";

/** 7-bucket species rollup used by `nmfs_commercial_landings`,
 *  `first_wholesale_value`, and `nmfs_trade_exports`. Anything that
 *  doesn't map to one of the named buckets lands in "Other". */
export type SpeciesGroup =
  | "Pollock"
  | "Salmon"
  | "Halibut"
  | "Sablefish"
  | "Crab"
  | "Flatfish"
  | "Other";

/** BLS CPI-U deflator. Join every monetary chart on `year` and
 *  multiply `nominal * deflator_to_base` to render real USD in
 *  `base_year` purchasing power. Currently pinned to 2025; re-pinning
 *  is a single-table republish on the engine side (no consumer code
 *  changes — the chart axis label reads `base_year` dynamically).
 *  Source: BLS series CUUR0000SA0, hand-coded annual averages. */
export interface CpiUDeflatorRow {
  fact_id: string;
  year: number;
  cpi_index: number;       // 1982-84 = 100
  base_year: number;       // currently 2025
  deflator_to_base: number; // multiplier: nominal * this = real_USD_in_base_year
  is_preliminary: 0 | 1;
  source_url: string;
  provenance: string | null;
}

/** NMFS commercial landings rollup. v1 ships region='Statewide' only —
 *  the FOSS landings endpoint does not surface NMFS reporting area or
 *  ADF&G management area for Alaska. The site footnotes this on the
 *  Harvest page region selector. */
export interface NmfsCommercialLandingsRow {
  fact_id: string;
  year: number;
  region: Region;
  species_group: SpeciesGroup;
  landings_lbs: number | null;
  ex_vessel_value_usd_nominal: number | null; // nominal — join cpi_u_deflator
  is_preliminary: 0 | 1;
  methodology_note: string | null;
  source_id: string;
  source_url: string | null;
  provenance: string | null;
}

/** First-wholesale value: processor → next buyer (NOT ex-vessel; NOT
 *  retail). Rolled up from `coar_production` by species_group at
 *  statewide grain. Carries the COAR 3-processor suppression flag. */
export interface FirstWholesaleValueRow {
  fact_id: string;
  year: number;
  species_group: SpeciesGroup;
  first_wholesale_value_usd_nominal: number | null;
  first_wholesale_volume_lbs: number | null; // gross product weight, not round weight
  is_suppressed: 0 | 1;
  is_preliminary: 0 | 1;
  source_id: string;
  source_url: string | null;
  methodology_note: string | null;
  provenance: string | null;
}

/** NMFS "Fisheries of the United States" port tables. Site filters to
 *  `is_alaska === 1` for the Communities page; pre-filtering on the
 *  engine side would erase the national-rank context. Some ports
 *  appear in only one of the FUS Tables 2 (landings) and 3 (revenue),
 *  so the rank on the missing axis is null. */
export interface NmfsTopUsPortsRow {
  fact_id: string;
  year: number;                  // data year (NOT publication year)
  port_name: string;
  state: string;                 // 2-letter
  landings_lbs: number | null;
  ex_vessel_value_usd_nominal: number | null;
  national_rank_by_volume: number | null; // 1 = top
  national_rank_by_value: number | null;
  is_alaska: 0 | 1;
  fus_publication_year: number | null;
  source_url: string | null;
  provenance: string | null;
}

/** ADF&G CFEC permit + permit-holder counts, rolled up from
 *  cfec_earnings BIT to statewide × (year, dimension). NOT comparable
 *  to NMFS processor counts (different counting units, different
 *  jurisdictions — don't sum or ratio). */
export interface CfecRegistryRow {
  fact_id: string;
  year: number;
  dimension: "active_vessels" | "active_permits" | "active_permit_holders";
  count: number | null;
  resident_share: number | null;     // 0..1 fraction
  is_preliminary: 0 | 1;
  source_id: string;
  source_url: string | null;
  methodology_note: string | null;
  provenance: string | null;
}

/** NMFS Alaska processor count from FEUS + APR. v1 scaffold with
 *  NULL counts pending PDF transcription. Federal-permit only — NOT
 *  the same denominator as ADF&G state-permit processor counts. */
export interface NmfsProcessorCountRow {
  fact_id: string;
  year: number;
  sector: "shore_based" | "at_sea" | "all";
  processor_count: number | null;
  is_preliminary: 0 | 1;
  source_id: string;
  source_url: string | null;
  methodology_note: string | null;
  provenance: string | null;
}

/** NMFS Foreign Trade exports rollup. Year × HTS × destination
 *  country. Country names follow the UN short-name designation.
 *  `alaska_origin_attribution` flags whether the HTS code is
 *  Alaska-attributable: 'implied' for Alaska-dominant codes (Alaska
 *  pollock, sablefish, halibut, salmon roe), 'unknown' otherwise. */
export interface NmfsTradeExportsRow {
  fact_id: string;
  year: number;
  hts_code: string;
  hts_description: string | null;
  destination_country: string;            // UN short-name
  destination_country_code: string | null; // ISO 3166-1 alpha-2 where available
  export_volume_kg: number | null;
  export_value_usd_nominal: number | null;
  species_group: SpeciesGroup | null;     // null = unmappable, e.g. surimi blends
  alaska_origin_attribution: "explicit" | "implied" | "unknown";
  is_preliminary: 0 | 1;
  source_id: string;
  provenance: string | null;
}

/** FAO FishStat global wild-capture production by country. Alaska is
 *  intentionally NOT a row — the Markets page computes Alaska as a
 *  synthetic peer bar from nmfs_commercial_landings. Pre-normalized
 *  to UN short-name (e.g., "United States" not "United States of
 *  America", "Republic of Korea" not "Korea, Republic of"). */
export interface FaoFishstatCaptureRow {
  fact_id: string;
  year: number;
  country: string;             // UN short-name
  iso3: string | null;          // ISO 3166-1 alpha-3
  capture_tonnes: number | null;
  source_id: string;
  source_url: string | null;
  provenance: string | null;
}
