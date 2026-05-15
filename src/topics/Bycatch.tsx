import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type {
  PscAnnualHistoricalRow,
  IphcSourceMortalityRow,
  ChinookGsiRow,
  ChumGsiRow,
  DiscardMortalityRateRow,
  SalmonCommercialHarvestDataRow,
  SportHarvestDataRow,
  SubsistenceHarvestStatewideRow,
  ChinookDrainageTotalsRow,
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
  const { data: commercial } = useDataset<SalmonCommercialHarvestDataRow>("salmon_commercial_harvest");
  const { data: sport } = useDataset<SportHarvestDataRow>("sport_harvest");
  const { data: subsistence } = useDataset<SubsistenceHarvestStatewideRow>("subsistence_harvest_statewide");
  const { data: escapement } = useDataset<ChinookDrainageTotalsRow>("chinook_drainage_totals");

  // Chinook annual accounting — Alaska statewide, by source.
  // - Bycatch: BSAI + GOA combined (federal-waters PSC mortality).
  // - Commercial / Sport / Subsistence: statewide totals.
  // - Escapement: SUM of chinook_drainage_totals.actual_count by year
  //   (already de-duplicated for drainagewide reconstructions vs tributaries).
  // Series are stacked for magnitude comparison, not because they sum to a
  // strict single denominator (see chart caption).
  const chinookAccounting = useMemo(() => {
    const byYear = new Map<number, { Bycatch: number; Commercial: number; Sport: number; Subsistence: number; Escapement: number }>();
    const bump = (yr: number, key: "Bycatch" | "Commercial" | "Sport" | "Subsistence" | "Escapement", v: number) => {
      if (!Number.isFinite(v) || v <= 0) return;
      const row = byYear.get(yr) ?? { Bycatch: 0, Commercial: 0, Sport: 0, Subsistence: 0, Escapement: 0 };
      row[key] += v;
      byYear.set(yr, row);
    };

    if (psc) {
      for (const r of psc) {
        if (r.species !== "chinook") continue;
        if (r.mortality_count == null) continue;
        bump(r.year, "Bycatch", r.mortality_count);
      }
    }
    if (commercial) {
      for (const r of commercial) {
        if (r.species !== "chinook") continue;
        if (r.harvest_fish == null) continue;
        bump(r.year, "Commercial", r.harvest_fish);
      }
    }
    if (sport) {
      for (const r of sport) {
        if (r.species_name !== "Chinook salmon") continue;
        if (r.record_type !== "harvest") continue; // kept fish only
        if (r.fish_count == null) continue;
        bump(r.year, "Sport", r.fish_count);
      }
    }
    if (subsistence) {
      for (const r of subsistence) {
        if (r.species !== "chinook") continue;
        if (r.harvest_count == null) continue;
        bump(r.year, "Subsistence", r.harvest_count);
      }
    }
    if (escapement) {
      for (const r of escapement) {
        if (r.actual_count == null) continue;
        bump(r.year, "Escapement", r.actual_count);
      }
    }

    const data = [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, v]) => ({ year, ...v }));
    const years = data.map((d) => d.year);
    const range = years.length ? `${years[0]}–${years.at(-1)}` : "";
    return { data, range };
  }, [psc, commercial, sport, subsistence, escapement]);

  // PSC annual — chum stacked BSAI/GOA (unchanged).
  const pscChum = useMemo(() => {
    if (!psc) return { data: [] as Array<Record<string, number>>, range: "" };
    const rows = psc.filter((r) => r.species === "chum");
    const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
    const data = years.map((yr) => ({
      year: yr,
      BSAI: rows.find((r) => r.year === yr && r.region === "BSAI")?.mortality_count ?? 0,
      GOA:  rows.find((r) => r.year === yr && r.region === "GOA")?.mortality_count  ?? 0,
    }));
    const range = years.length ? `${years[0]}–${years.at(-1)}` : "";
    return { data, range };
  }, [psc]);

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

      <h2 className="h2">Chinook annual accounting — Alaska statewide, {chinookAccounting.range}</h2>
      <Card>
        {chinookAccounting.data.length > 0 && (
          <StackedTrend
            data={chinookAccounting.data}
            xKey="year"
            stackKeys={["Bycatch", "Commercial", "Sport", "Subsistence", "Escapement"]}
            colors={["#a8331c", "#1a3a6b", "#6b8fad", "#b45309", "#3a6b3a"]}
            yLabel="fish"
            yFormatter={(v) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
          />
        )}
        <div className="data-caption">
          Sources stacked by year: <code>psc_annual_historical</code> (Bycatch — BSAI + GOA combined chinook mortality, NMFS AKRO), <code>salmon_commercial_harvest</code> (Commercial — statewide directed harvest), <code>sport_harvest</code> (Sport — kept fish, SWHS regions summed statewide), <code>subsistence_harvest_statewide</code> (Subsistence — NPAFC USA/Alaska total), <code>chinook_drainage_totals</code> (Escapement — Mainsail rollup, sum across 19 drainages). Coverage builds up over time: bycatch 1991+, commercial &amp; subsistence 1985+, sport 2005+, escapement starts 1968 (Nushagak) and broadens as more drainages come online. Bycatch is a federal-waters subset; the other four are Alaska statewide. Recent years may be partially-reported (2025 commercial preliminary; sport runs ~18 months in arrears).
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
