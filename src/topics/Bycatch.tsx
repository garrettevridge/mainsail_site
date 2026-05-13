import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type {
  PscAnnualHistoricalRow,
  IphcSourceMortalityRow,
  ChinookGsiRow,
  ChumGsiRow,
  DiscardMortalityRateRow,
} from "../api/types";
import { Card, Table } from "../components/primitives";
import SpeciesBar from "../components/charts/SpeciesBar";
import TimeSeriesLine from "../components/charts/TimeSeriesLine";
import StackedTrend from "../components/charts/StackedTrend";

export default function Bycatch() {
  const { data: psc } = useDataset<PscAnnualHistoricalRow>("psc_annual_historical");
  const { data: iphcSrc } = useDataset<IphcSourceMortalityRow>("iphc_mortality_by_source");
  const { data: chinookGsi } = useDataset<ChinookGsiRow>("chinook_gsi");
  const { data: chumGsi } = useDataset<ChumGsiRow>("chum_gsi");
  const { data: dmr } = useDataset<DiscardMortalityRateRow>("discard_mortality_rates");

  // PSC annual — BSAI/GOA stacked per species, 1991-present
  const pscStackedBySpecies = (species: "chinook" | "chum") => {
    if (!psc) return { data: [] as Array<Record<string, number>>, range: "" };
    const rows = psc.filter((r) => r.species === species);
    const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
    const data = years.map((yr) => ({
      year: yr,
      BSAI: rows.find((r) => r.year === yr && r.region === "BSAI")?.mortality_count ?? 0,
      GOA:  rows.find((r) => r.year === yr && r.region === "GOA")?.mortality_count  ?? 0,
    }));
    const range = years.length ? `${years[0]}–${years.at(-1)}` : "";
    return { data, range };
  };

  const pscChinook = useMemo(() => pscStackedBySpecies("chinook"), [psc]);  // eslint-disable-line react-hooks/exhaustive-deps
  const pscChum    = useMemo(() => pscStackedBySpecies("chum"),    [psc]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Halibut bycatch mortality — directed + non-directed discard, 1980+
  const halibutBycatch = useMemo(() => {
    if (!iphcSrc) return { data: [] as Array<{ year: number; bycatch_mlb: number }>, latestYear: null as number | null };
    const totals = new Map<number, number>();
    for (const r of iphcSrc) {
      if (r.year < 1980) continue;
      if (r.source !== "directed_discard" && r.source !== "nondirected_discard") continue;
      if (r.mortality_mlb == null) continue;
      totals.set(r.year, (totals.get(r.year) ?? 0) + r.mortality_mlb);
    }
    const data = [...totals.entries()]
      .map(([year, bycatch_mlb]) => ({ year, bycatch_mlb: +bycatch_mlb.toFixed(2) }))
      .sort((a, b) => a.year - b.year);
    return { data, latestYear: data.length ? data.at(-1)!.year : null };
  }, [iphcSrc]);


  // Chinook GSI — latest year
  const chinookGsiLatest = useMemo(() => {
    if (!chinookGsi) return { rows: [], year: null as number | null };
    if (!chinookGsi.length) return { rows: [], year: null };
    const year = Math.max(...chinookGsi.map((r) => r.year));
    const rows = chinookGsi
      .filter((r) => r.year === year)
      .map((r) => ({ species: r.region, value: r.mean_pct }))
      .sort((a, b) => b.value - a.value);
    return { rows, year };
  }, [chinookGsi]);

  // Chum GSI — latest year
  const chumGsiLatest = useMemo(() => {
    if (!chumGsi) return { rows: [], year: null as number | null };
    if (!chumGsi.length) return { rows: [], year: null };
    const year = Math.max(...chumGsi.map((r) => r.year));
    const rows = chumGsi
      .filter((r) => r.year === year)
      .map((r) => ({ species: r.region, value: r.mean_pct }))
      .sort((a, b) => b.value - a.value);
    return { rows, year };
  }, [chumGsi]);

  return (
    <>
      <h1 className="page-title">Bycatch</h1>

      <h2 className="h2">Chinook PSC mortality — BSAI &amp; GOA, {pscChinook.range}</h2>
      <Card>
        {pscChinook.data.length > 0 && (
          <StackedTrend
            data={pscChinook.data}
            xKey="year"
            stackKeys={["BSAI", "GOA"]}
            colors={["#1a3a6b", "#a8331c"]}
            yLabel="fish"
            yFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
          />
        )}
        <div className="data-caption">
          Source: <code>psc_annual_historical</code> · NMFS AKRO · Chinook only · stacked BSAI + GOA mortality counts. 2025–2026 flagged preliminary in source.
        </div>
      </Card>

      <h2 className="h2">Chum PSC mortality — BSAI &amp; GOA, {pscChum.range}</h2>
      <Card>
        {pscChum.data.length > 0 && (
          <StackedTrend
            data={pscChum.data}
            xKey="year"
            stackKeys={["BSAI", "GOA"]}
            colors={["#1a3a6b", "#a8331c"]}
            yLabel="fish"
            yFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
          />
        )}
        <div className="data-caption">
          Source: <code>psc_annual_historical</code> · NMFS AKRO · chum salmon · stacked BSAI + GOA mortality counts. GOA reporting starts 2013; BSAI runs the full 1991+ window. 2025–2026 flagged preliminary in source.
        </div>
      </Card>

      <h2 className="h2">Halibut bycatch mortality (directed + non-directed discard), 1980–{halibutBycatch.latestYear ?? "—"}</h2>
      <Card>
        {halibutBycatch.data.length > 0 && (
          <TimeSeriesLine
            data={halibutBycatch.data}
            xKey="year"
            yKey="bycatch_mlb"
            yLabel="million lbs"
            unitSuffix="M lbs"
          />
        )}
        <div className="data-caption">
          Source: <code>iphc_mortality_by_source</code> · coastwide net pounds, IPHC AM · sum of <code>directed_discard</code> + <code>nondirected_discard</code> per year.
        </div>
      </Card>

      <h2 className="h2">Chinook GSI — BSAI pollock bycatch, {chinookGsiLatest.year ?? "—"}</h2>
      <Card>
        {chinookGsiLatest.rows.length > 0 && (
          <SpeciesBar data={chinookGsiLatest.rows} unitLabel="%" color="#2f5d8a" />
        )}
        <div className="data-caption">Source: <code>chinook_gsi</code> · stock attribution mean percentages.</div>
      </Card>

      <h2 className="h2">Chum GSI — BSAI pollock bycatch, {chumGsiLatest.year ?? "—"}</h2>
      <Card>
        {chumGsiLatest.rows.length > 0 && (
          <SpeciesBar data={chumGsiLatest.rows} unitLabel="%" color="#7b6a4f" />
        )}
        <div className="data-caption">Source: <code>chum_gsi</code> · NPFMC C2 Chum Salmon Genetics Report.</div>
      </Card>

      <h2 className="h2">Discard mortality rates by gear</h2>
      <Card>
        {dmr && (
          <Table
            columns={[
              { label: "FMP area" },
              { label: "Gear type" },
              { label: "Species" },
              { label: "DMR", num: true },
              { label: "Effective" },
            ]}
            rows={dmr.map((r) => [
              r.fmp_area,
              r.gear_type,
              r.species,
              `${(r.dmr_value * 100).toFixed(0)}%`,
              r.effective_year_end != null
                ? `${r.effective_year_start}–${r.effective_year_end}`
                : `${r.effective_year_start}–`,
            ])}
            caption="Source: discard_mortality_rates · NMFS / IPHC reference schedule."
          />
        )}
      </Card>
    </>
  );
}
