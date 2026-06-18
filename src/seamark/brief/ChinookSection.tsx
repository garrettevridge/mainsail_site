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
import { Section, Block, Magbar, Squares, Source, Notes, Methodology, k, type Seg } from "./parts";

const GSI_FMP = "BSAI";
const WESTERN_AK = new Set([
  "Coastal Western Alaska",
  "Kuskokwim/Bristol Bay", "Yukon Alaska", "Seward Peninsula/Norton Sound",
]);
const UPPER_YUKON = new Set(["Up/Mid Yukon", "Yukon Canada"]);
const CANADA = new Set(["British Columbia", "Yukon Canada", "Up/Mid Yukon"]);
const NORTH_PEN = "North Alaska Peninsula";
const CWAK_RIVERS = [
  ["Yukon basin", "Yukon"],
  ["Kuskokwim basin", "Kuskokwim"],
  ["Nushagak River", "Nushagak"],
] as const;

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

  const bsaiGsi = useMemo(() => (gsi ? gsi.filter((r) => r.fmp_area === GSI_FMP) : []), [gsi]);
  const gsiYear = useMemo(() => (bsaiGsi.length ? Math.max(...bsaiGsi.map((r) => r.year)) : null), [bsaiGsi]);
  const breakdown = useMemo(() => {
    if (gsiYear == null) return [];
    return bsaiGsi
      .filter((r) => r.year === gsiYear)
      .sort((a, b) => {
        const aw = WESTERN_AK.has(a.region) ? 1 : 0;
        const bw = WESTERN_AK.has(b.region) ? 1 : 0;
        return aw !== bw ? bw - aw : b.mean_pct - a.mean_pct;
      });
  }, [bsaiGsi, gsiYear]);
  const pctOf = (rows: ChinookGsiRow[], pred: (r: ChinookGsiRow) => boolean) =>
    rows.filter(pred).reduce((a, r) => a + r.mean_pct, 0);
  const westernPct = breakdown.length ? pctOf(breakdown, (r) => WESTERN_AK.has(r.region)) : null;
  const naPenPct = breakdown.length ? pctOf(breakdown, (r) => r.region === NORTH_PEN) : null;
  const alaskaTotalPct = westernPct != null && naPenPct != null ? Math.round(westernPct + naPenPct) : null;

  // Western-Alaska share of the bycatch in each sampled year, for the trend note.
  const westernByYear = useMemo(() => {
    const years = [...new Set(bsaiGsi.map((r) => r.year))].sort((a, b) => a - b);
    return years.map((year) => ({ year, pct: pctOf(bsaiGsi.filter((r) => r.year === year), (r) => WESTERN_AK.has(r.region)) }));
  }, [bsaiGsi]);

  const rivers = useMemo(() => {
    if (!cdt) return [];
    return CWAK_RIVERS.map(([key, label]) => {
      const rows = cdt.filter((r) => r.drainage === key && r.actual_count != null);
      if (rows.length === 0) return null;
      const used = rows.reduce((a, b) => (b.year > a.year ? b : a));
      return { label, value: used.actual_count!, year: used.year };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [cdt]);
  const escTotal = rivers.reduce((a, r) => a + r.value, 0);
  const escYear = rivers.length ? Math.max(...rivers.map((r) => r.year)) : null;
  const sqPx = (v: number) => (escTotal > 0 ? Math.max(46, Math.round(200 * Math.sqrt(v / escTotal))) : 200);

  // River context is anchored on the most recent year with BOTH a genetic
  // sample and published escapement (escapement lags the genetics by a year),
  // so the numerator and denominator come from the same season.
  const gsiYearSet = useMemo(() => new Set(bsaiGsi.map((r) => r.year)), [bsaiGsi]);
  const ctxYear = escYear != null && gsiYearSet.has(escYear) ? escYear : gsiYear;
  const ctxRows = useMemo(() => (ctxYear == null ? [] : bsaiGsi.filter((r) => r.year === ctxYear)), [bsaiGsi, ctxYear]);
  const ctxWesternPct = ctxRows.length ? pctOf(ctxRows, (r) => WESTERN_AK.has(r.region)) : null;
  const ctxUpperYukonPct = ctxRows.length ? pctOf(ctxRows, (r) => UPPER_YUKON.has(r.region)) : null;
  const ctxCatch = ctxRows[0]?.total_catch ?? null;
  const ctxCwakBycatch = ctxCatch != null && ctxWesternPct != null ? Math.round(ctxCatch * (ctxWesternPct / 100)) : null;

  // ---- presentational shaping ----
  const mortalityCols = removals
    ? [
        { name: "Commercial", value: removals.commercial, color: NEUTRAL[0] },
        { name: "Sport", value: removals.sport, color: NEUTRAL[1] },
        { name: "Subsistence", value: removals.subsistence, color: NEUTRAL[2] },
        { name: "Bycatch", value: removals.bycatch, color: ACCENT },
      ]
    : [];

  // Collapse the 13 reporting groups into four readable buckets.
  const originSegs: Seg[] = useMemo(() => {
    if (breakdown.length === 0) return [];
    const west = pctOf(breakdown, (r) => WESTERN_AK.has(r.region));
    const napen = pctOf(breakdown, (r) => r.region === NORTH_PEN);
    const canada = pctOf(breakdown, (r) => CANADA.has(r.region));
    const other = Math.max(0, 100 - west - napen - canada);
    return [
      { name: "Western Alaska", w: west, color: ACCENT, val: `${west.toFixed(0)}%` },
      { name: NORTH_PEN, w: napen, color: NEUTRAL[0], val: `${napen.toFixed(0)}%` },
      { name: "Canada", w: canada, color: NEUTRAL[1], val: `${canada.toFixed(0)}%` },
      { name: "Other Pacific", w: other, color: NEUTRAL[2], val: `${other.toFixed(0)}%` },
    ];
  }, [breakdown]);

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
              refLines={[{ y: 60000, label: "60k hard cap" }]}
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
        title="The genetic origin of the Bering Sea bycatch."
        caption={westernPct != null && gsiYear != null ? <>In {gsiYear}, about <b>{westernPct.toFixed(0)}%</b> of the bycatch traced to Western Alaska — the Kuskokwim, Bristol Bay, Yukon and Norton Sound systems. Another <b>{naPenPct != null ? naPenPct.toFixed(0) : "—"}%</b> came from the North Alaska Peninsula. Combined, about <b>{alaskaTotalPct ?? "—"}%</b> of the bycatch traced to Alaska stocks.</> : undefined}
        note={westernByYear.length > 1 ? <>That {westernPct?.toFixed(0)}% is the highest Western-Alaska share in the {westernByYear.length} years of genetic sampling — up from {westernByYear.slice(0, -1).map((d) => `${d.pct.toFixed(0)}% in ${d.year}`).join(" and ")}.</> : undefined}
      >
        {originSegs.length > 0 && <Magbar segs={originSegs} />}
      </Block>

      {/* BLOCK 4 — squares */}
      {ctxCwakBycatch != null && rivers.length > 0 && (
        <Block
          variant="alt"
          label={`Bycatch in context${ctxYear ? ` · ${ctxYear}` : ""}`}
          title="The Western-origin bycatch, set against river escapement."
          note={<>Anchoring on {ctxYear} — the most recent year with both a genetic sample and counted escapement — the Western-Alaska-origin bycatch was about <b>{escTotal > 0 ? Math.round((ctxCwakBycatch / escTotal) * 100) : 0}%</b> of the Yukon, Kuskokwim and Nushagak runs combined. The Canadian-origin upper Yukon — the most depleted, treaty-bound stocks — was {ctxUpperYukonPct != null && ctxUpperYukonPct < 1 ? "under 1%" : `about ${ctxUpperYukonPct?.toFixed(0)}%`} of the bycatch.</>}
        >
          <Squares
            a={{ px: sqPx(ctxCwakBycatch), color: ACCENT, val: k(ctxCwakBycatch), lbl: "Bycatch of Western Alaska origin", sub: `${ctxWesternPct?.toFixed(0)}% of the ${ctxYear} bycatch (${ctxCatch != null ? k(ctxCatch) : "—"})` }}
            b={{ px: 200, color: TEAL, val: k(escTotal), lbl: "Escapement into the region's three major rivers", sub: `${rivers.map((r) => `${r.label} ${k(r.value)}`).join(" · ")}${escYear ? ` · ${escYear}` : ""}` }}
          />
        </Block>
      )}

      <Notes
        items={[
          { label: "Reaching the river", body: <>Most bycatch is immature fish, years from spawning, that face heavy natural mortality at sea before they would ever return. Accounting for that, the federal impact analysis estimates the pollock fishery removes on the order of <b>2%</b> of the Chinook that would have reached western Alaska rivers — a real loss to runs already below their goals.</> },
          { label: "Regulation", body: <>The pollock fleet fishes under mandatory Incentive Plan Agreements: vessels share near-real-time data to trigger rolling-hotspot closures and must use salmon-excluder gear that lets salmon escape the net underwater. Hard caps — 60,000 Chinook, with a 47,591 performance standard — have applied since 2011.</> },
          { label: "Other pressures", body: <>Western Alaska's Chinook face several other documented stressors. Yukon water hit 22°C in 2019 — above the 18°C heat-stress threshold — and an Ichthyophonus parasite outbreak surged after 2021. At sea, record pink-salmon abundance competes for the same food, linked to smaller body size and weaker survival across the Bering Sea.</> },
        ]}
      />

      <Methodology
        items={[
          { strong: "Bycatch.", body: "Chinook taken incidentally in the federal groundfish fisheries (BSAI + GOA), from NMFS Prohibited Species Catch annual mortality estimates, 1991–2024. Pollock trawl is the dominant source." },
          { strong: "Every Chinook taken.", body: "Sums the published human-removal categories for the most recent year all reported: commercial and sport harvest plus subsistence (ADF&G), and bycatch (NMFS PSC). Excludes escapement and natural mortality; sport counts kept fish only." },
          { strong: "Origin.", body: "Genetic stock identification of the BSAI bycatch by reporting group (NOAA AFSC / NPFMC), most recent year. “Western Alaska origin” sums the Kuskokwim, Bristol Bay, Yukon and Norton Sound groups; the Canadian upper Yukon is kept separate." },
        ]}
      />

    </Section>
  );
}
