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
import { StackedBar } from "../SmChart";
import { ACCENT, TEAL, NEUTRAL } from "../colors";
import { Section, Block, Magbar, Squares, Source, Notes, Methodology, UpNext, k, type Seg } from "./parts";

const GSI_FMP = "BSAI";
const WESTERN_AK = new Set([
  "Coastal Western Alaska",
  "Kuskokwim/Bristol Bay", "Yukon Alaska", "Seward Peninsula/Norton Sound",
]);
const UPPER_YUKON = new Set(["Up/Mid Yukon", "Yukon Canada"]);
const CWAK_RIVERS = [
  ["Yukon basin", "Yukon"],
  ["Kuskokwim basin", "Kuskokwim"],
  ["Nushagak River", "Nushagak"],
] as const;

export default function ChinookSection({ onNext }: { onNext: () => void }) {
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
  const shareRange = useMemo(() => {
    if (removalYears.length === 0) return null;
    const pcts = removalYears.map((r) => r.pct);
    return { lo: Math.round(Math.min(...pcts)), hi: Math.round(Math.max(...pcts)), mean: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length), from: removalYears.at(-1)!.year, to: removalYears[0].year };
  }, [removalYears]);

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
  const sumGroups = (set: Set<string>) => breakdown.filter((r) => set.has(r.region)).reduce((a, r) => a + r.mean_pct, 0);
  const westernPct = breakdown.length ? sumGroups(WESTERN_AK) : null;
  const upperYukonPct = breakdown.length ? sumGroups(UPPER_YUKON) : null;
  const gsiCatch = breakdown[0]?.total_catch ?? null;
  const cwakBycatch = gsiCatch != null && westernPct != null ? Math.round(gsiCatch * (westernPct / 100)) : null;

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

  // ---- presentational shaping ----
  const removalSegs: Seg[] = removals
    ? [
        { name: "Commercial", w: (removals.commercial / removals.total) * 100, color: NEUTRAL[0], pct: `${Math.round((removals.commercial / removals.total) * 100)}%`, textColor: "#1a1916", val: k(removals.commercial) },
        { name: "Sport", w: (removals.sport / removals.total) * 100, color: NEUTRAL[1], pct: `${Math.round((removals.sport / removals.total) * 100)}%`, textColor: "#1a1916", val: k(removals.sport) },
        { name: "Subsistence", w: (removals.subsistence / removals.total) * 100, color: NEUTRAL[2], pct: `${Math.round((removals.subsistence / removals.total) * 100)}%`, textColor: "#1a1916", val: k(removals.subsistence) },
        { name: "Bycatch", w: removals.pct, color: ACCENT, pct: `${removals.pct.toFixed(1)}%`, textColor: "#fff", val: k(removals.bycatch) },
      ]
    : [];

  const originSegs: Seg[] = breakdown.map((r, i) => ({
    name: r.region,
    w: r.mean_pct,
    color: WESTERN_AK.has(r.region) ? ACCENT : NEUTRAL[i % NEUTRAL.length],
    val: `${r.mean_pct.toFixed(0)}%`,
  }));

  return (
    <Section
      id="chinook"
      num="01"
      cat="Salmon Bycatch"
      title="Chinook salmon"
      dek="Western Alaska's king salmon runs have collapsed, and the trawl fleet is the loudest target. The data tells a more specific story about how much bycatch costs those rivers — and what else is at work."
    >
      {/* BLOCK 1 — long view */}
      <Block
        label="The long view"
        title="Chinook taken as groundfish bycatch, by year."
        caption="Pollock trawl is the largest source. Bycatch peaked near 170,000 in 2007, then fell sharply after the 60,000-fish hard cap took effect in 2011."
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
        label={`Where the ${removals ? `${removals.pct.toFixed(0)}%` : "8%"} comes from`}
        title={`Every Chinook taken in Alaska, ${removals ? removals.year : "2023"}.`}
        caption={removals ? <>Of <b>{k(removals.total)}</b> Chinook taken by people in {removals.year}, trawl bycatch accounted for under a tenth.</> : undefined}
        note={shareRange ? <>Across {shareRange.from}–{shareRange.to} the bycatch share ranged <b>{shareRange.lo}–{shareRange.hi}%</b>, averaging about {shareRange.mean}%. {removals!.year} is the most recent year with all four categories reported.</> : undefined}
      >
        {removalSegs.length > 0 && <Magbar segs={removalSegs} inlinePct />}
      </Block>

      {/* BLOCK 3 — origin */}
      <Block
        variant="div"
        label={`Where the bycatch comes from${gsiYear ? ` · ${gsiYear} genetics` : ""}`}
        title="The genetic origin of the Bering Sea bycatch."
        caption={westernPct != null ? <>About <b>{westernPct.toFixed(0)}%</b> is Western Alaska origin — the Kuskokwim, Bristol Bay, Yukon and Norton Sound systems, in <b style={{ color: ACCENT }}>terracotta</b>. The rest belongs to runs far from the rivers in the news.</> : undefined}
      >
        {originSegs.length > 0 && <Magbar segs={originSegs} />}
      </Block>

      {/* BLOCK 4 — squares */}
      {cwakBycatch != null && rivers.length > 0 && (
        <Block
          variant="alt"
          label={`The Western Alaska share, against those rivers${gsiYear ? ` · ${gsiYear}` : ""}`}
          title="Set against the rivers, the Western-origin bycatch is small."
          note={<>Against counted escapement for the Yukon, Kuskokwim, and Nushagak, the Western-Alaska-origin bycatch is about <b>{escTotal > 0 ? Math.round((cwakBycatch / escTotal) * 100) : 0}%</b> of those three runs combined. The Canadian-origin upper Yukon — the most depleted, treaty-bound stocks — resolves to about {upperYukonPct != null && upperYukonPct < 1 ? "under 1" : upperYukonPct?.toFixed(0)}% of the bycatch.</>}
        >
          <Squares
            a={{ px: sqPx(cwakBycatch), color: ACCENT, val: k(cwakBycatch), lbl: "Bycatch of Western Alaska origin", sub: `${westernPct?.toFixed(0)}% of the ${gsiYear} bycatch (${gsiCatch != null ? k(gsiCatch) : "—"})` }}
            b={{ px: 200, color: TEAL, val: k(escTotal), lbl: "Escapement into the region's three major rivers", sub: `${rivers.map((r) => `${r.label} ${k(r.value)}`).join(" · ")}${escYear ? ` · ${escYear}` : ""}` }}
          />
        </Block>
      )}

      <Notes
        items={[
          { label: "Reaching the river", body: <>Most bycatch is immature fish, years from spawning, that face heavy natural mortality at sea before they would ever return. Accounting for that, the federal impact analysis estimates the pollock fishery removes on the order of <b>2%</b> of the Chinook that would have reached western Alaska rivers — a real loss to runs already below their goals, but a small share of the shortfall.</> },
          { label: "What's being done", body: <>The pollock fleet fishes under mandatory Incentive Plan Agreements: vessels share near-real-time data to trigger rolling-hotspot closures and must use salmon-excluder gear that lets salmon escape the net underwater. Hard caps — 60,000 Chinook, with a 47,591 performance standard — have applied since 2011.</> },
          { label: "Other pressures", body: <>Western Alaska's Chinook face stressors unrelated to trawl. Yukon water hit 22°C in 2019 — above the 18°C heat-stress threshold — and an Ichthyophonus parasite outbreak surged after 2021. At sea, record pink-salmon abundance competes for the same food, linked to smaller body size and weaker survival across the Bering Sea.</> },
        ]}
      />

      <Methodology
        items={[
          { strong: "Bycatch.", body: "Chinook taken incidentally in the federal groundfish fisheries (BSAI + GOA), from NMFS Prohibited Species Catch annual mortality estimates, 1991–2024. Pollock trawl is the dominant source." },
          { strong: "Every Chinook taken.", body: "Sums the published human-removal categories for the most recent year all reported: commercial and sport harvest plus subsistence (ADF&G), and bycatch (NMFS PSC). Excludes escapement and natural mortality; sport counts kept fish only." },
          { strong: "Origin.", body: "Genetic stock identification of the BSAI bycatch by reporting group (NOAA AFSC / NPFMC), most recent year. “Western Alaska origin” sums the Kuskokwim, Bristol Bay, Yukon and Norton Sound groups; the Canadian upper Yukon is kept separate." },
        ]}
      />

      <UpNext label="Up next · 02" title="Chum salmon" onClick={onNext} />
    </Section>
  );
}
