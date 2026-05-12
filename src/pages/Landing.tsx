import { useMemo } from "react";
import { Link } from "react-router-dom";
import { SECTIONS } from "../sections/registry";
import { Card, Crumb, Note, Table } from "../components/primitives";
import { useDataset } from "../api/manifest";
import type {
  IphcSourceMortalityRow,
  SalmonCommercialHarvestDataRow,
  CfecEarningsRow,
} from "../api/types";
import BigLine from "../components/charts/BigLine";

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 0 });

const fmtUsd = (n: number) =>
  n >= 1_000_000_000
    ? `$${(n / 1_000_000_000).toFixed(2)}B`
    : n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(0)}M`
      : `$${(n / 1_000).toFixed(0)}k`;

// Same region classifier the Communities page uses, kept local to avoid a
// shared module just for one site-wide table.
const REGION_MATCHERS: Array<{ region: string; needles: string[] }> = [
  { region: "Bristol Bay", needles: ["BRISTOL BAY"] },
  { region: "Prince William Sound", needles: ["PRINCE WILLIAM SOUND"] },
  { region: "Cook Inlet", needles: ["COOK INLET"] },
  { region: "Southeast", needles: ["SOUTHEAST"] },
  { region: "Kodiak", needles: ["KODIAK"] },
  { region: "Chignik", needles: ["CHIGNIK"] },
  { region: "Alaska Peninsula", needles: ["AK PENINSULA", "ALASKA PENINSULA"] },
  { region: "BSAI", needles: ["BERING SEA", "ALEUTIAN", " BSAI", "DUTCH HARBOR"] },
  {
    region: "AYK",
    needles: ["NORTON SOUND", "YUKON", "KUSKOKWIM", "KOTZEBUE", "AYK"],
  },
  { region: "Westward", needles: ["WESTWARD"] },
];
const classifyRegion = (desc: string): string => {
  const d = desc.toUpperCase();
  for (const { region, needles } of REGION_MATCHERS) {
    if (needles.some((n) => d.includes(n))) return region;
  }
  return "Statewide-pooled";
};

export default function Landing() {
  const { data: iphcMortality } =
    useDataset<IphcSourceMortalityRow>("iphc_mortality_by_source");
  const { data: commercialData } = useDataset<SalmonCommercialHarvestDataRow>(
    "salmon_commercial_harvest",
  );
  const { data: cfecData } = useDataset<CfecEarningsRow>("cfec_earnings");

  // Long-window halibut total mortality series (IPHC's coastwide ledger,
  // 1888-present, the longest comprehensive fishery dataset on the site).
  const halibutSeries = useMemo(() => {
    if (!iphcMortality) return [];
    return iphcMortality
      .filter((r) => r.source.toLowerCase() === "total" && r.mortality_mlb != null)
      .sort((a, b) => a.year - b.year)
      .map((r) => ({ year: r.year, mlb: r.mortality_mlb as number }));
  }, [iphcMortality]);

  const latestHalibut = halibutSeries.length
    ? halibutSeries[halibutSeries.length - 1]
    : null;

  // Statewide commercial salmon harvest, latest year — all five species.
  const salmonStat = useMemo(() => {
    if (!commercialData) return null;
    const statewide = commercialData.filter((r) => r.region === "statewide");
    if (!statewide.length) return null;
    const years = [...new Set(statewide.map((r) => r.year))].sort(
      (a, b) => b - a,
    );
    for (const yr of years) {
      const fish = statewide
        .filter((r) => r.year === yr)
        .reduce((s, r) => s + (r.harvest_fish ?? 0), 0);
      if (fish > 0) return { year: yr, fish };
    }
    return null;
  }, [commercialData]);

  // Active CFEC permits fished statewide, latest year.
  const permitsStat = useMemo(() => {
    if (!cfecData) return null;
    const years = [...new Set(cfecData.map((r) => r.year))].sort(
      (a, b) => b - a,
    );
    for (const yr of years) {
      const v = cfecData
        .filter((r) => r.year === yr)
        .reduce((s, r) => s + (r.total_permits_fished ?? 0), 0);
      if (v > 0) return { year: yr, count: v };
    }
    return null;
  }, [cfecData]);

  // Top 5 Alaska regions by CFEC ex-vessel earnings, latest year.
  const regionalTop5 = useMemo(() => {
    if (!cfecData) return null;
    const years = [...new Set(cfecData.map((r) => r.year))].sort(
      (a, b) => b - a,
    );
    const yr = years[0];
    if (yr == null) return null;
    const byRegion = new Map<string, { earnings: number; lbs: number }>();
    for (const r of cfecData) {
      if (r.year !== yr) continue;
      const region = classifyRegion(r.fishery_desc);
      if (region === "Statewide-pooled") continue;
      const acc = byRegion.get(region) ?? { earnings: 0, lbs: 0 };
      acc.earnings += r.total_earnings ?? 0;
      acc.lbs += r.total_lbs ?? 0;
      byRegion.set(region, acc);
    }
    const rows = [...byRegion.entries()]
      .filter(([, v]) => v.earnings > 0)
      .sort(([, a], [, b]) => b.earnings - a.earnings)
      .slice(0, 5)
      .map(([region, v]) => ({ region, ...v }));
    return { year: yr, rows };
  }, [cfecData]);

  return (
    <article>
      <Crumb topic="Overview" />
      <h1 className="page-title">Alaska Seafood, at a Glance</h1>

      <p className="page-lede first-sentence">
        For more than 150 years, commercial fisheries have anchored Alaska's
        economy and the communities along its coast.
      </p>
      <p className="page-lede">
        The same ecosystems that sustained Indigenous peoples for thousands of
        years now feed the largest wild-capture seafood industry in the United
        States — and one of the largest in the world. Today the sector is
        mature: roughly 100 active shore-based processors, several thousand
        commercial vessels, and dockside landings worth billions of dollars
        each year. Three numbers anchor the rest of this site.
      </p>

      <div className="key-facts">
        <div>
          <div className="key-fact-val">
            {salmonStat ? `${(salmonStat.fish / 1_000_000).toFixed(0)}M` : "—"}
          </div>
          <div className="key-fact-lbl">Salmon, commercial</div>
          <div className="key-fact-sub">
            {salmonStat
              ? `Fish landed statewide in ${salmonStat.year}, across all five Pacific salmon species.`
              : "loading"}
          </div>
        </div>
        <div>
          <div className="key-fact-val">
            {latestHalibut ? `${latestHalibut.mlb.toFixed(1)} M lb` : "—"}
          </div>
          <div className="key-fact-lbl">Halibut, all sources</div>
          <div className="key-fact-sub">
            {latestHalibut
              ? `Coastwide mortality in ${latestHalibut.year}, IPHC's all-source ledger. The series goes back to 1888.`
              : "loading"}
          </div>
        </div>
        <div>
          <div className="key-fact-val">
            {permitsStat ? fmt(permitsStat.count) : "—"}
          </div>
          <div className="key-fact-lbl">Active CFEC permits</div>
          <div className="key-fact-sub">
            {permitsStat
              ? `Permits actually fished statewide in ${permitsStat.year}.`
              : "loading"}
          </div>
        </div>
      </div>

      {halibutSeries.length > 0 && (
        <>
          <h2 className="h2">
            One fishery, 138 years of data
          </h2>
          <p className="section-intro">
            Pacific halibut is the only Alaska fishery with a single
            coastwide ledger that reconciles every pound of mortality —
            directed commercial, bycatch, recreational, subsistence,
            wastage — into one annual total. The IPHC has been keeping it
            since 1888.
          </p>
          <BigLine
            data={halibutSeries}
            xKey="year"
            yKey="mlb"
            yLabel="million pounds (net)"
            unitSuffix="M lb"
            refYears={[
              { year: 1923, label: "IPHC founded" },
              { year: 1995, label: "IFQ adopted" },
            ]}
            height={380}
          />
          <p className="data-caption" style={{ marginTop: 4 }}>
            Region: IPHC coastwide (Areas 2A–4D, Oregon to the Aleutians).
            Source: Seamark Analytics, derived from IPHC annual stock
            assessments. The deep{" "}
            <Link to="/topics/halibut">halibut page</Link> breaks the total
            into directed commercial, bycatch, recreational, subsistence,
            and wastage.
          </p>
        </>
      )}

      {regionalTop5 && regionalTop5.rows.length > 0 && (
        <>
          <h2 className="h2">Where the money lands, {regionalTop5.year}</h2>
          <p className="section-intro">
            Alaska's five highest-earning fishing regions, by CFEC ex-vessel
            payments to permit holders. Bristol Bay sockeye dominates the
            list every season. Excludes statewide-pooled fisheries (halibut
            IFQ, sablefish IFQ) and the federal BSAI pollock catcher-
            processor fleet.
          </p>
          <Card>
            <Table
              columns={[
                { label: "Region" },
                { label: "Ex-vessel earnings", num: true },
                { label: "Pounds landed", num: true },
              ]}
              rows={regionalTop5.rows.map((r) => [
                r.region,
                fmtUsd(r.earnings),
                `${fmt(Math.round(r.lbs / 1_000_000))}M lb`,
              ])}
              caption={`Year: ${regionalTop5.year}. Source: Seamark Analytics, derived from ADF&G CFEC permit fishery earnings reports. Full table on the Communities page.`}
            />
          </Card>
          <p className="data-caption" style={{ marginTop: 4 }}>
            Full ranking on the <Link to="/communities">Communities</Link>{" "}
            page.
          </p>
        </>
      )}

      <h2 className="h2">Five threads</h2>
      <p className="section-intro">
        The rest of the site organizes Alaska's fisheries into five
        sections.
      </p>
      <nav className="section-row" aria-label="Top-level sections">
        {SECTIONS.map((s, i) => (
          <Link key={s.slug} to={`/${s.slug}`} className="section-btn">
            <span className="section-num">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="section-title">{s.title}</span>
            <span className="section-blurb">{s.blurb}</span>
          </Link>
        ))}
      </nav>

      <Note>
        <b>About these numbers.</b> A true statewide-all-species commercial
        landings figure (total pounds, total ex-vessel value in real
        dollars) is pending the NMFS commercial landings ingest. Every
        figure on this page reads directly from an agency publication —
        IPHC for halibut, ADF&amp;G/NPAFC for salmon, ADF&amp;G CFEC for
        permits — with no Mainsail re-modeling. Monetary figures are
        shown in nominal USD; real-dollar conversion ships once the
        CPI-U deflator dataset reaches S3. Full IA in{" "}
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
