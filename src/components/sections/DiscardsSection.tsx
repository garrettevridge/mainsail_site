import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type {
  MonitoredCatchRow,
  DiscardMortalityRateRow,
} from "../../api/types";
import {
  Card,
  Legend,
  Note,
  ProportionBar,
  StatGrid,
  Table,
} from "../primitives";
import type { ProportionPart } from "../primitives";
import StackedTrend from "../charts/StackedTrend";

const fmt = (n: number | null | undefined, digits = 0) =>
  n == null
    ? "—"
    : n.toLocaleString("en-US", { maximumFractionDigits: digits });

const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function DiscardsSection() {
  const { data: catchData, isLoading: catchLoading } =
    useDataset<MonitoredCatchRow>("monitored_catch");
  const { data: dmrData, isLoading: dmrLoading } =
    useDataset<DiscardMortalityRateRow>("discard_mortality_rates");

  const isLoading = catchLoading || dmrLoading;

  const maxYear = useMemo(
    () =>
      catchData?.length ? Math.max(...catchData.map((r) => r.year)) : null,
    [catchData],
  );

  const speciesGroupYear = useMemo(() => {
    if (!catchData || maxYear == null) return null;
    const has2025 = catchData.some((r) => r.year === 2025);
    return has2025 ? 2025 : maxYear;
  }, [catchData, maxYear]);

  const dispositionTotals = useMemo(() => {
    if (!catchData || maxYear == null) return { retained: 0, discarded: 0 };
    let retained = 0,
      discarded = 0;
    for (const r of catchData) {
      if (r.year === maxYear && r.monitored_or_total === "Total") {
        if (r.disposition === "Retained") retained += r.metric_tons ?? 0;
        else if (r.disposition === "Discarded")
          discarded += r.metric_tons ?? 0;
      }
    }
    return { retained, discarded };
  }, [catchData, maxYear]);

  const proportionParts = useMemo<ProportionPart[]>(() => {
    const { retained, discarded } = dispositionTotals;
    return [
      { label: "Retained", value: retained, color: "#1a2332" },
      { label: "Discarded", value: discarded, color: "#b45309" },
    ];
  }, [dispositionTotals]);

  const discardBySpeciesTrend = useMemo(() => {
    if (!catchData) return { chartData: [], keys: [] };
    const totals = new Map<string, number>();
    for (const r of catchData) {
      if (
        r.disposition === "Discarded" &&
        r.monitored_or_total === "Total"
      ) {
        totals.set(
          r.species_group,
          (totals.get(r.species_group) ?? 0) + (r.metric_tons ?? 0),
        );
      }
    }
    const topGroups = [...totals.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([g]) => g);
    const years = [...new Set(catchData.map((r) => r.year))].sort(
      (a, b) => a - b,
    );
    const chartData = years.map((yr) => {
      const point: Record<string, number | string> = { year: yr };
      for (const g of topGroups) {
        point[g] = catchData
          .filter(
            (r) =>
              r.year === yr &&
              r.species_group === g &&
              r.disposition === "Discarded" &&
              r.monitored_or_total === "Total",
          )
          .reduce((s, r) => s + (r.metric_tons ?? 0), 0);
      }
      return point;
    });
    return { chartData, keys: topGroups };
  }, [catchData]);

  const speciesGroupTable = useMemo(() => {
    if (!catchData || speciesGroupYear == null) return [];
    const totals = new Map<
      string,
      { retained: number; discarded: number }
    >();
    for (const r of catchData) {
      if (r.year === speciesGroupYear && r.monitored_or_total === "Total") {
        const prev = totals.get(r.species_group) ?? {
          retained: 0,
          discarded: 0,
        };
        if (r.disposition === "Retained") prev.retained += r.metric_tons ?? 0;
        else if (r.disposition === "Discarded")
          prev.discarded += r.metric_tons ?? 0;
        totals.set(r.species_group, prev);
      }
    }
    return [...totals.entries()]
      .map(([grp, v]) => ({ grp, total: v.retained + v.discarded, ...v }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((r) => [
        "BSAI + GOA",
        r.grp,
        `${fmt(r.retained, 1)} mt`,
        `${fmt(r.discarded, 1)} mt`,
        `${fmt(r.total, 1)} mt`,
        r.total > 0 ? `${((r.discarded / r.total) * 100).toFixed(1)}%` : "—",
      ]);
  }, [catchData, speciesGroupYear]);

  const byGear = useMemo(() => {
    if (!catchData || maxYear == null) return [];
    const gears = [
      ...new Set(
        catchData.filter((r) => r.year === maxYear).map((r) => r.gear),
      ),
    ].sort();
    return gears
      .map((gear) => {
        const rows = catchData.filter(
          (r) =>
            r.year === maxYear &&
            r.gear === gear &&
            r.monitored_or_total === "Total",
        );
        const retained = rows
          .filter((r) => r.disposition === "Retained")
          .reduce((s, r) => s + (r.metric_tons ?? 0), 0);
        const discarded = rows
          .filter((r) => r.disposition === "Discarded")
          .reduce((s, r) => s + (r.metric_tons ?? 0), 0);
        const total = retained + discarded;
        return {
          gear,
          retained,
          discarded,
          total,
          rate: total > 0 ? discarded / total : 0,
        };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((r) => [
        "BSAI + GOA",
        r.gear,
        `${fmt(Math.round(r.retained / 1000))} kt`,
        `${fmt(Math.round(r.discarded / 1000))} kt`,
        fmtPct(r.rate),
      ]);
  }, [catchData, maxYear]);

  const { retained, discarded } = dispositionTotals;
  const total = retained + discarded;
  const discardRate = total > 0 ? discarded / total : 0;

  return (
    <>
      <h2 className="h2">Discards &amp; Utilization</h2>
      <p className="section-intro">
        "Discards" in Alaska's federal groundfish fisheries are any fish
        returned to the sea. Across the fleet, the retained-to-landed ratio
        sits near 97%; discards concentrate in undersized or non-target
        catch, post-closure quota overages, and regulatory returns.
      </p>

      {isLoading && (
        <p className="section-intro">Loading discard data…</p>
      )}

      {catchData && maxYear != null && (
        <>
          <StatGrid
            stats={[
              {
                val: `${fmt(Math.round(retained / 1000))} kt`,
                label: `Retained, ${maxYear}`,
                sub: "Federal groundfish, BSAI + GOA",
                accent: "accent",
              },
              {
                val: `${fmt(Math.round(discarded / 1000))} kt`,
                label: `Discarded, ${maxYear}`,
                sub: "All sectors, all species groups",
              },
              {
                val: fmtPct(discardRate),
                label: "Discard rate",
                sub: `${maxYear} total catch basis`,
              },
              {
                val: fmtPct(1 - discardRate),
                label: "Utilization rate",
                sub: `${maxYear} total catch basis`,
                accent: "accent",
              },
            ]}
          />

          <h3 className="h3">
            {maxYear} retained vs. discarded — BSAI + GOA federal groundfish
          </h3>
          <Card>
            <ProportionBar parts={proportionParts} />
            <Legend
              items={[
                {
                  label: `Retained — ${fmt(Math.round(retained / 1000))} kt (${fmtPct(retained / total)})`,
                  color: "#1a2332",
                },
                {
                  label: `Discarded — ${fmt(Math.round(discarded / 1000))} kt (${fmtPct(discardRate)})`,
                  color: "#b45309",
                },
              ]}
            />
            <div className="data-caption">
              Region: BSAI and GOA combined. Source: Seamark Analytics,
              derived from NMFS AKRO Catch Accounting System monitored catch
              tables.
            </div>
          </Card>

          {discardBySpeciesTrend.keys.length > 0 && (
            <>
              <h3 className="h3">
                Top discarded species groups by year, 2013–{maxYear}
              </h3>
              <Card>
                <StackedTrend
                  data={discardBySpeciesTrend.chartData}
                  xKey="year"
                  stackKeys={discardBySpeciesTrend.keys}
                  title="Federal groundfish discards by species group (BSAI + GOA combined)"
                  yLabel="metric tons"
                  yFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
              </Card>
            </>
          )}

          {speciesGroupTable.length > 0 && speciesGroupYear != null && (
            <>
              <h3 className="h3">
                {speciesGroupYear} catch by species group
              </h3>
              <Card>
                <Table
                  columns={[
                    { label: "Region" },
                    { label: "Species group" },
                    { label: "Retained (mt)", num: true },
                    { label: "Discarded (mt)", num: true },
                    { label: "Total (mt)", num: true },
                    { label: "Discard rate (%)", num: true },
                  ]}
                  rows={speciesGroupTable}
                  caption={`Region: BSAI and GOA combined. Source: Seamark Analytics, derived from NMFS AKRO Catch Accounting System monitored catch tables, year ${speciesGroupYear}.`}
                />
              </Card>
            </>
          )}

          {byGear.length > 0 && (
            <>
              <h3 className="h3">
                {maxYear} retained vs. discarded by gear type
              </h3>
              <Card>
                <Table
                  columns={[
                    { label: "Region" },
                    { label: "Gear" },
                    { label: "Retained (kt)", num: true },
                    { label: "Discarded (kt)", num: true },
                    { label: "Discard rate (%)", num: true },
                  ]}
                  rows={byGear}
                  caption={`Region: BSAI and GOA combined. Source: Seamark Analytics, derived from NMFS AKRO Catch Accounting System monitored catch tables, year ${maxYear}.`}
                />
              </Card>
            </>
          )}
        </>
      )}

      {dmrData && (
        <>
          <h3 className="h3">
            Discard mortality rates by gear — BSAI and GOA
          </h3>
          <Card>
            <Table
              columns={[
                { label: "FMP area" },
                { label: "Gear type" },
                { label: "Species" },
                { label: "DMR (%)", num: true },
                { label: "Effective years" },
                { label: "Source" },
              ]}
              rows={dmrData.map((r) => [
                r.fmp_area,
                r.gear_type,
                r.species,
                fmtPct(r.dmr_value),
                r.effective_year_end != null
                  ? `${r.effective_year_start}–${r.effective_year_end}`
                  : `${r.effective_year_start}–`,
                r.source,
              ])}
              caption="Region: BSAI and GOA, per-row. Source: Seamark Analytics, derived from BSAI/GOA groundfish harvest specifications (NPFMC)."
            />
          </Card>
          <Note>
            <b>Trawl vs. longline mortality.</b> Trawl gear carries the
            highest discard mortality rates (up to 80% for Pacific halibut);
            longline hook-and-line is 11% for the same species.
          </Note>
        </>
      )}
    </>
  );
}
