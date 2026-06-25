import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type {
  PscAnnualHistoricalRow,
  ChinookDrainageTotalsRow,
  SalmonCommercialHarvestDataRow,
  SportHarvestDataRow,
  SubsistenceHarvestStatewideRow,
  ChinookGsiRow,
} from "../../api/types";
import { StackedBar, BarColumns } from "../SmChart";
import { ACCENT, TEAL, NEUTRAL } from "../colors";
import { Section, Block, Magbar, Source, Notes, Methodology, k, type Seg } from "./parts";
import OriginMap, { type OriginNode } from "./OriginMap";

const WESTERN_AK = new Set([
  "Coastal Western Alaska",
  "Kuskokwim/Bristol Bay", "Yukon Alaska", "Seward Peninsula/Norton Sound",
]);
const CANADA = new Set(["British Columbia", "Yukon Canada", "Up/Mid Yukon"]);

// Genetic reporting group → ADF&G escapement index projects
// (chinook_drainage_totals). Editorial crosswalk: the genetic groups are
// coarse regional aggregates while escapement is per-drainage, so we sum the
// matched-year counted escapement across each group's index projects. This is
// counted escapement at those projects — NOT a reconstructed run total.
const ESC_CROSSWALK: Record<string, { drainages: string[]; note?: string }> = {
  "Kuskokwim/Bristol Bay": { drainages: ["Kuskokwim basin", "Nushagak River"] },
  "Yukon Alaska": { drainages: ["Yukon basin"], note: "Yukon basin, U.S. + Canada combined" },
  "Cook Inlet": {
    drainages: [
      "Kenai River", "Kasilof River (Crooked Creek)", "Susitna basin",
      "Anchor River", "Ninilchik River", "Little Susitna River", "Deep Creek",
    ],
  },
  Copper: { drainages: ["Copper River"] },
  "Southeast Alaska": { drainages: ["Stikine River", "Taku River", "Unuk River", "Chilkat River"] },
  "Alsek/Situk": { drainages: ["Alsek River", "Situk River"] },
  "Chignik/Kodiak": { drainages: ["Karluk River", "Ayakulik River"] },
};

const pctOf = (rows: ChinookGsiRow[], pred: (r: ChinookGsiRow) => boolean) =>
  rows.filter(pred).reduce((a, r) => a + r.mean_pct, 0);
const isAlaska = (r: ChinookGsiRow) =>
  !CANADA.has(r.region) && r.region !== "Russia" && r.region !== "West Coast US";
const isOtherAlaska = (r: ChinookGsiRow) =>
  isAlaska(r) && !WESTERN_AK.has(r.region);

const makeSegs = (rows: ChinookGsiRow[]): Seg[] => {
  if (rows.length === 0) return [];
  const west = pctOf(rows, (r) => WESTERN_AK.has(r.region));
  const otherAk = pctOf(rows, isOtherAlaska);
  const canada = pctOf(rows, (r) => CANADA.has(r.region));
  const other = Math.max(0, 100 - west - otherAk - canada);
  return [
    { name: "Western Alaska", w: west, color: ACCENT, val: `${west.toFixed(0)}%` },
    { name: "Other Alaska", w: otherAk, color: TEAL, val: `${otherAk.toFixed(0)}%` },
    { name: "Canada", w: canada, color: NEUTRAL[0], val: `${canada.toFixed(0)}%` },
    { name: "West Coast US + other", w: other, color: NEUTRAL[1], val: `${other.toFixed(0)}%` },
  ];
};

