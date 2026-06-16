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
import ChartCard from "../ChartCard";
import { StackedBar } from "../SmChart";
import { ACCENT } from "../colors";

const TEAL = "#2f6b73";
const CWAK = "Coastal Western Alaska";
// Compact thousands: 16,877 → "17k", 4,771 → "4.8k", 880 → "880".
const k = (v: number) =>
  v >= 10000 ? `${Math.round(v / 1000)}k` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString();
// Coastal Western Alaska genetic group = these AYK + Bristol Bay systems
// (confirmed against the AFSC baseline; Bristol Bay / Nushagak group with CWAK).
const CWAK_RIVERS = [
  ["Yukon basin", "Yukon"],
  ["Kuskokwim basin", "Kuskokwim"],
  ["Nushagak River", "Nushagak"],
] as const;

export default function ChinookSlide() {
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

  // Per-year removal totals → bycatch share, for the cited year + the range.
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

  // Full genetic origin breakdown of the bycatch (latest GSI year).
  const gsiYear = useMemo(() => (gsi && gsi.length ? Math.max(...gsi.map((r) => r.year)) : null), [gsi]);
  const breakdown = useMemo(() => {
    if (!gsi || gsiYear == null) return [];
    return gsi.filter((r) => r.year === gsiYear).sort((a, b) => b.mean_pct - a.mean_pct);
  }, [gsi, gsiYear]);
  const cwakPct = breakdown.find((r) => r.region === CWAK)?.mean_pct ?? null;
  const cwakBycatch = removals && cwakPct != null ? Math.round(removals.bycatch * (cwakPct / 100)) : null;

  const rivers = useMemo(() => {
    if (!cdt || !removals) return [];
    return CWAK_RIVERS.map(([key, label]) => {
      const rows = cdt.filter((r) => r.drainage === key && r.actual_count != null);
      if (rows.length === 0) return null;
      const used = rows.find((r) => r.year === removals.year) ?? rows.reduce((a, b) => (b.year > a.year ? b : a));
      return { label, value: used.actual_count!, year: used.year };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [cdt, removals]);

  // Total counted escapement of the region's three major drainages, vs the
  // Coastal-Western-Alaska-origin bycatch — sized as area-proportional squares.
  const escTotal = rivers.reduce((a, r) => a + r.value, 0);
  const squarePx = (val: number, base: number) =>
    escTotal > 0 ? Math.max(46, Math.round(base * Math.sqrt(val / escTotal))) : base;
  const segGray = ["#9a9a9a", "#bdbdbd", "#dcdcdc"];
  const breakdownColor = (region: string, i: number) =>
    region === CWAK ? ACCENT : ["#7b6a4f", "#a08a7a", "#c4bcae", "#dcd6ca", "#e8e3d8"][i % 5];

  return (
    <div className="sm-slide">
      <div className="sm-slide-kicker">Bycatch · 01</div>
      <h2 className="sm-slide-title">Chinook salmon</h2>

      <div className="sm-block">
        <div className="sm-block-label">The long view</div>
        <ChartCard
          label="Chinook bycatch · 1991–2024"
          source="NMFS PSC (BSAI + GOA)"
          title="Chinook taken as groundfish bycatch, by year."
          caption="Pollock trawl is the largest source. Bycatch peaked near 170,000 in 2007, then fell sharply after the 60,000-fish hard cap took effect in 2011."
        >
          {series.length > 0 ? (
            <StackedBar data={series} xKey="year" keys={["Bycatch"]} colors={[ACCENT]} height={240} yFormatter={(v) => `${Math.round(v / 1000)}k`} />
          ) : (
            <div className="sm-chart-body placeholder">Loading…</div>
          )}
        </ChartCard>
      </div>

      {/* SHOW THE WORK + multi-year context */}
      <div className="sm-block">
        <div className="sm-block-label">
          Where the {removals ? `${removals.pct.toFixed(0)}%` : "8%"} comes from — every Chinook taken in Alaska, {removals ? removals.year : "2023"}
        </div>
        {removals ? (
          <>
            <div className="sm-magbar">
              <span style={{ width: `${(removals.commercial / removals.total) * 100}%`, background: segGray[0] }} />
              <span style={{ width: `${(removals.sport / removals.total) * 100}%`, background: segGray[1] }} />
              <span style={{ width: `${(removals.subsistence / removals.total) * 100}%`, background: segGray[2] }} />
              <span style={{ width: `${removals.pct}%`, background: ACCENT }} />
            </div>
            <div className="sm-magbar-legend">
              <span><span className="sw" style={{ background: segGray[0] }} />Commercial {k(removals.commercial)} ({Math.round((removals.commercial / removals.total) * 100)}%)</span>
              <span><span className="sw" style={{ background: segGray[1] }} />Sport {k(removals.sport)} ({Math.round((removals.sport / removals.total) * 100)}%)</span>
              <span><span className="sw" style={{ background: segGray[2] }} />Subsistence {k(removals.subsistence)} ({Math.round((removals.subsistence / removals.total) * 100)}%)</span>
              <span><span className="sw" style={{ background: ACCENT }} />Bycatch {k(removals.bycatch)} ({removals.pct.toFixed(1)}%)</span>
            </div>
            <div className="sm-magbar-cap">
              Of <b style={{ color: "var(--ink)" }}>{k(removals.total)}</b> Chinook taken by people in {removals.year}, trawl bycatch accounted for <b>{removals.pct.toFixed(1)}%</b>.
            </div>
            {shareRange && (
              <div className="sm-context">
                {removals.year} is a representative year: across {shareRange.from}–{shareRange.to} the bycatch share ranged{" "}
                <b>{shareRange.lo}–{shareRange.hi}%</b>, averaging about {shareRange.mean}%.
              </div>
            )}
            <div className="sm-context">
              {removals.year} is the most recent year with all four categories in hand. Subsistence harvest is gathered through community surveys that ADF&amp;G compiles carefully, so that piece arrives a year or two behind the others — it sets how current this picture can be.
            </div>
          </>
        ) : (
          <div className="sm-chart-body placeholder short">Loading…</div>
        )}
      </div>

      {/* WHERE THE BYCATCH COMES FROM (genetics) */}
      <div className="sm-block">
        <div className="sm-block-label">Where the bycatch comes from{gsiYear ? ` · ${gsiYear} genetics` : ""}</div>
        {breakdown.length > 0 ? (
          <>
            <div className="sm-magbar">
              {breakdown.map((r, i) => (
                <span key={r.region} style={{ width: `${r.mean_pct}%`, background: breakdownColor(r.region, i) }} />
              ))}
            </div>
            <div className="sm-magbar-legend">
              {breakdown.filter((r) => r.mean_pct >= 1).map((r, i) => (
                <span key={r.region}><span className="sw" style={{ background: breakdownColor(r.region, i) }} />{r.region} {r.mean_pct.toFixed(0)}%</span>
              ))}
            </div>
            <div className="sm-magbar-cap">
              Nearly half — <b>{cwakPct?.toFixed(0)}%</b> — is Coastal Western Alaska origin (the Yukon, Kuskokwim, Norton Sound and Bristol Bay systems). The rest comes from the North Alaska Peninsula, British Columbia, and the West Coast — rivers far from the Western Alaska runs in the news.
            </div>
          </>
        ) : (
          <div className="sm-chart-body placeholder short">Loading…</div>
        )}
      </div>

      {/* CWAK BYCATCH vs RIVER ESCAPEMENT — two area-proportional squares */}
      <div className="sm-block">
        <div className="sm-block-label">The Western Alaska share, against those rivers{removals ? ` · ${removals.year}` : ""}</div>
        {cwakBycatch != null && rivers.length > 0 ? (
          <>
            <div className="sm-squares">
              <figure className="sm-square">
                <div className="sm-square-box" style={{ width: squarePx(cwakBycatch, 200), height: squarePx(cwakBycatch, 200), background: ACCENT }} />
                <figcaption>
                  <span className="sm-square-val">{k(cwakBycatch)}</span>
                  <span className="sm-square-lbl">Bycatch of Coastal Western Alaska origin</span>
                  <span className="sm-square-sub">{breakdown.length ? `${cwakPct?.toFixed(0)}% of the ${k(removals.bycatch)} bycatch` : ""}</span>
                </figcaption>
              </figure>
              <figure className="sm-square">
                <div className="sm-square-box" style={{ width: 200, height: 200, background: TEAL }} />
                <figcaption>
                  <span className="sm-square-val">{k(escTotal)}</span>
                  <span className="sm-square-lbl">Escapement into the region's three major rivers</span>
                  <span className="sm-square-sub">{rivers.map((r) => `${r.label} ${k(r.value)}`).join(" · ")}</span>
                </figcaption>
              </figure>
            </div>
            <div className="sm-magbar-cap" style={{ fontSize: 13, color: "var(--ink-2)" }}>
              Set against the same year's counted escapement for the Yukon, Kuskokwim, and Nushagak, the Coastal-Western-Alaska-origin bycatch is about{" "}
              <b style={{ color: "var(--ink)" }}>{escTotal > 0 ? Math.round((cwakBycatch / escTotal) * 100) : 0}%</b> of those three runs combined.
            </div>
            <div className="sm-context">
              Could it all land on one depressed run? The genetics carve out the <b>upper and middle Yukon</b> — Western Alaska's most depleted, Canada-bound stocks — as their own group: <b>under 1%</b> of the bycatch. Within Coastal Western Alaska the share resolves to the region, not the individual river, so it cannot be assigned to the Kuskokwim, lower Yukon, or Nushagak alone.
            </div>
          </>
        ) : (
          <div className="sm-chart-body placeholder short">Loading…</div>
        )}
      </div>

      <div className="sm-note">
        <div className="sm-note-label">Reaching the river</div>
        <p>
          Most bycatch is immature fish, years from spawning, that face heavy natural mortality at sea before they would ever return. Accounting for that, the federal bycatch-impact analysis estimates the pollock fishery removes on the order of <b>2%</b> of the Chinook that would have reached western Alaska rivers — a real loss to runs already far below their goals, but a small share of the shortfall.{" "}
          <a href="https://www.kuskosalmon.org/s/Chum-EIS-App_5_Chinook_Feb-2025.pdf" target="_blank" rel="noreferrer">NPFMC / AFSC impact analysis</a>
        </p>
      </div>

      <div className="sm-note">
        <div className="sm-note-label">What's being done</div>
        <p>
          The pollock fleet fishes under mandatory industry Incentive Plan Agreements: vessels share near-real-time bycatch data to trigger &quot;rolling hotspot&quot; area closures, and are required to use salmon-excluder gear that lets salmon escape the net underwater. Hard caps (60,000 Chinook, with a 47,591 performance standard) have applied since 2011.{" "}
          <a href="https://www.fisheries.noaa.gov/alaska/bycatch/chinook-salmon-bycatch-management-alaska" target="_blank" rel="noreferrer">NOAA Fisheries</a>
        </p>
      </div>

      <div className="sm-note">
        <div className="sm-note-label">Other pressures on the runs</div>
        <p>
          Western Alaska's Chinook face stressors that have nothing to do with trawl. Yukon water temperatures reached 22°C in 2019 — above the 18°C heat-stress threshold — and an Ichthyophonus parasite outbreak surged after 2021. At sea, record numbers of pink salmon (wild and hatchery, much of it Asian) compete for the same food and are linked to smaller body size and weaker survival across the Bering Sea.{" "}
          <a href="https://www.science.org/content/article/alaska-s-salmon-plummet-scientists-home-killer" target="_blank" rel="noreferrer">Science (AAAS)</a> ·{" "}
          <a href="https://doi.org/10.3354/meps14402" target="_blank" rel="noreferrer">Ruggerone &amp; Irvine</a>
        </p>
      </div>

      {/* METHODOLOGY */}
      <div className="sm-method">
        <div className="sm-method-label">Data sources & methodology</div>
        <p>
          <b>Bycatch.</b> Chinook taken incidentally in the federal groundfish fisheries (Bering Sea / Aleutian Islands and Gulf of Alaska), from NMFS Prohibited Species Catch (PSC) annual mortality estimates. The long-view chart is the full 1991–2024 record; pollock trawl is the dominant source.
        </p>
        <p>
          <b>&quot;Every Chinook taken in Alaska&quot;</b> sums the published human-removal categories for the most recent year in which all reported: <b>commercial</b> harvest (ADF&amp;G, statewide, numbers of fish), <b>sport</b> harvest kept (ADF&amp;G Statewide Harvest Survey), <b>subsistence</b> harvest (ADF&amp;G / USFWS statewide), and <b>bycatch</b> (NMFS PSC). The bycatch share is bycatch ÷ that total. It excludes in-river escapement (fish that reach the spawning grounds) and natural mortality, and the sport figure counts kept fish only — catch-and-release mortality is not included here.
        </p>
        <p>
          <b>Origin.</b> Genetic stock identification (GSI) of the BSAI Chinook bycatch, by reporting group, from the NOAA AFSC / NPFMC annual genetics report — a single-year sample. The &quot;Coastal Western Alaska&quot; group spans the Kuskokwim, lower/coastal Yukon, Norton Sound, and Bristol Bay (incl. Nushagak) systems; the Western-Alaska-origin estimate is bycatch × that group's share. GSI resolves the region but cannot be split among individual rivers, and a multi-year series is not yet available.
        </p>
        <p>
          <b>Escapement.</b> Counted in-river escapement by drainage (ADF&amp;G), one authoritative count per drainage-year. Bycatch and escapement are shown for the same cited year. &quot;Peak&quot; is the highest count in each drainage's record.{" "}
          <a href="https://meetings.npfmc.org/" target="_blank" rel="noreferrer">NPFMC salmon genetics reports</a>.
        </p>
      </div>
    </div>
  );
}
