import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type { MonitoredCatchRow, DiscardMortalityRateRow } from "../api/types";
import {
  Card,
  Crumb,
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
    () =>
      catchData?.length ? Math.max(...catchData.map((r) => r.year)) : null,
    [catchData]
  );

  // Most recent year: total retained vs discarded (BSAI + GOA, all sectors, "Total" rows)
  const dispositionTotals = useMemo(() => {
    if (!catchData || maxYear == null) return { retained: 0, discarded: 0 };
    let retained = 0;
    let discarded = 0;
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

  // Top species groups discarded by year (BSAI + GOA, Total rows)
  const discardBySpeciesTrend = useMemo(() => {
    if (!catchData) return { chartData: [], keys: [] };

    // Find top 6 discarded species groups by total volume across all years
    const totals = new Map<string, number>();
    for (const r of catchData) {
      if (r.disposition === "Discarded" && r.monitored_or_total === "Total") {
        totals.set(r.species_group, (totals.get(r.species_group) ?? 0) + (r.metric_tons ?? 0));
      }
    }
    const topGroups = [...totals.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([g]) => g);

    const years = [...new Set(catchData.map((r) => r.year))].sort((a, b) => a - b);
    const chartData = years.map((yr) => {
      const point: Record<string, number | string> = { year: yr };
      for (const g of topGroups) {
        point[g] = catchData
          .filter(
            (r) =>
              r.year === yr &&
              r.species_group === g &&
              r.disposition === "Discarded" &&
              r.monitored_or_total === "Total"
          )
          .reduce((s, r) => s + (r.metric_tons ?? 0), 0);
      }
      return point;
    });

    return { chartData, keys: topGroups };
  }, [catchData]);

  const { retained, discarded } = dispositionTotals;
  const total = retained + discarded;
  const discardRate = total > 0 ? discarded / total : 0;

  return (
    <>
      <Crumb topic="Discards & Utilization" />
      <h1 className="page-title">Discards &amp; Utilization</h1>
      <p className="page-lede first-sentence">
        "Discards" in Alaska's federal groundfish fisheries is a term with two
        distinct meanings — regulatory and economic — and both matter for
        understanding how much of the catch is actually used. The regulatory
        definition counts any fish returned to the sea, dead or alive, as a
        discard; the economic definition tracks only fish that had a plausible
        commercial path and were returned for market reasons.
      </p>
      <p className="page-lede">
        Across the federal groundfish fleet, the retained-to-landed ratio sits
        near <b>97%</b>. Discards concentrate in a handful of specific
        situations: undersized or non-target species caught incidentally, fish
        that fall outside a year's quota after a sector closes, and
        regulatory-mandated returns (prohibited species, non-retention species,
        legal-minimum shortfalls).
      </p>
      <p className="page-lede">
        The sections below decompose that headline into retained vs. discarded
        volumes, composition of the discarded fraction, and the discard
        mortality rates applied by gear type.
      </p>

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
          <p className="section-intro">
            Share of federal groundfish catch retained vs. returned to sea
            (BSAI + GOA combined, all sectors, all species groups).
          </p>
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
            <div className="data-caption">Source: NMFS Monitored Catch tables</div>
          </Card>

          {discardBySpeciesTrend.keys.length > 0 && (
            <>
              <h2 className="h2">
                Top discarded species groups by year, 2013–{maxYear}
              </h2>
              <p className="section-intro">
                Metric tons discarded (Total rows, BSAI + GOA combined). The
                six largest species groups by cumulative discard volume across
                all years shown.
              </p>
              <Card>
                <StackedTrend
                  data={discardBySpeciesTrend.chartData}
                  xKey="year"
                  stackKeys={discardBySpeciesTrend.keys}
                  title="Federal groundfish discards by species group"
                  yLabel="metric tons"
                  yFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
              </Card>
            </>
          )}
        </>
      )}

      {dmrData && (
        <>
          <h2 className="h2">Discard mortality rates by gear</h2>
          <p className="section-intro">
            Regulatory discard mortality rates (DMRs) specify what fraction of
            discarded fish are counted as mortality. A trawl-discarded halibut
            counts more heavily than a hook-and-line discarded halibut because
            survival rates differ by gear type. These rates are established by
            the Council and published in the harvest specifications.
          </p>
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
            longline hook-and-line is 11% for the same species. This
            difference explains why the Council imposes stricter PSC caps on
            trawl sectors even at the same bycatch count.
          </Note>
        </>
      )}
    </>
  );
}
