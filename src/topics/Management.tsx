import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type {
  TacSpecsRow,
  StockAssessmentBiomassRow,
  IphcTceyDataRow,
  EscapementGoalsHistoryRow,
} from "../api/types";
import { Card, Table } from "../components/primitives";
import MultiLineTrend from "../components/charts/MultiLineTrend";
import StackedTrend from "../components/charts/StackedTrend";
import SpeciesBar from "../components/charts/SpeciesBar";

type SalmonRunForecastRow = {
  year: number;
  region: string;
  region_label: string;
  species: string;
  forecast_fish: number | null;
  actual_fish: number | null;
};

export default function Management() {
  const { data: tac } = useDataset<TacSpecsRow>("tac_specs");
  const { data: tcey } = useDataset<IphcTceyDataRow>("iphc_tcey");
  const { data: sab } = useDataset<StockAssessmentBiomassRow>("stock_assessment_biomass");
  const { data: goals } = useDataset<EscapementGoalsHistoryRow>("escapement_goals_history");
  const { data: fcs } = useDataset<SalmonRunForecastRow>("salmon_run_forecasts");

  // TAC by FMP area over time
  const tacTrend = useMemo(() => {
    if (!tac) return { data: [], keys: [] as string[] };
    const years = [...new Set(tac.map((r) => r.year))].sort((a, b) => a - b);
    const areas = [...new Set(tac.map((r) => r.fmp_area).filter(Boolean))] as string[];
    const data = years.map((yr) => {
      const point: Record<string, number | string> = { year: yr };
      for (const a of areas) {
        point[a] = tac
          .filter((r) => r.year === yr && r.fmp_area === a)
          .reduce((s, r) => s + (r.tac_mt ?? 0), 0) / 1000;
      }
      return point;
    });
    return { data, keys: areas };
  }, [tac]);

  // Latest year TAC by species complex
  const tacBySpecies = useMemo(() => {
    if (!tac) return { rows: [], year: null as number | null };
    const finals = tac.filter((r) => (r.tac_mt ?? 0) > 0);
    if (!finals.length) return { rows: [], year: null };
    const year = Math.max(...finals.map((r) => r.year));
    const totals = new Map<string, number>();
    for (const r of tac) {
      if (r.year !== year || (r.tac_mt ?? 0) <= 0) continue;
      totals.set(r.species_complex, (totals.get(r.species_complex) ?? 0) + (r.tac_mt ?? 0));
    }
    const rows = [...totals.entries()]
      .map(([species, mt]) => ({ species, value: mt / 1000 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
    return { rows, year };
  }, [tac]);

  // IPHC TCEY by area over time — adopted catch limits, excluding "Total"
  const tceySeries = useMemo(() => {
    if (!tcey) return { data: [], keys: [] as string[] };
    const limits = tcey.filter(
      (r) => r.tcey_type === "adopted" && r.tcey_mlb != null && r.area !== "Total",
    );
    const years = [...new Set(limits.map((r) => r.year))].sort((a, b) => a - b);
    const areas = [...new Set(limits.map((r) => r.area))];
    const data = years.map((yr) => {
      const point: Record<string, number | string> = { year: yr };
      for (const a of areas) {
        const row = limits.find((r) => r.year === yr && r.area === a);
        point[a] = row?.tcey_mlb ?? 0;
      }
      return point;
    });
    return { data, keys: areas };
  }, [tcey]);

  // Stock assessment biomass — top species complexes
  const sabSeries = useMemo(() => {
    if (!sab) return { data: [], keys: [] as string[] };
    const valid = sab.filter((r) => r.total_biomass_kt != null);
    const complexes = [...new Set(valid.map((r) => r.species_complex))];
    const years = [...new Set(valid.map((r) => r.year))].sort((a, b) => a - b);
    const data = years.map((yr) => {
      const point: Record<string, number | string> = { year: yr };
      for (const c of complexes) {
        const row = valid.find((r) => r.year === yr && r.species_complex === c);
        if (row?.total_biomass_kt != null) point[c] = row.total_biomass_kt;
      }
      return point;
    });
    return { data, keys: complexes };
  }, [sab]);

  return (
    <>
      <h1 className="page-title">Management</h1>

      <h2 className="h2">Federal groundfish TAC by FMP area</h2>
      <Card>
        {tacTrend.data.length > 0 && (
          <StackedTrend
            data={tacTrend.data}
            xKey="year"
            stackKeys={tacTrend.keys}
            yLabel="thousand mt"
            yFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}M` : `${v.toFixed(0)}k`}
          />
        )}
        <div className="data-caption">Source: <code>tac_specs</code> · NMFS AKRO annual catch specifications.</div>
      </Card>

      <h2 className="h2">TAC by species complex, {tacBySpecies.year ?? "—"} (top 12)</h2>
      <Card>
        {tacBySpecies.rows.length > 0 && (
          <SpeciesBar data={tacBySpecies.rows} unitLabel="k mt" color="#2f5d8a" />
        )}
        <div className="data-caption">Source: <code>tac_specs</code> · thousand metric tons.</div>
      </Card>

      <h2 className="h2">IPHC TCEY (adopted) by regulatory area</h2>
      <Card>
        {tceySeries.data.length > 0 && (
          <MultiLineTrend
            data={tceySeries.data}
            xKey="year"
            seriesKeys={tceySeries.keys}
            yLabel="million lbs"
            unitSuffix="M lbs"
          />
        )}
        <div className="data-caption">Source: <code>iphc_tcey</code> · tcey_type = adopted · IPHC AM, regulatory areas 2A–4CDE.</div>
      </Card>

      <h2 className="h2">Stock assessment total biomass by species complex</h2>
      <Card>
        {sabSeries.data.length > 0 && (
          <MultiLineTrend
            data={sabSeries.data}
            xKey="year"
            seriesKeys={sabSeries.keys}
            yLabel="thousand mt"
            unitSuffix="k mt"
          />
        )}
        <div className="data-caption">Source: <code>stock_assessment_biomass</code> · NMFS/AFSC SAFE reports.</div>
      </Card>

      <h2 className="h2">Salmon run forecasts vs. actuals</h2>
      <Card>
        {fcs && (
          <Table
            columns={[
              { label: "Year", yr: true },
              { label: "Region" },
              { label: "Species" },
              { label: "Forecast", num: true },
              { label: "Actual", num: true },
            ]}
            rows={[...fcs]
              .sort((a, b) => (b.year - a.year) || a.region.localeCompare(b.region))
              .map((r) => [
                r.year,
                r.region_label,
                r.species,
                r.forecast_fish != null ? r.forecast_fish.toLocaleString() : "—",
                r.actual_fish != null ? r.actual_fish.toLocaleString() : "—",
              ])}
            caption="Source: salmon_run_forecasts · ADF&G."
          />
        )}
      </Card>

      <h2 className="h2">Escapement goals history</h2>
      <Card>
        {goals && (
          <Table
            columns={[
              { label: "System" },
              { label: "Species" },
              { label: "Goal type" },
              { label: "Effective" },
              { label: "Lower", num: true },
              { label: "Upper", num: true },
            ]}
            rows={[...goals]
              .sort((a, b) => a.system_name.localeCompare(b.system_name))
              .map((r) => [
                r.system_name,
                r.species,
                r.goal_type ?? "—",
                r.effective_year_end == null
                  ? `${r.effective_year_start}–`
                  : `${r.effective_year_start}–${r.effective_year_end}`,
                r.goal_lower != null ? r.goal_lower.toLocaleString() : "—",
                r.goal_upper != null ? r.goal_upper.toLocaleString() : "—",
              ])}
            caption="Source: escapement_goals_history · ADF&G."
          />
        )}
      </Card>
    </>
  );
}
