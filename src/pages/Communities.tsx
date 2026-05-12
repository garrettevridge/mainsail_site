import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type { CfecEarningsRow } from "../api/types";
import { Card, Crumb, Note, Table } from "../components/primitives";
import PlannedElements from "../components/primitives/PlannedElements";

// Parse a region tag out of CFEC's fishery_desc. The location keyword is
// almost always at the tail of the description; we match the first hit in
// priority order (most specific first). Fisheries that aren't area-tagged
// (halibut IFQ, sablefish IFQ, etc.) get "Statewide" and are excluded from
// the regional comparison.
const REGION_MATCHERS: Array<{ region: string; needles: string[] }> = [
  { region: "Bristol Bay", needles: ["BRISTOL BAY"] },
  { region: "Prince William Sound", needles: ["PRINCE WILLIAM SOUND"] },
  { region: "Cook Inlet", needles: ["COOK INLET"] },
  { region: "Southeast", needles: ["SOUTHEAST"] },
  { region: "Kodiak", needles: ["KODIAK"] },
  { region: "Chignik", needles: ["CHIGNIK"] },
  { region: "Alaska Peninsula", needles: ["AK PENINSULA", "ALASKA PENINSULA"] },
  {
    region: "BSAI",
    needles: ["BERING SEA", "ALEUTIAN", " BSAI", "DUTCH HARBOR"],
  },
  {
    region: "AYK",
    needles: [
      "NORTON SOUND",
      "YUKON",
      "KUSKOKWIM",
      "KOTZEBUE",
      "AYK",
    ],
  },
  { region: "Westward", needles: ["WESTWARD"] },
];

