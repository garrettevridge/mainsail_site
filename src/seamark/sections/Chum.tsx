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
        <span className="num">03b / Chum</span>
        <span className="title">BSAI pollock trawl chum bycatch</span>
      </div>

      <h2 className="sm-h2">
        Chum salmon bycatch — <span className="accent">a different story.</span>
      </h2>

      <div className="sm-placeholder">
        <span className="cap">Prose — chum bycatch overview</span>
        <span className="body">
          Chum bycatch in the BSAI pollock fishery is far more variable
          year-to-year than Chinook, often ranging from under 100,000 to
          several hundred thousand fish. Present the time series, note the
          variability, and explain why: chum overlap with pollock varies by
          water temperature, run timing, and seasonal distribution. The
          political stakes are different than Chinook — but the data
          presentation should be just as rigorous.
        </span>
      </div>

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
        <h4>Where chum bycatch comes from — and why it's mostly not Western Alaska.</h4>
        <p>
          This is the most counterintuitive finding in the paper, and it has
          to be presented carefully. Chum genetic sampling for the BSAI
          pollock bycatch shows the catch is dominated by Asian and Pacific
          Northwest hatchery stock — NE Asia, SE Asia, and Eastern GOA / PNW
          together account for the great majority. Western Alaska accounts
          for a small single-digit share; Upper and Middle Yukon add another
          small share. This matters because chum bycatch reductions do not
          translate one-to-one into Western Alaska escapement: most of the
          impact is on hatchery stocks originating elsewhere in the Pacific.
          The data does not minimize legitimate Western Alaska concern, but
          it does narrow the set of policy levers that would meaningfully
          change Western Alaska outcomes.
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
