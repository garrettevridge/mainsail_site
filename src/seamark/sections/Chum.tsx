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

      <ChartCard
        label="Fig · chum bycatch · 1991–present"
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

      <ChartCard
        label={`Fig · stock of origin · ${gsiLatest.year ?? "—"}`}
        source="NOAA Genetics (BSAI B-season, NPFMC C2 chum report)"
        title={`BSAI chum bycatch — stock of origin, ${gsiLatest.year ?? ""}.`}
        height="short"
        caption={
          <>
            Single-year snapshot ({gsiLatest.year}, BSAI B-season), percent by
            region. Multi-year genetic series pending publication.
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
    </section>
  );
}
