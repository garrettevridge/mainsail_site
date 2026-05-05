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
