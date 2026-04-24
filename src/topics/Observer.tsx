import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type { MonitoredCatchRow } from "../api/types";
import { Card, Crumb, Note, Table } from "../components/primitives";
import MultiLineTrend from "../components/charts/MultiLineTrend";

// Compact sector labels for legend readability
const SECTOR_LABELS: Record<string, string> = {
  "Catcher/Processor":             "Catcher/Processor",
  "Catcher Vessel":                "Catcher Vessel",
  "Catcher Vessel: AFA":           "CV (AFA pollock)",
  "Catcher Vessel: PCTC":          "CV (PCTC cod)",
  "Catcher Vessel: Rockfish Program": "CV (Rockfish Program)",
  "Mothership":                    "Mothership",
};

const SECTOR_COLORS = [
  "#1a2332", "#2f5d8a", "#6b8fad", "#b45309", "#7b6a4f", "#a8a29e",
];

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 1 });

export default function Observer() {
  const { data, isLoading, error } = useDataset<MonitoredCatchRow>(
    "monitored_catch"
  );

  // Coverage rate by sector/year: sum(Monitored or Observed) / sum(Total)
  const coverageTrend = useMemo(() => {
    if (!data) return { chartData: [], sectors: [] };

    const monitored = new Map<string, number>();
    const total = new Map<string, number>();

    for (const r of data) {
      const key = `${r.year}|${r.sector}`;
      const mt = r.metric_tons ?? 0;
      if (r.monitored_or_total === "Monitored" || r.monitored_or_total === "Observed") {
        monitored.set(key, (monitored.get(key) ?? 0) + mt);
      } else if (r.monitored_or_total === "Total") {
        total.set(key, (total.get(key) ?? 0) + mt);
      }
    }

    const sectors = [...new Set(data.map((r) => r.sector))].sort();
    const years = [...new Set(data.map((r) => r.year))].sort((a, b) => a - b);

    const chartData = years.map((yr) => {
      const point: Record<string, number | string> = { year: yr };
      for (const sec of sectors) {
        const key = `${yr}|${sec}`;
        const mon = monitored.get(key) ?? 0;
        const tot = total.get(key) ?? 0;
        const label = SECTOR_LABELS[sec] ?? sec;
        point[label] = tot > 0 ? Math.min(100, Math.round((mon / tot) * 100)) : 0;
      }
      return point;
    });

    return {
      chartData,
      sectors: sectors.map((s) => SECTOR_LABELS[s] ?? s),
    };
  }, [data]);

  // 2024 coverage summary table
  const summaryTable = useMemo(() => {
    if (!data) return [];
    const maxYear = Math.max(...data.map((r) => r.year));
    const sectors = [...new Set(data.filter((r) => r.year === maxYear).map((r) => r.sector))].sort();

    return sectors.map((sec) => {
      const rows = data.filter((r) => r.year === maxYear && r.sector === sec);
      const mon = rows
        .filter((r) => r.monitored_or_total === "Monitored" || r.monitored_or_total === "Observed")
        .reduce((s, r) => s + (r.metric_tons ?? 0), 0);
      const tot = rows
        .filter((r) => r.monitored_or_total === "Total")
        .reduce((s, r) => s + (r.metric_tons ?? 0), 0);
      const rate = tot > 0 ? Math.min(100, (mon / tot) * 100) : 0;
      return [
        SECTOR_LABELS[sec] ?? sec,
        `${fmt(mon)} mt`,
        `${fmt(tot)} mt`,
        `${rate.toFixed(1)}%`,
        String(maxYear),
      ];
    });
  }, [data]);

  const maxYear = data?.length ? Math.max(...data.map((r) => r.year)) : null;

  return (
    <>
      <Crumb topic="Observer Coverage" />
      <h1 className="page-title">Observer Coverage</h1>
      <p className="page-lede first-sentence">
        The catch limits set each year are only as credible as the data that
        feeds them — and in Alaska, that data comes from human observers and
        electronic monitoring devices placed directly on fishing vessels.
        Observers sample what was caught, what was kept, and what was
        discarded; their numbers are extrapolated to the parts of the fleet
        not monitored in real time.
      </p>
      <p className="page-lede">
        The North Pacific Observer Program operates on two tiers.{" "}
        <b>Full coverage</b> sectors — BSAI pollock catcher-processors,
        motherships, Amendment 80 bottom trawl — carry observers on every
        trip, sometimes two per vessel, producing coverage rates at or near
        100%. <b>Partial coverage</b> sectors — halibut and sablefish IFQ
        longline, smaller trawl catcher-vessels — are sampled through
        stratified random selection, with rates set each year in a public
        Annual Deployment Plan.
      </p>
      <p className="page-lede">
        The system as it exists today dates to a <b>2013 restructure</b> that
        ended length-based, pay-as-you-go deployment. Partial-coverage vessels
        now pay into a pooled observer funding system; deployment is
        randomized. Since then, electronic monitoring has been introduced as
        an alternative in several fixed-gear partial-coverage categories.
      </p>

      {isLoading && <p className="section-intro">Loading observer coverage data…</p>}
      {error && <Note>Could not load monitored catch data from S3.</Note>}

      {data && (
        <>
          <Note>
            <b>Coverage calculation.</b> Shown rates are metric tons monitored
            ÷ total metric tons, by sector. Full-coverage sectors approach
            100%; partial-coverage sectors reflect the deployment plan rate.
            The 2013 restructure is the first year in this dataset.
          </Note>

          <h2 className="h2">Monitoring coverage by sector, 2013–{maxYear}</h2>
          <p className="section-intro">
            Coverage rate (monitored metric tons ÷ total metric tons) by
            fleet sector. AFA pollock catcher-vessels and
            Catcher/Processors operate under full-coverage requirements.
          </p>
          <Card>
            <MultiLineTrend
              data={coverageTrend.chartData}
              xKey="year"
              seriesKeys={coverageTrend.sectors}
              colors={SECTOR_COLORS}
              title="Observer/EM coverage rate by sector — BSAI + GOA combined"
              yLabel="coverage %"
              unitSuffix="%"
            />
          </Card>

          {maxYear != null && (
            <>
              <h2 className="h2">{maxYear} coverage by sector</h2>
              <p className="section-intro">
                Monitored metric tons, total metric tons, and derived coverage
                rate for the most recent complete year.
              </p>
              <Card>
                <Table
                  columns={[
                    { label: "Sector" },
                    { label: "Monitored catch", num: true },
                    { label: "Total catch", num: true },
                    { label: "Coverage rate", num: true },
                    { label: "Year", yr: true },
                  ]}
                  rows={summaryTable}
                  caption={`Source: NMFS AKRO monitored catch tables via Mainsail monitored_catch, year ${maxYear}`}
                />
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
}
