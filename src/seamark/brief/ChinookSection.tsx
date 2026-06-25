import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type {
  PscAnnualHistoricalRow,
  SalmonCommercialHarvestDataRow,
  SportHarvestDataRow,
  SubsistenceHarvestStatewideRow,
  ChinookGsiRow,
} from "../../api/types";
import { StackedBar, BarColumns } from "../SmChart";
import { ACCENT, TEAL, NEUTRAL } from "../colors";
import { Section, Block, Magbar, Source, Notes, Methodology, k, type Seg } from "./parts";
import OriginTable, { type OriginTableRow } from "./OriginTable";

const WESTERN_AK = new Set([
  "Coastal Western Alaska",
  "Kuskokwim/Bristol Bay", "Yukon Alaska", "Seward Peninsula/Norton Sound",
]);
const CANADA = new Set(["British Columbia", "Yukon Canada", "Up/Mid Yukon"]);
// Alaska river-system genetic groups (the rows of the origin table).
// Everything else (British Columbia, U.S. West Coast, Russia, Canadian Yukon)
// is non-Alaska and summarised in the caption.
const AK_GROUPS = new Set([
  "Kuskokwim/Bristol Bay", "Yukon Alaska", "Seward Peninsula/Norton Sound",
  "North Alaska Peninsula", "Cook Inlet", "Copper", "Chignik/Kodiak",
  "Southeast Alaska", "Alsek/Situk",
]);

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

  // Bycatch fish count by Alaska genetic reporting group, latest BSAI year.
  const tableRows = useMemo<OriginTableRow[]>(() => {
    if (!gsiYear || !allGsi.length) return [];
    const bsai = allGsi.filter((r) => r.year === gsiYear && r.fmp_area === "BSAI" && AK_GROUPS.has(r.region));
    return bsai
      .map((r) => ({
        region: r.region,
        fish: Math.round((r.total_catch ?? 0) * (r.mean_pct / 100)),
        pct: r.mean_pct,
      }))
      .sort((a, b) => b.fish - a.fish);
  }, [allGsi, gsiYear]);

  // Share of the bycatch tracing outside Alaska (BC, U.S. West Coast, Russia,
  // Canadian Yukon) — noted in the caption.
  const outsideAkPct = useMemo(() => {
    if (!gsiYear || !allGsi.length) return null;
    const rows = allGsi.filter((r) => r.year === gsiYear && r.fmp_area === "BSAI");
    if (!rows.length) return null;
    return rows.filter((r) => !AK_GROUPS.has(r.region)).reduce((a, r) => a + r.mean_pct, 0);
  }, [allGsi, gsiYear]);

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

      {/* BLOCK 4 — river systems behind the bycatch */}
      {tableRows.length > 0 && gsiYear != null && (
        <Block
          variant="alt"
          label={`Where the bycatch comes from · ${gsiYear} genetics`}
          title="The river systems behind the bycatch."
          caption={<>Each row is an Alaska river system that the {gsiYear} Bering Sea bycatch traces back to genetically, with the estimated number of bycatch fish of that origin. Kuskokwim and Bristol Bay dominate.{outsideAkPct != null ? <> Another {Math.round(outsideAkPct)}% of the bycatch traced outside Alaska — British Columbia, the U.S. West Coast, Russia, and the Canadian Yukon — and is not listed here.</>  : null}</>}
          note={<>Fish counts are total BSAI catch multiplied by each group's genetic mean percentage. The Yukon Alaska count combines U.S.- and Canadian-origin fish, as the stock crosses the international boundary before returning. Genetic stock identification is from NOAA AFSC / NPFMC sampling of the BSAI pollock fleet.</>}
        >
          <OriginTable rows={tableRows} year={gsiYear} />
          <Source>Source · NOAA AFSC / NPFMC genetic stock ID (BSAI) · {gsiYear}</Source>
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
          { strong: "Origin by river system.", body: "Each row is an Alaska genetic reporting group from the NOAA AFSC / NPFMC genetic stock identification of the BSAI pollock bycatch, most recent year available. Bycatch fish per group are estimated as total BSAI catch multiplied by each group's genetic mean percentage. The Yukon Alaska figure combines U.S.- and Canadian-origin fish. Non-Alaska origins (British Columbia, U.S. West Coast, Russia, Canadian Yukon) are noted in the caption but not listed." },
        ]}
      />

    </Section>
  );
}
