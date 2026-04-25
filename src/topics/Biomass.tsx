import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type { TacSpecsRow } from "../api/types";
import { Card, Crumb, DataContext, Note, StatGrid, Table } from "../components/primitives";
import MultiLineTrend from "../components/charts/MultiLineTrend";
import SpeciesBar from "../components/charts/SpeciesBar";

const fmt = (n: number | null | undefined, digits = 0) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: digits });

const fmtKt = (mt: number | null | undefined) =>
  mt == null ? "—" : `${Math.round(mt / 1000).toLocaleString()} kt`;

const fmtPct = (n: number | null | undefined) =>
  n == null ? "—" : `${(n * 100).toFixed(1)}%`;

export default function Biomass() {
  const { data, isLoading, error } = useDataset<TacSpecsRow>("tac_specs");

  const pollockTrend = useMemo(() => {
    if (!data) return [];
    const map = new Map<number, Record<string, number>>();
    for (const r of data) {
      if (r.fmp_area === "BSAI" && r.species_complex === "Pollock" && r.area_detail === "BS") {
        map.set(r.year, {
          year: r.year,
          "OFL (kt)": Math.round((r.ofl_mt ?? 0) / 1000),
          "ABC (kt)": Math.round((r.abc_mt ?? 0) / 1000),
          "TAC (kt)": Math.round((r.tac_mt ?? 0) / 1000),
        });
      }
    }
    return [...map.values()].sort((a, b) => a.year - b.year);
  }, [data]);

  const bsai2026 = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { ofl: number; abc: number; tac: number; catch: number; pct: number | null }>();
    for (const r of data) {
      if (r.year === 2026 && r.fmp_area === "BSAI") {
        const prev = map.get(r.species_complex) ?? { ofl: 0, abc: 0, tac: 0, catch: 0, pct: null };
        map.set(r.species_complex, {
          ofl: prev.ofl + (r.ofl_mt ?? 0),
          abc: prev.abc + (r.abc_mt ?? 0),
          tac: prev.tac + (r.tac_mt ?? 0),
          catch: prev.catch + (r.catch_mt ?? 0),
          pct: r.percent_tac_taken ?? prev.pct,
        });
      }
    }
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.tac - a.tac);
  }, [data]);

  const goa2026 = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { ofl: number; abc: number; tac: number; catch: number; pct: number | null }>();
    for (const r of data) {
      if (r.year === 2026 && r.fmp_area === "GOA") {
        const prev = map.get(r.species_complex) ?? { ofl: 0, abc: 0, tac: 0, catch: 0, pct: null };
        map.set(r.species_complex, {
          ofl: prev.ofl + (r.ofl_mt ?? 0),
          abc: prev.abc + (r.abc_mt ?? 0),
          tac: prev.tac + (r.tac_mt ?? 0),
          catch: prev.catch + (r.catch_mt ?? 0),
          pct: r.percent_tac_taken ?? prev.pct,
        });
      }
    }
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.tac - a.tac);
  }, [data]);

  const totalBSAITac = bsai2026.reduce((s, r) => s + r.tac, 0);
  const totalGOATac = goa2026.reduce((s, r) => s + r.tac, 0);
  const pollock2026 = pollockTrend.find((r) => r.year === 2026);
  const OFY_CEILING_KT = 2000;

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

  // Catch vs TAC for BSAI — species with catch data
  const bsaiCatchVsTac = useMemo(() => {
    if (!bsai2026.length) return [];
    return bsai2026
      .filter((r) => r.catch > 0)
      .map((r) => [
        r.name,
        fmt(r.tac),
        fmt(r.catch),
        r.tac > 0 ? fmtPct(r.catch / r.tac) : "—",
      ]);
  }, [bsai2026]);

  const goaCatchVsTac = useMemo(() => {
    if (!goa2026.length) return [];
    return goa2026
      .filter((r) => r.catch > 0)
      .map((r) => [
        r.name,
        fmt(r.tac),
        fmt(r.catch),
        r.tac > 0 ? fmtPct(r.catch / r.tac) : "—",
      ]);
  }, [goa2026]);

  return (
    <>
      <Crumb topic="Biomass, TAC & ABC" />
      <h1 className="page-title">Biomass, TAC &amp; ABC</h1>

      <DataContext
        use={[
          "tac_specs — NMFS harvest specifications (OFL/ABC/TAC) for BSAI & GOA",
          "monitored_catch — NMFS actual catch by species, gear, sector",
        ]}
        could={[
          "bottom_trawl_survey — AFSC bottom trawl biomass indices",
          "acoustic_trawl_survey — pollock acoustic biomass estimates",
          "age_structured_assessment — model outputs by stock (GOA/BSAI)",
          "stock_assessment_timeseries — historical biomass estimates",
        ]}
        ideas={[
          "OFL→ABC→TAC→Catch funnel chart per species",
          "Year-over-year TAC change by species complex",
          "Catch-to-TAC utilization rate trend",
          "BSAI vs. GOA pollock biomass comparison",
        ]}
      />

      {isLoading && <p className="section-intro">Loading harvest specifications…</p>}
      {error && <Note>Could not load harvest specification data from S3.</Note>}

      {data && (
        <>
          <StatGrid
            stats={[
              {
                val: fmtKt(pollock2026?.["TAC (kt)"] != null ? pollock2026["TAC (kt)"] * 1000 : null),
                label: "BSAI Pollock TAC (2026, BS quota area)",
                sub: "Bering Sea pollock — largest single-species fishery in the U.S.",
              },
              {
                val: fmtKt(totalBSAITac),
                label: "Total BSAI TAC (2026)",
                sub: `${Math.round((totalBSAITac / (OFY_CEILING_KT * 1000)) * 100)}% of the 2 million mt optimum yield ceiling`,
              },
              {
                val: fmtKt(totalGOATac),
                label: "Total GOA TAC (2026)",
              },
              {
                val: fmt(
                  data.filter((r) => r.fmp_area === "BSAI" && r.year === 2026 && r.species_complex === "Pollock" && r.area_detail === "BS")[0]?.abc_mt ?? null
                ),
                label: "BSAI Pollock ABC (2026, BS)",
                sub: "Step-down from OFL for assessment uncertainty",
                accent: "accent",
              },
            ]}
          />

          <h2 className="h2">BSAI Pollock: OFL → ABC → TAC, 2007–2026</h2>
          <Card>
            <MultiLineTrend
              data={pollockTrend}
              xKey="year"
              seriesKeys={["OFL (kt)", "ABC (kt)", "TAC (kt)"]}
              colors={["#9ca3af", "#6b8fad", "#1a2332"]}
              title="BSAI Pollock (Bering Sea quota area) — OFL, ABC, TAC"
              yLabel="thousand mt"
              unitSuffix="kt"
            />
          </Card>

          <h2 className="h2">{latestYear} BSAI total allowable catch by species</h2>
          <Card>
            <SpeciesBar
              data={bsaiEcosystemBar}
              title={`BSAI groundfish TAC, ${latestYear} — all stocks`}
              unitLabel="mt"
              color="#2f5d8a"
            />
            <div className="data-caption">
              Source: NMFS AKRO harvest specifications via Mainsail tac_specs
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

          {bsaiCatchVsTac.length > 0 && (
            <>
              <h2 className="h2">{latestYear} BSAI catch vs. TAC</h2>
              <Card>
                <Table
                  columns={[
                    { label: "Species" },
                    { label: "TAC (mt)", num: true },
                    { label: "Catch (mt)", num: true },
                    { label: "% TAC taken", num: true },
                  ]}
                  rows={bsaiCatchVsTac}
                  caption="Source: NMFS AKRO harvest specifications via Mainsail tac_specs dataset"
                />
              </Card>
            </>
          )}

          {goaCatchVsTac.length > 0 && (
            <>
              <h2 className="h2">{latestYear} GOA catch vs. TAC</h2>
              <Card>
                <Table
                  columns={[
                    { label: "Species" },
                    { label: "TAC (mt)", num: true },
                    { label: "Catch (mt)", num: true },
                    { label: "% TAC taken", num: true },
                  ]}
                  rows={goaCatchVsTac}
                  caption="Source: NMFS AKRO harvest specifications via Mainsail tac_specs dataset"
                />
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
}
