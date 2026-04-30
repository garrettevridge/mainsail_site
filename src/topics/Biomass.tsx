import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type { TacSpecsRow, StockAssessmentBiomassRow } from "../api/types";
import { Card, Crumb, DataContext, KV, Note, StatGrid, Table } from "../components/primitives";
import MultiLineTrend from "../components/charts/MultiLineTrend";
import SpeciesBar from "../components/charts/SpeciesBar";

const fmt = (n: number | null | undefined, digits = 0) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: digits });

const fmtKt = (mt: number | null | undefined) =>
  mt == null ? "—" : `${Math.round(mt / 1000).toLocaleString()} kt`;

const fmtPct = (n: number | null | undefined) =>
  n == null ? "—" : `${(n * 100).toFixed(1)}%`;

// True iff a tac_specs row's `data_quality_flags` JSON string contains
// the given flag. State GHLs (state Guideline Harvest Levels) are
// flagged this way and are state allocations that do NOT count against
// the federal Optimum Yield bound.
function hasFlag(row: TacSpecsRow, flag: string): boolean {
  if (!row.data_quality_flags) return false;
  try {
    const flags = JSON.parse(row.data_quality_flags);
    return Array.isArray(flags) && flags.includes(flag);
  } catch {
    return false;
  }
}

// Aggregate tac_specs rows by species_complex without double-counting.
//
// Rationale: tac_specs stores some species at two granularities in the
// same year — a rollup row with `area_detail = null` carrying the
// all-area total, plus per-subarea rows. Naive `sum-by-species_complex`
// adds both and inflates the total by ~2x for those species (POP,
// Atka mackerel, Greenland turbot, Other rockfish, etc.).
//
// Rule: if a rollup row exists for the species, use ONLY the rollup.
// Otherwise sum the per-subarea rows.
interface AggregatedRow {
  name: string;
  ofl: number;
  abc: number;
  tac: number;
  catch_mt: number;
  pct: number | null;
}

function aggregateByComplex(rows: TacSpecsRow[]): AggregatedRow[] {
  const groups = new Map<string, TacSpecsRow[]>();
  for (const r of rows) {
    if (!groups.has(r.species_complex)) groups.set(r.species_complex, []);
    groups.get(r.species_complex)!.push(r);
  }
  const out: AggregatedRow[] = [];
  for (const [name, rs] of groups) {
    const rollup = rs.find((r) => r.area_detail == null || r.area_detail === "");
    const detail = rs.filter((r) => r.area_detail != null && r.area_detail !== "");
    const source = rollup ? [rollup] : detail;
    out.push({
      name,
      ofl: source.reduce((s, r) => s + (r.ofl_mt ?? 0), 0),
      abc: source.reduce((s, r) => s + (r.abc_mt ?? 0), 0),
      tac: source.reduce((s, r) => s + (r.tac_mt ?? 0), 0),
      catch_mt: source.reduce((s, r) => s + (r.catch_mt ?? 0), 0),
      pct:
        source.find((r) => r.percent_tac_taken != null)?.percent_tac_taken ??
        null,
    });
  }
  return out;
}

