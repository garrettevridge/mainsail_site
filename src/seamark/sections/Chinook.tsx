import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type {
  PscAnnualHistoricalRow,
  SalmonCommercialHarvestDataRow,
  SportHarvestDataRow,
  SubsistenceHarvestStatewideRow,
  ChinookDrainageTotalsRow,
  ChinookGsiRow,
} from "../../api/types";
import ChartCard from "../ChartCard";
import { StackedBar, Legend } from "../SmChart";
import { SERIES } from "../colors";

const SOURCE_KEYS = ["Pollock bycatch", "Commercial", "Sport", "Subsistence", "Escapement"] as const;
const BYAREA_KEYS = ["BSAI", "GOA"] as const;

export default function Chinook() {
  const { data: psc } = useDataset<PscAnnualHistoricalRow>("psc_annual_historical");
  const { data: commercial } = useDataset<SalmonCommercialHarvestDataRow>("salmon_commercial_harvest");
  const { data: sport } = useDataset<SportHarvestDataRow>("sport_harvest");
  const { data: subsistence } = useDataset<SubsistenceHarvestStatewideRow>("subsistence_harvest_statewide");
  const { data: drainage } = useDataset<ChinookDrainageTotalsRow>("chinook_drainage_totals");
  const { data: gsi } = useDataset<ChinookGsiRow>("chinook_gsi");

  const byAreaData = useMemo(() => {
    if (!psc) return [];
    const byYear = new Map<number, Record<string, number>>();
    for (const r of psc) {
      if (r.species !== "chinook") continue;
      if (r.mortality_count == null) continue;
      const row = byYear.get(r.year) ?? { year: r.year };
      row[r.region] = (row[r.region] ?? 0) + r.mortality_count;
      byYear.set(r.year, row);
    }
    return [...byYear.values()].sort((a, b) => (a.year as number) - (b.year as number));
  }, [psc]);

  const accountingData = useMemo(() => {
    const byYear = new Map<number, Record<string, number>>();
    const bump = (yr: number, k: string, v: number) => {
      if (!Number.isFinite(v) || v <= 0) return;
      const row = byYear.get(yr) ?? { year: yr };
      row[k] = (row[k] ?? 0) + v;
      byYear.set(yr, row);
    };
    if (psc) for (const r of psc) {
      if (r.species === "chinook" && r.mortality_count != null) bump(r.year, "Pollock bycatch", r.mortality_count);
    }
    if (commercial) for (const r of commercial) {
      if (r.species === "chinook" && r.harvest_fish != null) bump(r.year, "Commercial", r.harvest_fish);
    }
    if (sport) for (const r of sport) {
      if (r.species_name === "Chinook salmon" && r.record_type === "harvest" && r.fish_count != null)
        bump(r.year, "Sport", r.fish_count);
    }
    if (subsistence) for (const r of subsistence) {
      if (r.species === "chinook" && r.harvest_count != null) bump(r.year, "Subsistence", r.harvest_count);
    }
    if (drainage) for (const r of drainage) {
      if (r.actual_count != null) bump(r.year, "Escapement", r.actual_count);
    }
    return [...byYear.values()].sort((a, b) => (a.year as number) - (b.year as number));
  }, [psc, commercial, sport, subsistence, drainage]);

  const gsiLatest = useMemo(() => {
    if (!gsi || gsi.length === 0) return { year: null as number | null, rows: [] as ChinookGsiRow[] };
    const year = Math.max(...gsi.map((r) => r.year));
    const rows = gsi.filter((r) => r.year === year).sort((a, b) => b.mean_pct - a.mean_pct);
    return { year, rows };
  }, [gsi]);

  const gsiChartData = useMemo(
    () => gsiLatest.rows.map((r) => ({ region: r.region, share: r.mean_pct })),
    [gsiLatest]
  );

  return (
    <section id="chinook" className="sm-section">
      <div className="sm-marker">
        <span className="num">Chinook bycatch</span>
        <span className="title">BSAI and Gulf of Alaska</span>
      </div>

      <ChartCard
        label="Fig · Chinook bycatch · 1991–present"
        source="NOAA AKR Catch Accounting · NPFMC"
        title="Chinook bycatch in groundfish fisheries, BSAI + GOA, by year."
        height="tall"
        caption={
          <>
            Stacked bars by year and FMP area. Hard cap for BSAI Chinook in
            the pollock trawl fishery is 60,000 fish; recent BSAI Chinook
            bycatch has run well below the cap. Earlier years reflect the
            pre-cap regulatory environment (PSC limit introduced via
            Amendment 91, 2011).
          </>
        }
      >
        {byAreaData.length > 0 ? (
          <>
            <StackedBar
              data={byAreaData}
              xKey="year"
              keys={[...BYAREA_KEYS]}
              height={360}
              yFormatter={(v) => v.toLocaleString()}
            />
            <Legend
              items={BYAREA_KEYS.map((k, i) => ({ label: k, color: SERIES[i] }))}
            />
          </>
        ) : (
          <div className="sm-chart-body placeholder tall">Loading…</div>
        )}
      </ChartCard>

      <ChartCard
        label="Fig · total Chinook removals & escapement"
        source="NMFS PSC · ADF&G commercial · ADF&G SWHS · NPAFC subsistence · Mainsail drainage rollup"
        title="Total Chinook accounting across Alaska, by source, by year."
        height="tall"
        caption={
          <>
            Stacked bars by year: commercial harvest (statewide), sport
            harvest (kept fish), subsistence (statewide), pollock bycatch
            (BSAI + GOA), counted in-river escapement (sum across canonical
            drainages). Series begin where their record begins, so the stack
            grows toward the present as datasets come online. The visual
            point: bycatch is one column in a tall stack.
          </>
        }
      >
        {accountingData.length > 0 ? (
          <>
            <StackedBar
              data={accountingData}
              xKey="year"
              keys={[...SOURCE_KEYS]}
              height={360}
              yFormatter={(v) => v.toLocaleString()}
            />
            <Legend
              items={SOURCE_KEYS.map((k, i) => ({ label: k, color: SERIES[i] }))}
            />
          </>
        ) : (
          <div className="sm-chart-body placeholder tall">Loading…</div>
        )}
      </ChartCard>

      <div className="sm-grid-2">
          <ChartCard
            label={`Stock composition · ${gsiLatest.year ?? "—"}`}
            source="NOAA Genetics"
            title={`BSAI Chinook bycatch — stock of origin, ${gsiLatest.year ?? ""}.`}
            height="short"
            caption={
              <>
                Single-year snapshot ({gsiLatest.year}). The published genetic
                stock-of-origin time series is sparse; longer multi-year
                series are pending publication.
              </>
            }
          >
            {gsiChartData.length > 0 ? (
              <>
                <StackedBar
                  data={gsiChartData}
                  xKey="region"
                  keys={["share"]}
                  height={200}
                  yFormatter={(v) => `${v.toFixed(0)}%`}
                />
              </>
            ) : (
              <div className="sm-chart-body placeholder short">Loading…</div>
            )}
          </ChartCard>

          <ChartCard
            label="Time series · regional"
            source="NOAA AKR + Genetics"
            title="Annual BSAI Chinook bycatch attributable to Western AK origins."
            height="short"
            caption={
              <>
                Single line: estimated Coastal Western AK origin bycatch in
                numbers of fish, by year since 2011. Requires per-year GSI ×
                per-year BSAI bycatch — multi-year genetics not yet wired.
              </>
            }
          >
            <div className="sm-chart-body placeholder short">
              Awaiting multi-year GSI dataset
            </div>
          </ChartCard>
      </div>
    </section>
  );
}