export default function ChinookSection() {
  const { data: psc } = useDataset<PscAnnualHistoricalRow>("psc_annual_historical");
  const { data: cdt } = useDataset<ChinookDrainageTotalsRow>("chinook_drainage_totals");
  const { data: com } = useDataset<SalmonCommercialHarvestDataRow>("salmon_commercial_harvest");
  const { data: sport } = useDataset<SportHarvestDataRow>("sport_harvest");
  const { data: subs } = useDataset<SubsistenceHarvestStatewideRow>("subsistence_harvest_statewide");
  const { data: gsi } = useDataset<ChinookGsiRow>("chinook_gsi");

  const series = useMemo(() => {
    if (!psc) return [];
    const m = new Map<number, number>();
    for (const r of psc) {
      if (r.species !== "chinook" || r.mortality_count == null || r.year > 2024) continue;
      m.set(r.year, (m.get(r.year) ?? 0) + r.mortality_count);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([year, Bycatch]) => ({ year, Bycatch }));
  }, [psc]);

  const removalYears = useMemo(() => {
    if (!psc || !com || !sport || !subs) return [];
    const sy = <T,>(rows: T[], pred: (r: T) => boolean, val: (r: T) => number | null | undefined, y: number) =>
      rows.reduce((a, r) => a + (pred(r) && (r as { year: number }).year === y ? (val(r) ?? 0) : 0), 0);
    const out = [];
    for (let y = 2024; y >= 2010; y--) {
      const c = sy(com, (r) => r.species === "chinook", (r) => r.harvest_fish, y);
      const sp = sy(sport, (r) => r.species_name === "Chinook salmon" && r.record_type === "harvest", (r) => r.fish_count, y);
      const su = sy(subs, (r) => r.species === "chinook", (r) => r.harvest_count, y);
      const bc = sy(psc, (r) => r.species === "chinook", (r) => r.mortality_count, y);
      if (c > 0 && sp > 0 && su > 0 && bc > 0) {
        const total = c + sp + su + bc;
        out.push({ year: y, commercial: c, sport: sp, subsistence: su, bycatch: bc, total, pct: (bc / total) * 100 });
      }
    }
    return out;
  }, [psc, com, sport, subs]);

  const removals = removalYears[0] ?? null;

  // GSI: separate BSAI and GOA for the latest year only (GOA present from 2024).
  const allGsi = useMemo(() => gsi ?? [], [gsi]);
  const gsiYear = useMemo(() => (allGsi.length ? Math.max(...allGsi.map((r) => r.year)) : null), [allGsi]);

  const bsaiRows = useMemo(
    () => (gsiYear != null ? allGsi.filter((r) => r.year === gsiYear && r.fmp_area === "BSAI") : []),
    [allGsi, gsiYear],
  );
  const goaRows = useMemo(
    () => (gsiYear != null ? allGsi.filter((r) => r.year === gsiYear && r.fmp_area === "GOA") : []),
    [allGsi, gsiYear],
  );
  const bsaiCatch = bsaiRows[0]?.total_catch ?? null;
  const goaCatch = goaRows[0]?.total_catch ?? null;
  const bsaiSegs = useMemo(() => makeSegs(bsaiRows), [bsaiRows]);
  const goaSegs = useMemo(() => makeSegs(goaRows), [goaRows]);
  const bsaiWestPct = bsaiRows.length ? pctOf(bsaiRows, (r) => WESTERN_AK.has(r.region)) : null;
  const bsaiAlaskaPct = bsaiRows.length ? Math.round(pctOf(bsaiRows, isAlaska)) : null;
  const goaAlaskaPct = goaRows.length ? Math.round(pctOf(goaRows, isAlaska)) : null;

  // ---- origin map: most recent year with BOTH BSAI genetics and matching
  // western-river escapement (escapement lags genetics ~1 year). ----
  const matchedYear = useMemo(() => {
    if (!gsi || !cdt) return null;
    const gYears = new Set(gsi.filter((r) => r.fmp_area === "BSAI").map((r) => r.year));
    const eYears = new Set(
      cdt.filter((r) => r.drainage === "Kuskokwim basin" && r.actual_count != null).map((r) => r.year),
    );
    const common = [...gYears].filter((y) => eYears.has(y));
    return common.length ? Math.max(...common) : null;
  }, [gsi, cdt]);

  const matched = useMemo(() => {
    if (!gsi || matchedYear == null) return null;
    const rows = gsi.filter((r) => r.year === matchedYear && r.fmp_area === "BSAI");
    return rows.length ? { year: matchedYear, total: rows[0].total_catch, n: rows[0].n_samples } : null;
  }, [gsi, matchedYear]);

  const originNodes = useMemo<OriginNode[]>(() => {
    if (!gsi || matchedYear == null) return [];
    const escSum = (drainages: string[]): number | null => {
      if (!cdt) return null;
      let s = 0, hit = false;
      for (const r of cdt) {
        if (r.year === matchedYear && r.actual_count != null && drainages.includes(r.drainage)) {
          s += r.actual_count;
          hit = true;
        }
      }
      return hit ? s : null;
    };
    return gsi
      .filter((r) => r.year === matchedYear && r.fmp_area === "BSAI")
      .map((r) => {
        const xw = ESC_CROSSWALK[r.region];
        return {
          region: r.region,
          fish: Math.round((r.total_catch ?? 0) * (r.mean_pct / 100)),
          pct: r.mean_pct,
          ciLow: r.lower_ci ?? null,
          ciHigh: r.upper_ci ?? null,
          escapement: xw ? escSum(xw.drainages) : null,
          escapementNote: xw?.note,
        };
      })
      .sort((a, b) => b.fish - a.fish);
  }, [gsi, cdt, matchedYear]);

  // Newer genetics that can't yet be year-matched to escapement — context only.
  const latestGen = useMemo(() => {
    if (!gsi) return null;
    const bsai = gsi.filter((r) => r.fmp_area === "BSAI");
    if (!bsai.length) return null;
    const y = Math.max(...bsai.map((r) => r.year));
    if (matchedYear != null && y <= matchedYear) return null;
    const rows = bsai.filter((r) => r.year === y);
    const topPct = rows.filter((r) => r.region === "Kuskokwim/Bristol Bay").reduce((a, r) => a + r.mean_pct, 0);
    return { year: y, total: rows[0].total_catch, topPct };
  }, [gsi, matchedYear]);

  // ---- presentational shaping ----
  const mortalityCols = removals
    ? [
        { name: "Commercial", value: removals.commercial, color: NEUTRAL[0] },
        { name: "Sport", value: removals.sport, color: NEUTRAL[1] },
        { name: "Subsistence", value: removals.subsistence, color: NEUTRAL[2] },
        { name: "Bycatch", value: removals.bycatch, color: ACCENT },
      ]
    : [];

  return (
    <Section
      id="chinook"
      num="01"
      cat="Salmon Bycatch"
      title="Chinook salmon"
      dek="Western Alaska's king salmon runs are far below their goals. This section traces how much of the bycatch originates in those runs, and how it compares to other sources of mortality."
    >
      {/* BLOCK 1 — long view */}
      <Block
        label="The long view"
        title="Chinook taken as groundfish bycatch, by year."
        caption="Pollock trawl is the largest source of Chinook bycatch. It peaked near 170,000 in 2007, then fell sharply after the 60,000-fish hard cap took effect in 2011."
      >
        <div className="br-chart">
          {series.length > 0 ? (
            <StackedBar
              data={series}
              xKey="year"
              keys={["Bycatch"]}
              colors={[ACCENT]}
              height={240}
              yFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
          ) : null}
          <Source>Source · NMFS PSC (BSAI + GOA) · fish per year</Source>
        </div>
      </Block>

      {/* BLOCK 2 — removals */}
      <Block
        variant="alt"
        label={`Chinook mortality by source${removals ? ` · ${removals.year}` : ""}`}
        title="A comparison of Chinook mortality."
        caption={removals ? <>Each column counts the Chinook removed by one fishery in {removals.year}: the directed commercial, sport, and subsistence harvests, and the groundfish-fleet bycatch. Statewide, kept fish plus bycatch mortality — the most recent year all four are reported.</> : undefined}
        note={<>These are independent counts of different things, not slices of one total — they are not summed here. Escapement, the Chinook that reach the spawning grounds, is a separate category, set against the Western-Alaska bycatch further down.</>}
      >
        <div className="br-chart">
          {mortalityCols.length > 0 && <BarColumns data={mortalityCols} height={240} yFormatter={(v) => `${Math.round(v / 1000)}k`} />}
          <Source>Source · ADF&amp;G harvest (commercial, sport, subsistence) + NMFS PSC bycatch · fish</Source>
        </div>
      </Block>

      {/* BLOCK 3 — origin */}
      <Block
        variant="div"
        label={`Where the bycatch comes from${gsiYear ? ` · ${gsiYear} genetics` : ""}`}
        title="The genetic origins of Bering Sea and Gulf of Alaska Chinook bycatch."
        caption={gsiYear != null && bsaiWestPct != null ? <>In {gsiYear}, <b>{bsaiWestPct.toFixed(0)}%</b> of the BSAI bycatch{bsaiCatch != null ? <> ({k(bsaiCatch)} fish)</> : null} originated in Western Alaska — the Kuskokwim, Bristol Bay, Yukon and Norton Sound systems. Alaska stocks overall accounted for about <b>{bsaiAlaskaPct ?? "—"}%</b> of the BSAI catch. The GOA bycatch{goaCatch != null ? <> ({k(goaCatch)} fish)</> : null} had near-zero Western Alaska origin; its Alaska component was about <b>{goaAlaskaPct ?? "—"}%</b>, mostly Southeast Alaska.</> : undefined}
      >
        {(bsaiSegs.length > 0 || goaSegs.length > 0) && (
          <>
            {bsaiSegs.length > 0 && (
              <div className="br-fmp-chart">
                <div className="br-fmp-label">BSAI{bsaiCatch != null ? ` · ${k(bsaiCatch)} fish` : ""}</div>
                <Magbar segs={bsaiSegs} />
              </div>
            )}
            {goaSegs.length > 0 && (
              <div className="br-fmp-chart">
                <div className="br-fmp-label">GOA{goaCatch != null ? ` · ${k(goaCatch)} fish` : ""}</div>
                <Magbar segs={goaSegs} />
              </div>
            )}
          </>
        )}
      </Block>

      {/* BLOCK 4 — origin map (river systems behind the bycatch) */}
      {originNodes.length > 0 && matched && (
        <Block
          variant="alt"
          label={`Where the bycatch is from · ${matched.year} · mapped`}
          title="The river systems behind the bycatch."
          caption={<>Each circle sits on the river system its fish trace back to genetically, sized by the estimated number of {matched.year} Bering Sea Chinook bycatch fish of that origin — {k(matched.total)} fish in all, identified from {matched.n.toLocaleString()} sampled. Kuskokwim and Bristol Bay dominate; the rest is spread across the North Pacific rim, from Russia to the U.S. West Coast.</>}
          note={<>Genetics are published about a year ahead of the matching escapement, so the map pairs the most recent year both exist for the western rivers — <b>{matched.year}</b>. The teal ring marks that year's counted escapement where ADF&amp;G publishes it; the North Alaska Peninsula and Norton Sound have none to pair, and the Yukon basin count combines U.S. and Canadian fish. These are counts at index projects, not full run reconstructions.{latestGen ? <> The newer {latestGen.year} genetics — not yet matchable to escapement — looked different: a larger bycatch of about {k(latestGen.total)} fish, roughly {Math.round(latestGen.topPct)}% Kuskokwim/Bristol Bay.</> : null}</>}
        >
          <OriginMap nodes={originNodes} year={matched.year} total={matched.total} nSamples={matched.n} />
          <Source>Source · NOAA AFSC / NPFMC genetic stock ID (BSAI) + ADF&amp;G counted escapement · {matched.year}</Source>
        </Block>
      )}

      <Notes
        items={[
          { label: "Reaching the river", body: <>Most bycatch is immature fish, years from spawning, that face heavy natural mortality at sea before they would ever return. Accounting for that, the federal impact analysis estimates the pollock fishery removes on the order of <b>2%</b> of the Chinook that would have reached western Alaska rivers — a real loss to runs already below their goals.</> },
          { label: "Regulation", body: <>Both the BSAI and GOA pollock fleets fish under Chinook PSC caps, with mandatory salmon-excluder gear and near-real-time hotspot closures. The BSAI cap is two-tiered, keyed to a three-river abundance index (Unalakleet, Upper Yukon, Kuskokwim): <b>60,000</b> hard cap in normal years, <b>45,000</b> when the index falls at or below 250,000 fish. The GOA pollock and non-pollock trawl fleets operate under separate fixed limits.</> },
          { label: "Other pressures", body: <>Western Alaska's Chinook face several other documented stressors. Yukon water hit 22°C in 2019 — above the 18°C heat-stress threshold — and an Ichthyophonus parasite outbreak surged after 2021. At sea, record pink-salmon abundance competes for the same food, linked to smaller body size and weaker survival across the Bering Sea.</> },
        ]}
      />

      <Methodology
        items={[
          { strong: "Bycatch.", body: "Chinook taken incidentally in the federal groundfish fisheries (BSAI + GOA), from NMFS Prohibited Species Catch annual mortality estimates, 1991–2024. Pollock trawl is the dominant source. GOA pollock and non-pollock trawl fisheries operate under separate Chinook PSC limits — 18,316 and 6,684 for Central and Western GOA pollock respectively; 7,500 total for non-pollock GOA trawl." },
          { strong: "Every Chinook taken.", body: "Sums the published human-removal categories for the most recent year all reported: commercial and sport harvest plus subsistence (ADF&G), and bycatch (NMFS PSC). Excludes escapement and natural mortality; sport counts kept fish only." },
          { strong: 'Origin.', body: 'Genetic stock identification of the BSAI and GOA bycatch separately, by reporting group (NOAA AFSC / NPFMC), most recent year available for each area. The two fisheries are shown independently — their origin compositions differ substantially. “Western Alaska origin” sums the Kuskokwim, Bristol Bay, Yukon and Norton Sound groups; the Canadian upper Yukon is kept separate.' },
          { strong: "Origin map.", body: "The mapped view pairs BSAI bycatch genetics with ADF&G counted escapement for the most recent year both are published (escapement lags genetics ~1 year). Circle area is estimated bycatch fish of each origin (total catch × genetic mean). The teal escapement ring sums counted escapement across each group's index projects — counted escapement, not a reconstructed run; the Yukon basin figure combines U.S. and Canadian fish; the North Alaska Peninsula and Norton Sound have no matched escapement published." },
        ]}
      />

    </Section>
  );
}