export default function Biomass() {
  const { data, isLoading, error } = useDataset<TacSpecsRow>("tac_specs");
  const { data: biomassData } = useDataset<StockAssessmentBiomassRow>(
    "stock_assessment_biomass"
  );

  // Per-stock chart configs. Each stock has a biomass series in
  // `stock_assessment_biomass` and a corresponding TAC series in
  // `tac_specs`. The `tacFilter` predicate selects the rows whose
  // OFL/ABC/TAC sums match the assessment's scope (e.g. BS subarea
  // for BSAI EBS pollock; sum of BSAI + GOA for Alaska-wide
  // sablefish). State GHLs are always excluded — they're state
  // allocations and don't belong on a federal-assessment chart.
  type StockChartConfig = {
    stockId: string;
    title: string;
    caption: string;
    tacFilter: (r: TacSpecsRow) => boolean;
  };
  const STOCK_CHARTS: StockChartConfig[] = [
    {
      stockId: "bsai_ebs_pollock",
      title: "BSAI EBS Pollock — biomass and harvest specs, 1964–2026",
      caption:
        "Biomass: NPFMC 2024 SAFE Chapter 1, Table 26 — age-3+ EBS pollock at start of year. Recent decade catch concentrated at ages 4–6 (~63%). Specs: NMFS AKRO BS quota area.",
      tacFilter: (r) =>
        r.fmp_area === "BSAI" &&
        r.species_complex === "Pollock" &&
        r.area_detail === "BS" &&
        !hasFlag(r, "state_ghl"),
    },
    {
      stockId: "goa_pollock",
      title: "GOA Pollock — biomass and harvest specs, 1977–2026",
      caption:
        "Biomass: NPFMC 2024 SAFE Chapter 1, Table 1.23 — age-3+ GOA pollock at start of year. Specs: NMFS AKRO, federal portions only (state GHLs excluded).",
      tacFilter: (r) =>
        r.fmp_area === "GOA" &&
        r.species_complex === "Pollock" &&
        !hasFlag(r, "state_ghl"),
    },
    {
      stockId: "bsai_ebs_pcod",
      title: "BSAI EBS Pacific Cod — biomass and harvest specs, 1978–2026",
      caption:
        "Biomass: NPFMC 2024 SAFE Chapter 2, Tables 2.26 + 2.28, Model 24.1 (author-recommended). Specs: NMFS AKRO BS subarea, federal portion (state GHL excluded).",
      tacFilter: (r) =>
        r.fmp_area === "BSAI" &&
        r.species_complex === "Pacific Cod" &&
        r.area_detail === "BS" &&
        !hasFlag(r, "state_ghl"),
    },
    {
      stockId: "goa_pcod",
      title: "GOA Pacific Cod — biomass and harvest specs, 1977–2026",
      caption:
        "Biomass: NPFMC 2024 SAFE Chapter 2, Table 2.15 ('Current' model) — age-0+ total biomass. Specs: NMFS AKRO GOA, federal portion (state GHLs excluded).",
      tacFilter: (r) =>
        r.fmp_area === "GOA" &&
        r.species_complex === "Pacific Cod" &&
        !hasFlag(r, "state_ghl"),
    },
    {
      stockId: "alaska_sablefish",
      title: "Alaska Sablefish — biomass and harvest specs, 1960–2026",
      caption:
        "Biomass: NPFMC 2024 SAFE Chapter 3, Table 3.8 — age-2+ Alaska-wide sablefish. Specs: NMFS AKRO, BSAI + GOA combined (one Alaska-wide assessment apportioned to two FMPs).",
      tacFilter: (r) =>
        r.species_complex === "Sablefish" && !hasFlag(r, "state_ghl"),
    },
  ];

  // Build one chart-data array per stock. Returns biomass series
  // unioned with summed OFL/ABC/TAC for the configured filter.
  // Pre-2007 years have no harvest specs (gaps in the chart) because
  // tac_specs starts in 2007.
  const stockTrends = useMemo(() => {
    const out: Record<string, Array<Record<string, number | null>>> = {};
    for (const cfg of STOCK_CHARTS) {
      const map = new Map<number, Record<string, number | null>>();

      // OFL/ABC/TAC: sum across all rows matching the filter for each year.
      if (data) {
        const byYear = new Map<
          number,
          { ofl: number; abc: number; tac: number; hasAny: boolean }
        >();
        for (const r of data) {
          if (!cfg.tacFilter(r)) continue;
          const acc = byYear.get(r.year) ?? {
            ofl: 0,
            abc: 0,
            tac: 0,
            hasAny: false,
          };
          acc.ofl += r.ofl_mt ?? 0;
          acc.abc += r.abc_mt ?? 0;
          acc.tac += r.tac_mt ?? 0;
          acc.hasAny = true;
          byYear.set(r.year, acc);
        }
        for (const [year, v] of byYear) {
          if (!v.hasAny) continue;
          map.set(year, {
            year,
            "OFL (kt)": Math.round(v.ofl / 1000),
            "ABC (kt)": Math.round(v.abc / 1000),
            "TAC (kt)": Math.round(v.tac / 1000),
          });
        }
      }

      // Biomass: latest source_safe_year wins per year.
      if (biomassData) {
        const byYear = new Map<number, StockAssessmentBiomassRow>();
        for (const r of biomassData) {
          if (r.stock_id !== cfg.stockId) continue;
          const existing = byYear.get(r.year);
          if (!existing || r.source_safe_year > existing.source_safe_year) {
            byYear.set(r.year, r);
          }
        }
        for (const [year, r] of byYear) {
          const existing = map.get(year) ?? {
            year,
            "OFL (kt)": null,
            "ABC (kt)": null,
            "TAC (kt)": null,
          };
          map.set(year, {
            ...existing,
            "Total biomass (kt)": r.total_biomass_kt,
          });
        }
      }

      out[cfg.stockId] = [...map.values()].sort(
        (a, b) => (a.year as number) - (b.year as number)
      );
    }
    return out;
  }, [data, biomassData]);

  // The original headline pollock trend — used for the stat-grid lookup.
  const pollockTrend = stockTrends["bsai_ebs_pollock"] ?? [];

  const bsai2026 = useMemo<AggregatedRow[]>(() => {
    if (!data) return [];
    const rows = data.filter((r) => r.year === 2026 && r.fmp_area === "BSAI");
    return aggregateByComplex(rows).sort((a, b) => b.tac - a.tac);
  }, [data]);

  const goa2026 = useMemo<AggregatedRow[]>(() => {
    if (!data) return [];
    const rows = data.filter((r) => r.year === 2026 && r.fmp_area === "GOA");
    return aggregateByComplex(rows).sort((a, b) => b.tac - a.tac);
  }, [data]);

  // BSAI 2026 federal-OY check: sum the species_complex rollups, but exclude
  // rows flagged as state_ghl (state Guideline Harvest Levels are state
  // allocations and do NOT count against the federal 1.4–2.0 Mt OY range).
  const bsaiFederalTac2026 = useMemo(() => {
    if (!data) return 0;
    const rows = data.filter(
      (r) =>
        r.year === 2026 &&
        r.fmp_area === "BSAI" &&
        !hasFlag(r, "state_ghl")
    );
    return aggregateByComplex(rows).reduce((s, r) => s + r.tac, 0);
  }, [data]);

  const goaFederalTac2026 = useMemo(() => {
    if (!data) return 0;
    const rows = data.filter(
      (r) =>
        r.year === 2026 &&
        r.fmp_area === "GOA" &&
        !hasFlag(r, "state_ghl")
    );
    return aggregateByComplex(rows).reduce((s, r) => s + r.tac, 0);
  }, [data]);

  const pollock2026 = pollockTrend.find((r) => r.year === 2026);
  // BSAI groundfish FMP optimum yield range: 1.4–2.0 million metric tons.
  // The federal sum-of-TACs is constrained to fall inside this band.
  const OY_RANGE_UPPER_KT = 2000;
  const oyUpperPct = Math.round(
    (bsaiFederalTac2026 / (OY_RANGE_UPPER_KT * 1000)) * 100
  );

  const bsaiEcosystemBar = useMemo(
    () => bsai2026.map((r) => ({ species: r.name, value: r.tac })),
    [bsai2026]
  );

  const goaEcosystemBar = useMemo(
    () => goa2026.map((r) => ({ species: r.name, value: r.tac })),
    [goa2026]
  );

  const latestYear = useMemo(() => {
    if (!data) return null;
    return Math.max(...data.map((r) => r.year));
  }, [data]);

  // Catch-vs-TAC rendering rule: only show years where catch is actually
  // populated. Today (2026-04) the 2026 fishing year is ~4 months in and
  // catch is null on every 2026 row; rather than imply "0% taken", we
  // show the most recent year that has any non-null catch in the dataset.
  const lastFullCatchYear = useMemo(() => {
    if (!data) return null;
    const yearsWithCatch = new Set(
      data
        .filter((r) => r.catch_mt != null && r.catch_mt > 0)
        .map((r) => r.year)
    );
    if (!yearsWithCatch.size) return null;
    return Math.max(...yearsWithCatch);
  }, [data]);

  const bsaiCatchVsTac = useMemo(() => {
    if (!data || lastFullCatchYear == null) return [];
    const rows = data.filter(
      (r) =>
        r.year === lastFullCatchYear &&
        r.fmp_area === "BSAI"
    );
    const agg = aggregateByComplex(rows).sort((a, b) => b.tac - a.tac);
    return agg
      .filter((r) => r.catch_mt > 0)
      .map((r) => [
        r.name,
        fmt(r.tac),
        fmt(r.catch_mt),
        r.tac > 0 ? fmtPct(r.catch_mt / r.tac) : "—",
      ]);
  }, [data, lastFullCatchYear]);

  const goaCatchVsTac = useMemo(() => {
    if (!data || lastFullCatchYear == null) return [];
    const rows = data.filter(
      (r) =>
        r.year === lastFullCatchYear &&
        r.fmp_area === "GOA"
    );
    const agg = aggregateByComplex(rows).sort((a, b) => b.tac - a.tac);
    return agg
      .filter((r) => r.catch_mt > 0)
      .map((r) => [
        r.name,
        fmt(r.tac),
        fmt(r.catch_mt),
        r.tac > 0 ? fmtPct(r.catch_mt / r.tac) : "—",
      ]);
  }, [data, lastFullCatchYear]);

  return (
    <>
      <Crumb topic="Biomass, TAC & ABC" />
      <h1 className="page-title">Biomass, TAC &amp; ABC</h1>

      <DataContext
        use={[
          "tac_specs — NMFS harvest specifications (OFL/ABC/TAC) for BSAI & GOA",
          "stock_assessment_biomass — NPFMC SAFE biomass time series (Phase 2: 5 Tier 1 stocks — pollock, cod, sablefish)",
          "monitored_catch — NMFS actual catch by species, gear, sector",
        ]}
        could={[
          "bottom_trawl_survey — AFSC bottom trawl biomass indices",
          "acoustic_trawl_survey — pollock acoustic biomass estimates",
          "stock_assessment_reference_points — B0, B40%, B35%, B20% per stock",
        ]}
        ideas={[
          "Phase 3 stocks (BSAI/GOA POP, northern rockfish, Atka, arrowtooth, yellowfin sole)",
          "Phase 4: probe Stock SMART before building a SAFE PDF extractor",
          "Exploitation rate (TAC / total biomass) over time per stock",
          "Multi-vintage assessment retrospectives (each SAFE revises priors)",
        ]}
      />

      {isLoading && <p className="section-intro">Loading harvest specifications…</p>}
      {error && <Note>Could not load harvest specification data from S3.</Note>}

      {data && (
        <>
          <h2 className="h2">Glossary</h2>
          <Card>
            <KV
              pairs={[
                {
                  dt: "OFL",
                  dd: (
                    <>
                      Overfishing Limit. The catch above which the stock would
                      be classified as undergoing overfishing. Derived from the
                      stock assessment under the Tier 1–6 control rule.
                    </>
                  ),
                },
                {
                  dt: "ABC",
                  dd: (
                    <>
                      Acceptable Biological Catch. Set ≤ OFL by the Council's
                      Scientific and Statistical Committee (SSC) under the
                      Tier 1–6 control rule, applying a buffer that reflects
                      both scientific uncertainty and the SSC's risk
                      preference.
                    </>
                  ),
                },
                {
                  dt: "TAC",
                  dd: (
                    <>
                      Total Allowable Catch. Set ≤ ABC by the Council;
                      reflects ecosystem caps (the BSAI 1.4–2.0 Mt optimum
                      yield range), prohibited-species catch limits, and
                      socio-economic considerations.
                    </>
                  ),
                },
                {
                  dt: "Tier",
                  dd: (
                    <>
                      Stock-assessment data tier 1–6, descending data quality.
                      Tier 1: full age-structured assessment with biomass
                      reference points (BSAI pollock, sablefish).
                      Tier 3: conventional reference points (B40%, B35%, B20%).
                      Tier 5–6: data-limited; OFL set from natural mortality
                      × biomass or recent-average catch.
                    </>
                  ),
                },
                {
                  dt: "Total biomass",
                  dd: (
                    <>
                      The SAFE assessment's headline biomass series for the
                      stock. Each stock's assessment uses its own age cutoff
                      (pollock: age-3+; sablefish: age-2+; GOA Pacific cod:
                      age-0+) — see each chart's caption for the specific
                      cutoff. The series the harvest control rule contextualizes.
                    </>
                  ),
                },
              ]}
            />
          </Card>

          <StatGrid
            stats={[
              {
                val: fmtKt(
                  pollock2026?.["TAC (kt)"] != null
                    ? (pollock2026["TAC (kt)"] as number) * 1000
                    : null
                ),
                label: "BSAI Pollock TAC (2026, BS quota area)",
                sub: "Bering Sea pollock — largest single-species fishery in the U.S. by volume",
              },
              {
                val: fmtKt(bsaiFederalTac2026),
                label: "BSAI federal TAC (2026)",
                sub: `${oyUpperPct}% of the 2.0 Mt upper bound of the 1.4–2.0 Mt OY range; state GHLs excluded`,
              },
              {
                val: fmtKt(goaFederalTac2026),
                label: "GOA federal TAC (2026)",
              },
              {
                val: fmtKt(
                  pollockTrend.find((r) => r.year === 2024)?.[
                    "Total biomass (kt)"
                  ] != null
                    ? ((pollockTrend.find((r) => r.year === 2024)?.[
                        "Total biomass (kt)"
                      ] as number) *
                        1000)
                    : null
                ),
                label: "BSAI EBS Pollock age-3+ biomass (2024)",
                sub: "From 2024 SAFE Table 26 — most recent assessment",
                accent: "accent",
              },
            ]}
          />

          <h2 className="h2">Per-stock biomass and harvest specifications</h2>
          <p className="section-intro">
            One chart per Tier 1 stock. The biomass line is the SAFE
            assessment's headline series; OFL/ABC/TAC are summed across
            the federal management areas that match the assessment's
            scope (state Guideline Harvest Levels excluded). Pre-2007
            OFL/ABC/TAC values are not in <code>tac_specs</code> and
            render as gaps.
          </p>

          {STOCK_CHARTS.map((cfg) => {
            const trend = stockTrends[cfg.stockId] ?? [];
            return (
              <Card key={cfg.stockId}>
                <MultiLineTrend
                  data={trend}
                  xKey="year"
                  seriesKeys={[
                    "Total biomass (kt)",
                    "OFL (kt)",
                    "ABC (kt)",
                    "TAC (kt)",
                  ]}
                  colors={["#2f5d8a", "#9ca3af", "#6b8fad", "#1a2332"]}
                  title={cfg.title}
                  yLabel="thousand mt"
                  unitSuffix="kt"
                />
                <div className="data-caption">{cfg.caption}</div>
              </Card>
            );
          })}

          <h2 className="h2">{latestYear} BSAI total allowable catch by species</h2>
          <Card>
            <SpeciesBar
              data={bsaiEcosystemBar}
              title={`BSAI groundfish TAC, ${latestYear} — all stocks`}
              unitLabel="mt"
              color="#2f5d8a"
            />
            <div className="data-caption">
              Source: NMFS AKRO harvest specifications via Mainsail tac_specs.
              Per-stock TAC uses the all-area rollup row when present and
              the sum of subarea rows otherwise — never both — to avoid
              double-counting species like Atka mackerel and Pacific ocean
              perch that are stored at two granularities.
            </div>
          </Card>

          <h2 className="h2">{latestYear} GOA total allowable catch by species</h2>
          <Card>
            <SpeciesBar
              data={goaEcosystemBar}
              title={`GOA groundfish TAC, ${latestYear} — all stocks`}
              unitLabel="mt"
              color="#7b6a4f"
            />
            <div className="data-caption">
              Source: NMFS AKRO harvest specifications via Mainsail tac_specs
            </div>
          </Card>

          <h2 className="h2">{latestYear} BSAI Harvest Specifications</h2>
          <Card>
            <Table
              columns={[
                { label: "Species" },
                { label: "OFL (mt)", num: true },
                { label: "ABC (mt)", num: true },
                { label: "TAC (mt)", num: true },
              ]}
              rows={bsai2026.map((r) => [r.name, fmt(r.ofl), fmt(r.abc), fmt(r.tac)])}
              caption="Source: NMFS AKRO harvest specifications via Mainsail tac_specs dataset"
            />
          </Card>

          <h2 className="h2">{latestYear} GOA Harvest Specifications</h2>
          <Card>
            <Table
              columns={[
                { label: "Species" },
                { label: "OFL (mt)", num: true },
                { label: "ABC (mt)", num: true },
                { label: "TAC (mt)", num: true },
              ]}
              rows={goa2026.map((r) => [r.name, fmt(r.ofl), fmt(r.abc), fmt(r.tac)])}
              caption="Source: NMFS AKRO harvest specifications via Mainsail tac_specs dataset"
            />
          </Card>

          {lastFullCatchYear == null ? (
            <Note>
              Realized catch data is not yet populated in the{" "}
              <code>tac_specs</code> dataset (no rows have a non-null{" "}
              <code>catch_mt</code> as of the {latestYear} snapshot). Catch
              vs. TAC tables will appear once values are available.
            </Note>
          ) : (
            <>
              {bsaiCatchVsTac.length > 0 && (
                <>
                  <h2 className="h2">{lastFullCatchYear} BSAI catch vs. TAC</h2>
                  <Card>
                    <Table
                      columns={[
                        { label: "Species" },
                        { label: "TAC (mt)", num: true },
                        { label: "Catch (mt)", num: true },
                        { label: "% TAC taken", num: true },
                      ]}
                      rows={bsaiCatchVsTac}
                      caption={`Source: NMFS AKRO harvest specifications via Mainsail tac_specs dataset (${lastFullCatchYear} fishing year, last full year on record)`}
                    />
                  </Card>
                </>
              )}

              {goaCatchVsTac.length > 0 && (
                <>
                  <h2 className="h2">{lastFullCatchYear} GOA catch vs. TAC</h2>
                  <Card>
                    <Table
                      columns={[
                        { label: "Species" },
                        { label: "TAC (mt)", num: true },
                        { label: "Catch (mt)", num: true },
                        { label: "% TAC taken", num: true },
                      ]}
                      rows={goaCatchVsTac}
                      caption={`Source: NMFS AKRO harvest specifications via Mainsail tac_specs dataset (${lastFullCatchYear} fishing year, last full year on record)`}
                    />
                  </Card>
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
