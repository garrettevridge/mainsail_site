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

  // Latest year coverage by sector
  const summaryTable = useMemo(() => {
    if (!data || maxYear == null) return [];
    const sectors = [...new Set(data.filter((r) => r.year === maxYear).map((r) => r.sector))].sort();
    return sectors.map((sec) => {
      const rows = data.filter((r) => r.year === maxYear && r.sector === sec);
      const mon = rows.filter((r) => r.monitored_or_total === "Monitored" || r.monitored_or_total === "Observed").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
      const tot = rows.filter((r) => r.monitored_or_total === "Total").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
      const rate = tot > 0 ? Math.min(100, (mon / tot) * 100) : 0;
      return [SECTOR_LABELS[sec] ?? sec, `${fmt(mon)} mt`, `${fmt(tot)} mt`, `${rate.toFixed(1)}%`];
    });
  }, [data, maxYear]);

  // Coverage by gear type (latest year)
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
      .map((r) => [r.gear, `${fmt(r.mon)} mt`, `${fmt(r.tot)} mt`, `${r.rate.toFixed(1)}%`]);
  }, [data, maxYear]);

  // Catch by species group (latest year, Total rows, retained + discarded combined)
  const speciesGroupTable = useMemo(() => {
    if (!data || maxYear == null) return [];
    const totals = new Map<string, { retained: number; discarded: number }>();
    for (const r of data) {
      if (r.year === maxYear && r.monitored_or_total === "Total") {
        const prev = totals.get(r.species_group) ?? { retained: 0, discarded: 0 };
        if (r.disposition === "Retained") prev.retained += r.metric_tons ?? 0;
        else if (r.disposition === "Discarded") prev.discarded += r.metric_tons ?? 0;
        totals.set(r.species_group, prev);
      }
    }
    return [...totals.entries()]
      .map(([grp, v]) => ({ grp, total: v.retained + v.discarded, ...v }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((r) => [
        r.grp,
        `${fmt(r.retained)} mt`,
        `${fmt(r.discarded)} mt`,
        `${fmt(r.total)} mt`,
        r.total > 0 ? `${((r.discarded / r.total) * 100).toFixed(1)}%` : "—",
      ]);
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
            shown are clamped at 100%.
          </Note>

          {maxYear != null && (
            <>
              <h2 className="h2">{maxYear} coverage by sector — BSAI + GOA federal groundfish</h2>
              <Card>
                <Table
                  columns={[
                    { label: "Sector" },
                    { label: "Monitored", num: true },
                    { label: "Total catch", num: true },
                    { label: "Coverage rate", num: true },
                  ]}
                  rows={summaryTable}
                  caption={`Source: NMFS AKRO monitored catch tables via Mainsail monitored_catch, year ${maxYear}`}
                />
              </Card>

              <h2 className="h2">{maxYear} coverage by gear type — BSAI + GOA federal groundfish</h2>
              <Card>
                <Table
                  columns={[
                    { label: "Gear" },
                    { label: "Monitored", num: true },
                    { label: "Total catch", num: true },
                    { label: "Coverage rate", num: true },
                  ]}
                  rows={gearTable}
                  caption={`Source: NMFS AKRO monitored catch tables via Mainsail monitored_catch, year ${maxYear}`}
                />
              </Card>

              <h2 className="h2">{maxYear} catch by species group — BSAI + GOA federal groundfish</h2>
              <Card>
                <Table
                  columns={[
                    { label: "Species group" },
                    { label: "Retained", num: true },
                    { label: "Discarded", num: true },
                    { label: "Total", num: true },
                    { label: "Discard rate", num: true },
                  ]}
                  rows={speciesGroupTable}
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