const classifyRegion = (desc: string): string => {
  const d = desc.toUpperCase();
  for (const { region, needles } of REGION_MATCHERS) {
    if (needles.some((n) => d.includes(n))) return region;
  }
  if (d.includes("STATEWIDE") || d.includes("STATE WATERS"))
    return "Statewide-pooled";
  return "Other";
};

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtUsd = (n: number) =>
  n >= 1_000_000_000
    ? `$${(n / 1_000_000_000).toFixed(2)}B`
    : n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(0)}M`
      : `$${(n / 1_000).toFixed(0)}k`;

export default function Communities() {
  const { data: cfecData } = useDataset<CfecEarningsRow>("cfec_earnings");

  const latestYear = useMemo(() => {
    if (!cfecData) return null;
    const years = [...new Set(cfecData.map((r) => r.year))].sort(
      (a, b) => b - a,
    );
    return years[0] ?? null;
  }, [cfecData]);

  // Per-region totals, latest year.
  const regionalLatest = useMemo(() => {
    if (!cfecData || latestYear == null) return null;
    const byRegion = new Map<
      string,
      { earnings: number; lbs: number; permits: number; fisheries: number }
    >();
    for (const r of cfecData) {
      if (r.year !== latestYear) continue;
      const region = classifyRegion(r.fishery_desc);
      const acc = byRegion.get(region) ?? {
        earnings: 0,
        lbs: 0,
        permits: 0,
        fisheries: 0,
      };
      acc.earnings += r.total_earnings ?? 0;
      acc.lbs += r.total_lbs ?? 0;
      acc.permits += r.total_permits_fished ?? 0;
      acc.fisheries += 1;
      byRegion.set(region, acc);
    }
    const rows = [...byRegion.entries()]
      .filter(
        ([region, v]) =>
          region !== "Statewide-pooled" && region !== "Other" && v.earnings > 0,
      )
      .sort(([, a], [, b]) => b.earnings - a.earnings)
      .map(([region, v]) => ({ region, ...v }));
    const totalRegional = rows.reduce((s, r) => s + r.earnings, 0);
    const statewidePooled =
      byRegion.get("Statewide-pooled")?.earnings ?? 0;
    return { rows, totalRegional, statewidePooled, year: latestYear };
  }, [cfecData, latestYear]);

  // Top fishery_desc rows per region (latest year, top 3 by earnings).
  const topFisheriesByRegion = useMemo(() => {
    if (!cfecData || latestYear == null) return null;
    const byRegion = new Map<
      string,
      Array<{ desc: string; earnings: number; lbs: number }>
    >();
    for (const r of cfecData) {
      if (r.year !== latestYear) continue;
      const region = classifyRegion(r.fishery_desc);
      if (region === "Statewide-pooled" || region === "Other") continue;
      const arr = byRegion.get(region) ?? [];
      arr.push({
        desc: r.fishery_desc,
        earnings: r.total_earnings ?? 0,
        lbs: r.total_lbs ?? 0,
      });
      byRegion.set(region, arr);
    }
    const result: Array<{
      region: string;
      top: Array<{ desc: string; earnings: number; lbs: number }>;
    }> = [];
    for (const [region, arr] of byRegion.entries()) {
      arr.sort((a, b) => b.earnings - a.earnings);
      result.push({ region, top: arr.slice(0, 3) });
    }
    return result;
  }, [cfecData, latestYear]);

  return (
    <article>
      <div className="hero tint" style={{ background: "linear-gradient(135deg, #2C5F2D 0%, #84B59F 100%)" }}>
        <span className="hero-eyebrow">Communities · Section 01</span>
      </div>
      <Crumb topic="Communities" />
      <span className="section-pill">01 · Section</span>
      <h1 className="page-title">Communities</h1>

      <p className="page-lede first-sentence">
        Alaska is a global fishing powerhouse, and a handful of regions and
        towns drive an outsized share of US seafood.
      </p>
      <p className="page-lede">
        A community-by-community ranking — Kodiak, Cordova, Dutch Harbor,
        Sitka, King Salmon, Nome — is pending the NMFS "Fisheries of the
        United States" port-tables ingest. In the meantime, the table below
        groups every CFEC permit-fishery by Alaska region, ranked by
        ex-vessel earnings paid to fishermen in the most recent year on the
        wire. It excludes statewide-pooled fisheries (halibut IFQ, sablefish
        IFQ) which don't carry a regional tag, and excludes the federal BSAI
        pollock catcher-processor fleet (federal LLP, not CFEC).
      </p>

      {regionalLatest && regionalLatest.rows.length > 0 && (
        <>
          <h2 className="h2">
            CFEC ex-vessel earnings by region, {regionalLatest.year}
          </h2>
          <p className="section-intro">
            Earnings paid to CFEC permit holders, summed across every
            area-tagged fishery in the region. Nominal USD.
          </p>
          <Card>
            <Table
              columns={[
                { label: "Region" },
                { label: "Ex-vessel earnings", num: true },
                { label: "Pounds landed", num: true },
                { label: "Active permits", num: true },
                { label: "Share of regional total", num: true },
              ]}
              rows={regionalLatest.rows.map((r) => [
                r.region,
                fmtUsd(r.earnings),
                `${fmt(Math.round(r.lbs / 1_000_000))}M lb`,
                fmt(r.permits),
                `${((r.earnings / regionalLatest.totalRegional) * 100).toFixed(1)}%`,
              ])}
              caption={`Year: ${regionalLatest.year}. Region tags parsed from CFEC fishery_desc; statewide-pooled fisheries (${fmtUsd(regionalLatest.statewidePooled)} for ${regionalLatest.year}, primarily halibut and sablefish IFQ) excluded from this view. Source: Seamark Analytics, derived from ADF&G CFEC permit fishery earnings reports.`}
            />
          </Card>
        </>
      )}

      {topFisheriesByRegion && (
        <>
          <h2 className="h2">
            Top fishery in each region, {latestYear}
          </h2>
          <p className="section-intro">
            The single largest CFEC permit-fishery by ex-vessel earnings in
            each region.
          </p>
          <Card>
            <Table
              columns={[
                { label: "Region" },
                { label: "Top fishery" },
                { label: "Earnings", num: true },
                { label: "Pounds landed", num: true },
              ]}
              rows={topFisheriesByRegion
                .map((rg) => ({ region: rg.region, top: rg.top[0] }))
                .filter((r) => r.top)
                .sort((a, b) => (b.top?.earnings ?? 0) - (a.top?.earnings ?? 0))
                .map((r) => [
                  r.region,
                  r.top!.desc,
                  fmtUsd(r.top!.earnings),
                  `${fmt(Math.round(r.top!.lbs / 1_000_000))}M lb`,
                ])}
              caption={`Year: ${latestYear}. Source: Seamark Analytics, derived from ADF&G CFEC permit fishery earnings reports.`}
            />
          </Card>
        </>
      )}

      <h2 className="h2">Pending — by-port and global comparisons</h2>
      <p className="section-intro">
        Two pieces of the IA's Communities matrix are still blocked on new
        ingests.
      </p>
      <PlannedElements
        elements={[
          {
            title:
              "Top 20 US ports by ex-vessel value — Alaska ports highlighted, national rank shown",
            source: 'NMFS "Fisheries of the United States" port tables',
            status: "blocked",
          },
          {
            title:
              "Top 20 US ports by volume — same shape",
            source: 'NMFS "Fisheries of the United States" port tables',
            status: "blocked",
          },
          {
            title:
              "Alaska community detail — ex-vessel + first-wholesale, latest year + 10-yr sparkline (Kodiak, Cordova, Dutch Harbor, Sitka, King Salmon, Nome, …)",
            source: "NMFS commercial landings + ADF&G COAR (currently empty)",
            status: "blocked",
          },
          {
            title:
              "World wild-capture ranking — top countries plus Alaska as a peer bar",
            source: "FAO FishStat capture production",
            status: "blocked",
          },
        ]}
      />

      <Note>
        <b>Status.</b> The regional cut above is real, comprehensive within
        the limited-entry universe, and goes back to 1975 in CFEC. The
        by-port and global views are blocked on new data the engine is
        producing. Full IA in{" "}
        <a
          href="https://github.com/garrettevridge/mainsail_site/blob/main/docs/INFORMATION_ARCHITECTURE.md"
          target="_blank"
          rel="noreferrer"
        >
          docs/INFORMATION_ARCHITECTURE.md
        </a>
        .
      </Note>
    </article>
  );
}
