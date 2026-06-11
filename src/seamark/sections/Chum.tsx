import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type {
  PscAnnualHistoricalRow,
  ChumGsiRow,
} from "../../api/types";
import ChartCard from "../ChartCard";
import { StackedBar, Legend } from "../SmChart";
import { SERIES } from "../colors";

const BYAREA_KEYS = ["BSAI", "GOA"] as const;

export default function Chum() {
  const { data: psc } = useDataset<PscAnnualHistoricalRow>("psc_annual_historical");
  const { data: gsi } = useDataset<ChumGsiRow>("chum_gsi");

  const byAreaData = useMemo(() => {
    if (!psc) return [];
    const byYear = new Map<number, Record<string, number>>();
    for (const r of psc) {
      if (r.species !== "chum") continue;
      if (r.mortality_count == null) continue;
      const row = byYear.get(r.year) ?? { year: r.year };
      row[r.region] = (row[r.region] ?? 0) + r.mortality_count;
      byYear.set(r.year, row);
    }
    return [...byYear.values()].sort((a, b) => (a.year as number) - (b.year as number));
  }, [psc]);

  // BSAI vs GOA chum bycatch, recent-decade average and range — for the prose.
  const chumStats = useMemo(() => {
    if (!psc) return null;
    const bsai: Record<number, number> = {};
    const goa: Record<number, number> = {};
    for (const r of psc) {
      if (r.species !== "chum" || r.mortality_count == null) continue;
      if (r.region === "BSAI") bsai[r.year] = (bsai[r.year] ?? 0) + r.mortality_count;
      else if (r.region === "GOA") goa[r.year] = (goa[r.year] ?? 0) + r.mortality_count;
    }
    const yrs = Object.keys(bsai).map(Number);
    if (yrs.length === 0) return null;
    const maxYr = Math.max(...yrs);
    const window = yrs.filter((y) => y > maxYr - 10);
    const bVals = window.map((y) => bsai[y]);
    const gVals = window.map((y) => goa[y] ?? 0);
    const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
    return {
      bsaiAvg: Math.round(mean(bVals)),
      bsaiLo: Math.min(...bVals),
      bsaiHi: Math.max(...bVals),
      goaAvg: Math.round(mean(gVals)),
      years: `${Math.min(...window)}–${maxYr}`,
    };
  }, [psc]);

  const gsiLatest = useMemo(() => {
    if (!gsi || gsi.length === 0) return { year: null as number | null, rows: [] as ChumGsiRow[] };
    const year = Math.max(...gsi.map((r) => r.year));
    const rows = gsi
      .filter((r) => r.year === year && r.fmp_area === "BSAI")
      .sort((a, b) => b.mean_pct - a.mean_pct);
    return { year, rows };
  }, [gsi]);

  return (
    <section id="chum" className="sm-section">
      <div className="sm-marker">
        <span className="num">Chum bycatch</span>
        <span className="title">BSAI pollock trawl</span>
      </div>

      <h2 className="sm-h2">
        Chum salmon bycatch — <span className="accent">a different story.</span>
      </h2>

      <p className="sm-p">
        The pollock fishery takes far more chum than Chinook. Over the past
        decade the Bering Sea fishery has averaged about{" "}
        {chumStats ? `${chumStats.bsaiAvg.toLocaleString()} chum a year` : "a few hundred thousand chum a year"}
        , with enormous year-to-year swings — from{" "}
        {chumStats
          ? `${chumStats.bsaiLo.toLocaleString()} in the lightest year to ${chumStats.bsaiHi.toLocaleString()} in the heaviest`
          : "tens of thousands to several hundred thousand"}
        . The Gulf of Alaska take is far smaller, averaging on the order of{" "}
        {chumStats ? chumStats.goaAvg.toLocaleString() : "a few thousand"} fish.
        Most of the Bering Sea catch comes in the summer &quot;B season&quot;; how
        much chum overlaps the fleet depends on water temperature and run timing,
        which is why the annual numbers are so volatile.
      </p>

      <p className="sm-p">
        Where the chum bycatch originates is shown by genetic stock-of-origin
        sampling, summarized in the case study below.
      </p>

      <ChartCard
        label="Fig 3.3 · primary · 1991–present"
        source="NOAA AKR Catch Accounting"
        title="Chum bycatch in groundfish fisheries, by year and area."
        height="tall"
        caption={
          <>
            Stacked bars by year and FMP area (BSAI + GOA). GOA chum series
            begins 2013; BSAI series runs the full record. Note the
            year-to-year variability — chum bycatch is far more sensitive to
            run timing and ocean conditions than Chinook.
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

      <div className="sm-case">
        <div className="sm-case-label">Case study · genetics</div>
        <h4>Where chum bycatch comes from: stock of origin.</h4>
        <p>
          Genetic sampling of the BSAI pollock chum bycatch shows the catch is
          dominated by Asian and Pacific Northwest hatchery stock — Northeast
          Asia, Southeast Asia, and Eastern Gulf of Alaska / Pacific Northwest
          together account for the great majority. Western Alaska accounts for a
          small single-digit share; Upper and Middle Yukon add another small
          share. Because most of the bycatch originates outside Western Alaska, a
          reduction in chum bycatch does not translate one-to-one into Western
          Alaska escapement.
        </p>

        <ChartCard
          label={`Stock composition · ${gsiLatest.year ?? "—"}`}
          source="NOAA Genetics (BSAI B-season, NPFMC C2 chum report)"
          title={`BSAI chum bycatch — stock of origin, ${gsiLatest.year ?? ""}.`}
          height="short"
          caption={
            <>
              Single-year snapshot ({gsiLatest.year}, BSAI B-season). The
              published genetic stock-of-origin time series is sparse;
              multi-year series are pending publication.
            </>
          }
        >
          {gsiLatest.rows.length > 0 ? (
            <StackedBar
              data={gsiLatest.rows.map((r) => ({ region: r.region, share: r.mean_pct }))}
              xKey="region"
              keys={["share"]}
              height={220}
              yFormatter={(v) => `${v.toFixed(1)}%`}
            />
          ) : (
            <div className="sm-chart-body placeholder short">Loading…</div>
          )}
        </ChartCard>
      </div>
    </section>
  );
}
