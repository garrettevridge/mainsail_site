import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type { MonitoredCatchRow } from "../api/types";
import { Card, Crumb, DataContext, Note, StatGrid, Table } from "../components/primitives";

const SECTOR_LABELS: Record<string, string> = {
  "Catcher/Processor":               "Catcher/Processor",
  "Catcher Vessel":                  "Catcher Vessel",
  "Catcher Vessel: AFA":             "CV (AFA pollock)",
  "Catcher Vessel: PCTC":            "CV (PCTC cod)",
  "Catcher Vessel: Rockfish Program":"CV (Rockfish Program)",
  "Mothership":                      "Mothership",
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 1 });

export default function Observer() {
  const { data, isLoading, error } = useDataset<MonitoredCatchRow>("monitored_catch");

  const maxYear = useMemo(
    () => (data?.length ? Math.max(...data.map((r) => r.year)) : null),
    [data]
  );

  // Latest year coverage by sector — combined across both FMP areas
  const summaryTable = useMemo(() => {
    if (!data || maxYear == null) return [];
    const sectors = [...new Set(data.filter((r) => r.year === maxYear).map((r) => r.sector))].sort();
    return sectors.map((sec) => {
      const rows = data.filter((r) => r.year === maxYear && r.sector === sec);
      const mon = rows.filter((r) => r.monitored_or_total === "Monitored" || r.monitored_or_total === "Observed").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
      const tot = rows.filter((r) => r.monitored_or_total === "Total").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
      const rate = tot > 0 ? Math.min(100, (mon / tot) * 100) : 0;
      return ["BSAI + GOA", SECTOR_LABELS[sec] ?? sec, `${fmt(mon)} mt`, `${fmt(tot)} mt`, `${rate.toFixed(1)}%`];
    });
  }, [data, maxYear]);

  // Coverage by gear type (latest year) — combined across both FMP areas
  const gearTable = useMemo(() => {
    if (!data || maxYear == null) return [];
    const gears = [...new Set(data.filter((r) => r.year === maxYear).map((r) => r.gear))].sort();
    return gears
      .map((gear) => {
        const rows = data.filter((r) => r.year === maxYear && r.gear === gear);
        const mon = rows.filter((r) => r.monitored_or_total === "Monitored" || r.monitored_or_total === "Observed").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
        const tot = rows.filter((r) => r.monitored_or_total === "Total").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
        const rate = tot > 0 ? Math.min(100, (mon / tot) * 100) : 0;
        return { gear, mon, tot, rate };
      })
      .filter((r) => r.tot > 0)
      .sort((a, b) => b.tot - a.tot)
      .map((r) => ["BSAI + GOA", r.gear, `${fmt(r.mon)} mt`, `${fmt(r.tot)} mt`, `${r.rate.toFixed(1)}%`]);
  }, [data, maxYear]);

  // Per-FMP-area coverage rate breakdown (latest year)
  const byFmpAreaCoverage = useMemo(() => {
    if (!data || maxYear == null) return [];
    const areas = [...new Set(data.filter((r) => r.year === maxYear).map((r) => r.fmp_area))].sort();
    return areas.map((area) => {
      const rows = data.filter((r) => r.year === maxYear && r.fmp_area === area);
      const mon = rows.filter((r) => r.monitored_or_total === "Monitored" || r.monitored_or_total === "Observed").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
      const tot = rows.filter((r) => r.monitored_or_total === "Total").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
      const rate = tot > 0 ? Math.min(100, (mon / tot) * 100) : 0;
      return [area, `${fmt(mon)} mt`, `${fmt(tot)} mt`, `${rate.toFixed(1)}%`];
    });
  }, [data, maxYear]);

  // Overall coverage stats
  const overallStats = useMemo(() => {
    if (!data || maxYear == null) return null;
    const rows = data.filter((r) => r.year === maxYear);
    const mon = rows.filter((r) => r.monitored_or_total === "Monitored" || r.monitored_or_total === "Observed").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
    const tot = rows.filter((r) => r.monitored_or_total === "Total").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
    return { mon, tot, rate: tot > 0 ? (mon / tot) * 100 : 0 };
  }, [data, maxYear]);

  return (
    <>
      <Crumb topic="Observer Coverage" />
      <h1 className="page-title">Observer Coverage</h1>

      <DataContext
        use={[
          "monitored_catch — NMFS AKRO monitored catch by sector, gear, FMP area",
        ]}
        could={[
          "observer_deployments — individual deployment records (vessel, dates, area)",
          "em_review_rates — electronic monitoring review rates by vessel class",
          "observer_costs — at-sea observer cost reimbursement data",
          "bycatch_rates — PSC rate per unit of target catch by gear/area",
        ]}
        ideas={[
          "Coverage rate trend by gear type (trawl vs. longline vs. pot)",
          "EM vs. at-sea observer comparison since 2020 rollout",
          "Coverage gap map: vessels under threshold by port",
          "Discard rate vs. coverage rate correlation",
        ]}
      />

      {isLoading && <p className="section-intro">Loading observer coverage data…</p>}
      {error && <Note>Could not load monitored catch data from S3.</Note>}

      {data && overallStats && (
        <>
          <StatGrid
            stats={[
              {
                val: `${fmt(overallStats.mon)} mt`,
                label: `Monitored catch, ${maxYear}`,
                sub: "BSAI + GOA, all sectors",
                accent: "accent",
              },
              {
                val: `${fmt(overallStats.tot)} mt`,
                label: `Total catch, ${maxYear}`,
                sub: "BSAI + GOA, all sectors",
              },
              {
                val: `${overallStats.rate.toFixed(1)}%`,
                label: `Overall coverage rate, ${maxYear}`,
                sub: "Monitored ÷ total metric tons",
              },
              {
                val: String(maxYear),
                label: "Most recent year in dataset",
                sub: "2013 restructure is first year",
              },
            ]}
          />

          <Note>
            <b>How to read these tables.</b> "Monitored" is metric tons of catch
            attributed to vessels under at-sea observer or electronic monitoring
            coverage; "Total" is the fleetwide catch estimate. Coverage rate is
            Monitored ÷ Total. NMFS publishes these as separate row classes
            (<code>monitored_or_total</code>) in the Catch Accounting System, so
            the rate is a direct ratio of two reported quantities — not an
            extrapolation. Rates can exceed 100% in small sectors when reported
            monitored tons round above the corresponding total estimate; values
            shown are clamped at 100%. Tables labeled "BSAI + GOA" aggregate
            both Federal management areas; the per-FMP-area table below
            disaggregates the coverage rate.
          </Note>

          {maxYear != null && (
            <>
              <h2 className="h2">{maxYear} coverage by FMP area — Federal groundfish</h2>
              <Card>
                <Table
                  columns={[
                    { label: "FMP area" },
                    { label: "Monitored (mt)", num: true },
                    { label: "Total catch (mt)", num: true },
                    { label: "Coverage rate (%)", num: true },
                  ]}
                  rows={byFmpAreaCoverage}
                  caption={`Region: BSAI and GOA, disaggregated. Source: Seamark Analytics, derived from NMFS AKRO Catch Accounting System monitored catch tables, year ${maxYear}.`}
                />
              </Card>

              <h2 className="h2">{maxYear} coverage by sector — BSAI + GOA federal groundfish (combined)</h2>
              <Card>
                <Table
                  columns={[
                    { label: "Region" },
                    { label: "Sector" },
                    { label: "Monitored (mt)", num: true },
                    { label: "Total catch (mt)", num: true },
                    { label: "Coverage rate (%)", num: true },
                  ]}
                  rows={summaryTable}
                  caption={`Region: BSAI and GOA combined. Source: Seamark Analytics, derived from NMFS AKRO Catch Accounting System monitored catch tables, year ${maxYear}.`}
                />
              </Card>

              <h2 className="h2">{maxYear} coverage by gear type — BSAI + GOA federal groundfish (combined)</h2>
              <Card>
                <Table
                  columns={[
                    { label: "Region" },
                    { label: "Gear" },
                    { label: "Monitored (mt)", num: true },
                    { label: "Total catch (mt)", num: true },
                    { label: "Coverage rate (%)", num: true },
                  ]}
                  rows={gearTable}
                  caption={`Region: BSAI and GOA combined. Source: Seamark Analytics, derived from NMFS AKRO Catch Accounting System monitored catch tables, year ${maxYear}.`}
                />
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
}
