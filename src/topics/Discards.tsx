import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type { MonitoredCatchRow, DiscardMortalityRateRow } from "../api/types";
import {
  Card,
  Crumb,
  DataContext,
  Legend,
  Note,
  ProportionBar,
  StatGrid,
  Table,
} from "../components/primitives";
import type { ProportionPart } from "../components/primitives";
import StackedTrend from "../components/charts/StackedTrend";

const fmt = (n: number | null | undefined, digits = 0) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: digits });

const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function Discards() {
  const { data: catchData, isLoading: catchLoading } =
    useDataset<MonitoredCatchRow>("monitored_catch");
  const { data: dmrData, isLoading: dmrLoading } =
    useDataset<DiscardMortalityRateRow>("discard_mortality_rates");

  const isLoading = catchLoading || dmrLoading;

  const maxYear = useMemo(
    () => (catchData?.length ? Math.max(...catchData.map((r) => r.year)) : null),
    [catchData]
  );

  // Overall retained vs discarded
  const dispositionTotals = useMemo(() => {
    if (!catchData || maxYear == null) return { retained: 0, discarded: 0 };
    let retained = 0, discarded = 0;
    for (const r of catchData) {
      if (r.year === maxYear && r.monitored_or_total === "Total") {
        if (r.disposition === "Retained") retained += r.metric_tons ?? 0;
        else if (r.disposition === "Discarded") discarded += r.metric_tons ?? 0;
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

  // Top species groups discarded by year
  const discardBySpeciesTrend = useMemo(() => {
    if (!catchData) return { chartData: [], keys: [] };
    const totals = new Map<string, number>();
    for (const r of catchData) {
      if (r.disposition === "Discarded" && r.monitored_or_total === "Total") {
        totals.set(r.species_group, (totals.get(r.species_group) ?? 0) + (r.metric_tons ?? 0));
      }
    }
    const topGroups = [...totals.entries()].sort(([, a], [, b]) => b - a).slice(0, 6).map(([g]) => g);
    const years = [...new Set(catchData.map((r) => r.year))].sort((a, b) => a - b);
    const chartData = years.map((yr) => {
      const point: Record<string, number | string> = { year: yr };
      for (const g of topGroups) {
        point[g] = catchData
          .filter((r) => r.year === yr && r.species_group === g && r.disposition === "Discarded" && r.monitored_or_total === "Total")
          .reduce((s, r) => s + (r.metric_tons ?? 0), 0);
      }
      return point;
    });
    return { chartData, keys: topGroups };
  }, [catchData]);

  // Retained vs discarded by FMP area (latest year)
  const byFmpArea = useMemo(() => {
    if (!catchData || maxYear == null) return [];
    const areas = [...new Set(catchData.map((r) => r.fmp_area))].sort();
    return areas.map((area) => {
      const rows = catchData.filter((r) => r.year === maxYear && r.fmp_area === area && r.monitored_or_total === "Total");
      const retained = rows.filter((r) => r.disposition === "Retained").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
      const discarded = rows.filter((r) => r.disposition === "Discarded").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
      const total = retained + discarded;
      return [
        area,
        `${fmt(Math.round(retained / 1000))} kt`,
        `${fmt(Math.round(discarded / 1000))} kt`,
        total > 0 ? fmtPct(discarded / total) : "—",
      ];
    });
  }, [catchData, maxYear]);

  // Retained vs discarded by gear (latest year)
  const byGear = useMemo(() => {
    if (!catchData || maxYear == null) return [];
    const gears = [...new Set(catchData.filter((r) => r.year === maxYear).map((r) => r.gear))].sort();
    return gears
      .map((gear) => {
        const rows = catchData.filter((r) => r.year === maxYear && r.gear === gear && r.monitored_or_total === "Total");
        const retained = rows.filter((r) => r.disposition === "Retained").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
        const discarded = rows.filter((r) => r.disposition === "Discarded").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
        const total = retained + discarded;
        return { gear, retained, discarded, total, rate: total > 0 ? discarded / total : 0 };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((r) => [
        r.gear,
        `${fmt(Math.round(r.retained / 1000))} kt`,
        `${fmt(Math.round(r.discarded / 1000))} kt`,
        fmtPct(r.rate),
      ]);
  }, [catchData, maxYear]);

  // Retained vs discarded by sector (latest year)
  const bySector = useMemo(() => {
    if (!catchData || maxYear == null) return [];
    const sectors = [...new Set(catchData.filter((r) => r.year === maxYear).map((r) => r.sector))].sort();
    return sectors
      .map((sector) => {
        const rows = catchData.filter((r) => r.year === maxYear && r.sector === sector && r.monitored_or_total === "Total");
        const retained = rows.filter((r) => r.disposition === "Retained").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
        const discarded = rows.filter((r) => r.disposition === "Discarded").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
        const total = retained + discarded;
        return { sector, retained, discarded, total, rate: total > 0 ? discarded / total : 0 };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((r) => [
        r.sector,
        `${fmt(Math.round(r.retained / 1000))} kt`,
        `${fmt(Math.round(r.discarded / 1000))} kt`,
        fmtPct(r.rate),
      ]);
  }, [catchData, maxYear]);

  // Discard rate trend by year (BSAI + GOA, all)
  const discardTrend = useMemo(() => {
    if (!catchData) return [];
    const years = [...new Set(catchData.map((r) => r.year))].sort((a, b) => a - b);
    return years.map((yr) => {
      const rows = catchData.filter((r) => r.year === yr && r.monitored_or_total === "Total");
      const retained = rows.filter((r) => r.disposition === "Retained").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
      const discarded = rows.filter((r) => r.disposition === "Discarded").reduce((s, r) => s + (r.metric_tons ?? 0), 0);
      const total = retained + discarded;
      return [
        String(yr),
        `${fmt(Math.round(retained / 1000))} kt`,
        `${fmt(Math.round(discarded / 1000))} kt`,
        `${fmt(Math.round(total / 1000))} kt`,
        total > 0 ? fmtPct(discarded / total) : "—",
      ];
    });
  }, [catchData]);

  const { retained, discarded } = dispositionTotals;
  const total = retained + discarded;
  const discardRate = total > 0 ? discarded / total : 0;

  return (
    <>
      <Crumb topic="Discards & Utilization" />
      <h1 className="page-title">Discards &amp; Utilization</h1>

      <DataContext
        use={[
          "monitored_catch — NMFS AKRO retained vs. discarded by species, gear, sector, FMP area",
          "discard_mortality_rates — BSAI/GOA discard mortality rates by gear and species",
        ]}
        could={[
          "psc_weekly — halibut & salmon PSC counts by target fishery",
          "wastage_reports — processor at-sea waste/trim data",
          "prohibited_species_catch — PSC limit utilization by fishery",
          "at_sea_production — product recovery rates by vessel class",
        ]}
        ideas={[
          "Discard rate by species complex trend (is it improving?)",
          "Retained vs. discarded by vessel size class",
          "DMR-weighted mortality: convert discards to mortality equivalents",
          "Compare discard rates: BSAI trawl vs. GOA trawl vs. longline",
        ]}
      />

      {isLoading && <p className="section-intro">Loading discard data…</p>}

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

          <h2 className="h2">{maxYear} retained vs. discarded</h2>
          <Card>
            <ProportionBar parts={proportionParts} />
            <Legend
              items={[
                { label: `Retained — ${fmt(Math.round(retained / 1000))} kt (${fmtPct(retained / total)})`, color: "#1a2332" },
                { label: `Discarded — ${fmt(Math.round(discarded / 1000))} kt (${fmtPct(discardRate)})`, color: "#b45309" },
              ]}
            />
            <div className="data-caption">Source: NMFS Monitored Catch tables</div>
          </Card>

          {discardBySpeciesTrend.keys.length > 0 && (
            <>
              <h2 className="h2">Top discarded species groups by year, 2013–{maxYear}</h2>
              <Card>
                <StackedTrend
                  data={discardBySpeciesTrend.chartData}
                  xKey="year"
                  stackKeys={discardBySpeciesTrend.keys}
                  title="Federal groundfish discards by species group"
                  yLabel="metric tons"
                  yFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
              </Card>
            </>
          )}

          {byFmpArea.length > 0 && (
            <>
              <h2 className="h2">{maxYear} retained vs. discarded by FMP area</h2>
              <Card>
                <Table
                  columns={[
                    { label: "FMP area" },
                    { label: "Retained", num: true },
                    { label: "Discarded", num: true },
                    { label: "Discard rate", num: true },
                  ]}
                  rows={byFmpArea}
                  caption={`Source: NMFS AKRO monitored catch tables via Mainsail monitored_catch, year ${maxYear}`}
                />
              </Card>
            </>
          )}

          {byGear.length > 0 && (
            <>
              <h2 className="h2">{maxYear} retained vs. discarded by gear type</h2>
              <Card>
                <Table
                  columns={[
                    { label: "Gear" },
                    { label: "Retained", num: true },
                    { label: "Discarded", num: true },
                    { label: "Discard rate", num: true },
                  ]}
                  rows={byGear}
                  caption={`Source: NMFS AKRO monitored catch tables via Mainsail monitored_catch, year ${maxYear}`}
                />
              </Card>
            </>
          )}

          {bySector.length > 0 && (
            <>
              <h2 className="h2">{maxYear} retained vs. discarded by sector</h2>
              <Card>
                <Table
                  columns={[
                    { label: "Sector" },
                    { label: "Retained", num: true },
                    { label: "Discarded", num: true },
                    { label: "Discard rate", num: true },
                  ]}
                  rows={bySector}
                  caption={`Source: NMFS AKRO monitored catch tables via Mainsail monitored_catch, year ${maxYear}`}
                />
              </Card>
            </>
          )}

          {discardTrend.length > 0 && (
            <>
              <h2 className="h2">Annual discard totals, 2013–{maxYear}</h2>
              <Card>
                <Table
                  columns={[
                    { label: "Year", yr: true },
                    { label: "Retained", num: true },
                    { label: "Discarded", num: true },
                    { label: "Total catch", num: true },
                    { label: "Discard rate", num: true },
                  ]}
                  rows={discardTrend}
                  caption="Source: NMFS AKRO monitored catch tables via Mainsail monitored_catch"
                />
              </Card>
            </>
          )}
        </>
      )}

      {dmrData && (
        <>
          <h2 className="h2">Discard mortality rates by gear</h2>
          <Card>
            <Table
              columns={[
                { label: "FMP area" },
                { label: "Gear type" },
                { label: "Species" },
                { label: "DMR", num: true },
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
              caption="Source: BSAI/GOA groundfish harvest specifications, via Mainsail discard_mortality_rates"
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
