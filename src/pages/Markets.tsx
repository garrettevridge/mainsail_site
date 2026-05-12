import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type {
  FossTradeRow,
  AlaskaExportShareRow,
} from "../api/types";
import { Card, Crumb, Note, StatGrid, Table } from "../components/primitives";

// Normalize NMFS FOSS country labels (uppercase, casual short-forms) to the
// UN short-name designations CLAUDE.md mandates. Anything not in this map is
// title-cased as a best-effort fallback.
const COUNTRY_REWRITE: Record<string, string> = {
  "SOUTH KOREA": "Republic of Korea",
  "KOREA, SOUTH": "Republic of Korea",
  "NORTH KOREA": "Democratic People's Republic of Korea",
  "RUSSIA": "Russian Federation",
  "VIETNAM": "Viet Nam",
  "BURMA": "Myanmar",
  "IVORY COAST": "Côte d'Ivoire",
  "BRUNEI": "Brunei Darussalam",
  "LAOS": "Lao People's Democratic Republic",
  "MOLDOVA": "Republic of Moldova",
  "TANZANIA": "United Republic of Tanzania",
  "MACEDONIA": "North Macedonia",
  "SYRIA": "Syrian Arab Republic",
  "IRAN": "Iran (Islamic Republic of)",
  "VENEZUELA": "Venezuela (Bolivarian Republic of)",
  "BOLIVIA": "Bolivia (Plurinational State of)",
  "CZECH REPUBLIC": "Czechia",
  "HONG KONG": "China, Hong Kong SAR",
  "MACAU": "China, Macao SAR",
};

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split(/(\s|-)/)
    .map((w) =>
      /\s|-/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join("");

const normalizeCountry = (raw: string): string => {
  const upper = raw.trim().toUpperCase();
  if (COUNTRY_REWRITE[upper]) return COUNTRY_REWRITE[upper];
  return titleCase(raw);
};

// 7-bucket species rollup matching the site's harvest taxonomy. FOSS fus_group2
// is the closest equivalent. Anything we can't classify falls into "Other".
const SPECIES_BUCKETS = [
  { bucket: "Pollock", match: ["POLLOCK", "SURIMI"] },
  { bucket: "Salmon", match: ["SALMON", "SOCKEYE", "PINK", "CHUM", "COHO", "CHINOOK"] },
  { bucket: "Halibut", match: ["HALIBUT"] },
  { bucket: "Sablefish", match: ["SABLEFISH"] },
  { bucket: "Crab", match: ["CRAB"] },
  { bucket: "Flatfish", match: ["FLATFISH", "FLOUNDER", "SOLE", "PLAICE"] },
  { bucket: "Cod", match: ["COD"] },
];
const classifyToBucket = (s: string | null): string => {
  if (!s) return "Other";
  const up = s.toUpperCase();
  for (const { bucket, match } of SPECIES_BUCKETS) {
    if (match.some((m) => up.includes(m))) return bucket;
  }
  return "Other";
};

const fmtUsd = (n: number) =>
  n >= 1_000_000_000
    ? `$${(n / 1_000_000_000).toFixed(2)}B`
    : n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(0)}M`
      : `$${(n / 1_000).toFixed(0)}k`;
const fmtKg = (n: number) =>
  n >= 1_000_000_000
    ? `${(n / 1_000_000_000).toFixed(2)}B kg`
    : n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M kg`
      : `${(n / 1_000).toFixed(0)}k kg`;
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function Markets() {
  const { data: foss } = useDataset<FossTradeRow>("foss_trade");
  const { data: shareData } =
    useDataset<AlaskaExportShareRow>("alaska_export_share");

  // Pick the most recent full year (12 months) of foss_trade exports.
  const tradeYear = useMemo(() => {
    if (!foss) return null;
    const years = [...new Set(foss.filter((r) => r.flow === "export").map((r) => r.year))];
    if (!years.length) return null;
    // Prefer a year with all 12 months represented; else fall back to most recent.
    const yearMonths = new Map<number, Set<number>>();
    for (const r of foss) {
      if (r.flow !== "export" || r.month == null) continue;
      if (!yearMonths.has(r.year)) yearMonths.set(r.year, new Set());
      yearMonths.get(r.year)!.add(r.month);
    }
    const full = [...yearMonths.entries()]
      .filter(([, ms]) => ms.size === 12)
      .map(([y]) => y)
      .sort((a, b) => b - a);
    return full[0] ?? Math.max(...years);
  }, [foss]);

  // Year aggregates
  const yearAgg = useMemo(() => {
    if (!foss || tradeYear == null) return null;
    const rows = foss.filter(
      (r) => r.flow === "export" && r.year === tradeYear,
    );

    const byCountry = new Map<string, { value: number; kg: number }>();
    const byProduct = new Map<string, { value: number; kg: number }>();
    const byBucket = new Map<string, { value: number; kg: number }>();
    let totalValue = 0;
    let totalKg = 0;

    for (const r of rows) {
      const v = r.value_usd ?? 0;
      const k = r.quantity_kg ?? 0;
      totalValue += v;
      totalKg += k;

      const country = normalizeCountry(r.country_name);
      const c = byCountry.get(country) ?? { value: 0, kg: 0 };
      c.value += v;
      c.kg += k;
      byCountry.set(country, c);

      const productKey = r.fus_group2 || r.fus_group1 || "OTHER";
      const product = titleCase(productKey);
      const p = byProduct.get(product) ?? { value: 0, kg: 0 };
      p.value += v;
      p.kg += k;
      byProduct.set(product, p);

      const bucket = classifyToBucket(r.fus_group2 || r.fus_group1);
      const b = byBucket.get(bucket) ?? { value: 0, kg: 0 };
      b.value += v;
      b.kg += k;
      byBucket.set(bucket, b);
    }

    const topCountries = [...byCountry.entries()]
      .sort(([, a], [, b]) => b.value - a.value)
      .slice(0, 10)
      .map(([country, v]) => ({ country, ...v }));

    const topByValue = [...byProduct.entries()]
      .sort(([, a], [, b]) => b.value - a.value)
      .slice(0, 10)
      .map(([product, v]) => ({ product, ...v }));

    const topByVolume = [...byProduct.entries()]
      .sort(([, a], [, b]) => b.kg - a.kg)
      .slice(0, 10)
      .map(([product, v]) => ({ product, ...v }));

    return { totalValue, totalKg, topCountries, topByValue, topByVolume, byBucket };
  }, [foss, tradeYear]);

  // Alaska's share of US exports — sum (total_value_usd × alaska_share) per
  // species. Use the year with the largest US export value (a heuristic for
  // "most complete year" — current-year reporting trickles in monthly, so
  // the latest year on the wire is usually partial).
  const akShare = useMemo(() => {
    if (!shareData) return null;
    const years = [...new Set(shareData.map((r) => r.year))];
    let best: { year: number; usTotal: number } | null = null;
    for (const yr of years) {
      const us = shareData
        .filter(
          (r) =>
            r.flow === "export" &&
            r.year === yr &&
            (r.alaska_share ?? 0) > 0 &&
            (r.total_value_usd ?? 0) > 0,
        )
        .reduce((s, r) => s + (r.total_value_usd ?? 0), 0);
      if (us > 0 && (best == null || us > best.usTotal)) {
        best = { year: yr, usTotal: us };
      }
    }
    if (!best) return null;
    const yr = best.year;
    const exp = shareData.filter(
      (r) =>
        r.flow === "export" &&
        r.year === yr &&
        (r.alaska_share ?? 0) > 0 &&
        (r.total_value_usd ?? 0) > 0,
    );
    const rows = exp
      .map((r) => ({
        species: r.species,
        akShare: r.alaska_share ?? 0,
        totalUs: r.total_value_usd ?? 0,
        akValue: (r.alaska_share ?? 0) * (r.total_value_usd ?? 0),
        confidence: r.confidence,
      }))
      .sort((a, b) => b.akValue - a.akValue);
    const akTotal = rows.reduce((s, r) => s + r.akValue, 0);
    const usTotal = rows.reduce((s, r) => s + r.totalUs, 0);
    return { year: yr, rows, akTotal, usTotal };
  }, [shareData]);

  return (
    <article>
      <div className="hero tint" style={{ background: "linear-gradient(135deg, #7d4f00 0%, #b88c2e 100%)" }}>
        <span className="hero-eyebrow">Markets · Section 03</span>
      </div>
      <Crumb topic="Markets" />
      <span className="section-pill">03 · Section</span>
      <h1 className="page-title">Markets</h1>

      <p className="page-lede first-sentence">
        Most Alaska seafood leaves the state — and most of that leaves the
        country.
      </p>
      <p className="page-lede">
        US export records from NMFS Foreign Trade put a number on it: in the
        most recent year on the wire, roughly{" "}
        {akShare ? (
          <>
            <span className="font-mono">{fmtUsd(akShare.akTotal)}</span> of US
            seafood exports were Alaska-attributable, against a total US export
            line of <span className="font-mono">{fmtUsd(akShare.usTotal)}</span>
          </>
        ) : (
          "—"
        )}
        . Pollock, salmon, sablefish, halibut, and Pacific cod each have
        Alaska-share estimates above 90% in NMFS / Mainsail's
        product-classifier matching.
      </p>

      {akShare && (
        <>
          <h2 className="h2">Alaska-attributable exports, {akShare.year}</h2>
          <p className="section-intro">
            US export value classified by the Mainsail product-classifier as
            originating from Alaska, by species. Confidence reflects how
            distinctly the HTS code carries Alaska origin (e.g., pollock is
            essentially all Alaska; salmon products mix Alaska wild with
            Pacific Northwest and farmed imports re-exported).
          </p>
          <StatGrid
            stats={[
              {
                val: fmtUsd(akShare.akTotal),
                label: "Alaska-attributable value",
                sub: `${akShare.year}, sum across species`,
                accent: "accent",
              },
              {
                val: fmtUsd(akShare.usTotal),
                label: "US export total (matched HTS)",
                sub: `${akShare.year}, denominator for AK share`,
              },
              {
                val: fmtPct(akShare.akTotal / akShare.usTotal),
                label: "Alaska share of US exports",
                sub: `${akShare.year}, value basis`,
                accent: "accent",
              },
              {
                val: `${akShare.rows.length}`,
                label: "Species classified",
                sub: "matched against alaska_export_share",
              },
            ]}
          />
        </>
      )}

      {akShare && (
        <>
          <h2 className="h2">Alaska's share, by species — {akShare.year}</h2>
          <Card>
            <Table
              columns={[
                { label: "Species" },
                { label: "US export value", num: true },
                { label: "Alaska share", num: true },
                { label: "Alaska value", num: true },
                { label: "Confidence" },
              ]}
              rows={akShare.rows.slice(0, 10).map((r) => [
                r.species.charAt(0).toUpperCase() + r.species.slice(1),
                fmtUsd(r.totalUs),
                fmtPct(r.akShare),
                fmtUsd(r.akValue),
                r.confidence,
              ])}
              caption={`Year: ${akShare.year}. Source: Seamark Analytics, derived from NMFS FOSS Foreign Trade exports tagged with the alaska_export_share Mainsail product classifier.`}
            />
          </Card>
        </>
      )}

      {yearAgg && tradeYear != null && (
        <>
          <h2 className="h2">Top destinations, {tradeYear}</h2>
          <p className="section-intro">
            US seafood exports by destination country, ranked by value. Country
            names use UN short-name designations.
          </p>
          <Card>
            <Table
              columns={[
                { label: "Country" },
                { label: "Export value", num: true },
                { label: "Export volume", num: true },
                { label: "Share", num: true },
              ]}
              rows={yearAgg.topCountries.map((c) => [
                c.country,
                fmtUsd(c.value),
                fmtKg(c.kg),
                fmtPct(c.value / yearAgg.totalValue),
              ])}
              caption={`Year: ${tradeYear}. Source: Seamark Analytics, derived from NMFS FOSS Foreign Trade exports. Country names normalized to UN short-name designations.`}
            />
          </Card>

          <h2 className="h2">Top export products, by value — {tradeYear}</h2>
          <Card>
            <Table
              columns={[
                { label: "Product (FUS group)" },
                { label: "Value", num: true },
                { label: "Volume", num: true },
                { label: "Unit value", num: true },
              ]}
              rows={yearAgg.topByValue.map((p) => [
                p.product,
                fmtUsd(p.value),
                fmtKg(p.kg),
                p.kg > 0 ? `$${(p.value / p.kg).toFixed(2)} / kg` : "—",
              ])}
              caption={`Year: ${tradeYear}. Source: Seamark Analytics, derived from NMFS FOSS Foreign Trade exports, rolled up to the NMFS "Fisheries of the US" FUS_GROUP_2 product categories.`}
            />
          </Card>

          <h2 className="h2">Top export products, by volume — {tradeYear}</h2>
          <Card>
            <Table
              columns={[
                { label: "Product (FUS group)" },
                { label: "Volume", num: true },
                { label: "Value", num: true },
                { label: "Unit value", num: true },
              ]}
              rows={yearAgg.topByVolume.map((p) => [
                p.product,
                fmtKg(p.kg),
                fmtUsd(p.value),
                p.kg > 0 ? `$${(p.value / p.kg).toFixed(2)} / kg` : "—",
              ])}
              caption={`Year: ${tradeYear}. Source: same as above; reordered by volume to expose the high-volume / low-unit-value categories (meal & scrap, frozen surimi blocks).`}
            />
          </Card>
        </>
      )}

      <h2 className="h2">Pending — domestic + historical</h2>
      <p className="section-intro">
        The published FOSS dataset currently covers 2025 onward — historical
        years (back to ~2000) are next on the data engine's queue. The
        domestic market (US retail and foodservice) is largely qualitative;
        NMFS does not publish a clean state-of-origin breakdown of US-domestic
        consumption.
      </p>

      <Note>
        <b>Status.</b> Trade tables on this page are live from{" "}
        <code>foss_trade</code> and <code>alaska_export_share</code>.
        Historical years and the domestic-market section ship as the
        underlying datasets extend. Full IA in{" "}
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
