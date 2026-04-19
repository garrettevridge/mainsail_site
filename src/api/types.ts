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

// ── Per-dataset row shapes ───────────────────────────────────────────────

export interface SalmonCommercialHarvestRow {
  fact_id: string;
  year: number;
  species: "chinook" | "sockeye" | "coho" | "pink" | "chum";
  region: string;
  harvest_fish: number | null;
  harvest_pounds: number | null;
  exvessel_value_usd: number | null;
  is_preliminary: 0 | 1;
  source_document: string | null;
  source_url: string | null;
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

export interface PscWeeklyRow {
  id: number;
  year: number;
  stat_week: number;
  species: string; // CHNK, CHUM, HLBT, etc.
  fmp_area: string; // BSAI, GOA
  target_fishery: string; // Pollock, etc.
  psc_count: number;
  report_through: string | null;
}

export interface ChinookGsiRow {
  id: number;
  year: number;
  region: string; // stock reporting group
  mean_pct: number;
  total_catch: number;
  n_samples: number;
}

export interface IphcMortalityBySourceRow {
  id: number;
  year: number;
  source: string;
  mortality_net_pounds: number | null;
}

export interface IphcTceyRow {
  id: number;
  year: number;
  area: string;
  tcey_net_pounds: number | null;
}

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

export interface SubsistenceHarvestRow {
  id: number;
  year: number;
  region: string;
  species: string;
  harvest_fish: number | null;
}

export interface SportHarvestRow {
  id: number;
  year: number;
  area: string;
  species: string;
  harvest: number | null;
  catch: number | null;
}

export interface FishCountsRow {
  id: number;
  location: string;
  species: string;
  count_date: string;
  daily_count: number | null;
  cumulative_count: number | null;
}
