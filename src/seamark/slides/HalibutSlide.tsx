import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type {
  IphcSourceMortalityRow,
  MonitoredCatchRow,
  DiscardMortalityRateRow,
} from "../../api/types";
import ChartCard from "../ChartCard";
import { StackedBar } from "../SmChart";
import { ACCENT } from "../colors";

const TEAL = "#2f6b73";
// Compact tonnes: 9,004 → "9.0k", 1,982 → "2.0k", 594 → "594".
const k = (v: number) =>
  v >= 10000 ? `${Math.round(v / 1000)}k` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v).toLocaleString();

// IPHC mortality sources → readable labels, ordered for the removals bar.
const SOURCE_LABEL: Record<string, string> = {
  commercial_landings: "Directed commercial",
  recreational: "Sport",
  nondirected_discard: "Bycatch (other fisheries)",
  directed_discard: "Directed discard",
  subsistence: "Subsistence",
};

export default function HalibutSlide() {
  const { data: iphc } = useDataset<IphcSourceMortalityRow>("iphc_mortality_by_source");
  const { data: mc } = useDataset<MonitoredCatchRow>("monitored_catch");
  const { data: dmr } = useDataset<DiscardMortalityRateRow>("discard_mortality_rates");

  // Long view: halibut bycatch (non-directed discard mortality) over time.
  const series = useMemo(() => {
    if (!iphc) return [];
    return iphc
      .filter((r) => r.source === "nondirected_discard" && r.mortality_tonnes != null && r.mortality_tonnes > 0)
      .sort((a, b) => a.year - b.year)
      .map((r) => ({ year: r.year, Bycatch: r.mortality_tonnes! }));
  }, [iphc]);

  // Removals: every halibut killed in the most recent complete year, by source.
  const removals = useMemo(() => {
    if (!iphc) return null;
    const complete = iphc.filter((r) => r.source !== "total" && r.mortality_tonnes != null && r.is_preliminary === 0);
    if (complete.length === 0) return null;
    const year = Math.max(...complete.map((r) => r.year));
    const parts = Object.keys(SOURCE_LABEL)
      .map((src) => ({ src, label: SOURCE_LABEL[src], t: iphc.find((r) => r.year === year && r.source === src)?.mortality_tonnes ?? 0 }))
      .filter((p) => p.t > 0);
    const total = parts.reduce((a, p) => a + p.t, 0);
    const bycatch = parts.find((p) => p.src === "nondirected_discard")?.t ?? 0;
    const commercial = parts.find((p) => p.src === "commercial_landings")?.t ?? 0;
    return { year, parts, total, bycatch, commercial, pct: (bycatch / total) * 100 };
  }, [iphc]);

  // Who takes the bycatch: halibut discard mortality by gear, latest year.
  const byGear = useMemo(() => {
    if (!mc) return [];
    const hal = mc.filter((r) => r.species_group === "Pacific Halibut" && r.disposition === "Discarded" && r.monitored_or_total === "Total");
    if (hal.length === 0) return [];
    const year = Math.max(...hal.map((r) => r.year));
    const m = new Map<string, number>();
    for (const r of hal) {
      if (r.year !== year) continue;
      const key = /Trawl/.test(r.gear) ? (/Nonpelagic/.test(r.gear) ? "Bottom trawl" : "Pelagic trawl") : r.gear === "Pot" ? "Pot" : "Hook-and-line";
      m.set(key, (m.get(key) ?? 0) + r.metric_tons);
    }
    const total = [...m.values()].reduce((a, b) => a + b, 0);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([gear, t]) => ({ gear, t, pct: (t / total) * 100 }));
  }, [mc]);
  const gearMax = Math.max(...byGear.map((g) => g.t), 1);

  // Discard mortality rates by gear (current block), incl. sport release.
  // Collapse the BSAI/GOA split to one clean per-gear label, keeping the higher rate.
  const dmrLabel = (g: string) =>
    /Sport/.test(g) ? "sport (surface release)" : /Longline|hook/.test(g) ? "longline" : /Trawl/.test(g) ? "trawl" : /Pot/.test(g) ? "pot" : g.toLowerCase();
  const dmrRows = useMemo(() => {
    if (!dmr) return [];
    const hal = dmr.filter((r) => r.species === "Pacific halibut" && (r.effective_year_end == null || r.effective_year_end >= 2025));
    const best = new Map<string, number>();
    for (const r of hal) {
      const g = dmrLabel(r.gear_type);
      best.set(g, Math.max(best.get(g) ?? 0, r.dmr_value));
    }
    return [...best.entries()].sort((a, b) => b[1] - a[1]).map(([gear, v]) => ({ gear, pct: v * 100 }));
  }, [dmr]);

  const escTotal = removals?.commercial ?? 0;
  const squarePx = (val: number, base: number) =>
    escTotal > 0 ? Math.max(46, Math.round(base * Math.sqrt(val / escTotal))) : base;
  const segGray = ["#9a9a9a", "#bdbdbd", "#dcdcdc", "#eaeaea"];

  return (
    <div className="sm-slide">
      <div className="sm-slide-kicker">Bycatch · 03</div>
      <h2 className="sm-slide-title">Pacific halibut</h2>

      <div className="sm-block">
        <div className="sm-block-label">The long view</div>
        <ChartCard
          label="Halibut bycatch mortality · tonnes"
          source="IPHC mortality by source (non-directed discard)"
          title="Halibut killed as bycatch in other fisheries, by year."
          caption="Halibut taken incidentally in the groundfish fisheries — measured as net mortality in tonnes. It has fallen by more than half since the 1990s as bycatch limits tightened, though it remains the second-largest source of halibut mortality after the directed fishery."
        >
          {series.length > 0 ? (
            <StackedBar data={series} xKey="year" keys={["Bycatch"]} colors={[ACCENT]} height={240} yFormatter={(v) => `${Math.round(v / 1000)}k`} />
          ) : (
            <div className="sm-chart-body placeholder">Loading…</div>
          )}
        </ChartCard>
      </div>

      {/* SHOW THE WORK: every halibut killed, by source */}
      <div className="sm-block">
        <div className="sm-block-label">
          Where the {removals ? `${removals.pct.toFixed(0)}%` : "13%"} comes from — every halibut killed, {removals ? removals.year : "2024"}
        </div>
        {removals ? (
          <>
            <div className="sm-magbar">
              {removals.parts.map((p, i) => (
                <span key={p.src} style={{ width: `${(p.t / removals.total) * 100}%`, background: p.src === "nondirected_discard" ? ACCENT : segGray[i % 4] }} />
              ))}
            </div>
            <div className="sm-magbar-legend">
              {removals.parts.map((p, i) => (
                <span key={p.src}><span className="sw" style={{ background: p.src === "nondirected_discard" ? ACCENT : segGray[i % 4] }} />{p.label} {k(p.t)} t ({Math.round((p.t / removals.total) * 100)}%)</span>
              ))}
            </div>
            <div className="sm-magbar-cap">
              Of <b style={{ color: "var(--ink)" }}>{k(removals.total)} t</b> of halibut killed coastwide in {removals.year}, bycatch in other fisheries accounted for <b>{removals.pct.toFixed(1)}%</b> — the directed commercial and sport fisheries take most of the rest.
            </div>
          </>
        ) : (
          <div className="sm-chart-body placeholder short">Loading…</div>
        )}
      </div>

      {/* WHO TAKES THE BYCATCH · by gear */}
      <div className="sm-block">
        <div className="sm-block-label">Who takes the bycatch · by gear</div>
        {byGear.length > 0 ? (
          <>
            {byGear.map((g) => (
              <div className="sm-run" key={g.gear}>
                <div className="sm-run-head"><span className="lbl">{g.gear}</span><span className="val">{k(g.t)} t · {g.pct.toFixed(0)}%</span></div>
                <div className="sm-run-track"><div className="sm-run-fill" style={{ width: `${Math.max(2, (g.t / gearMax) * 100)}%`, background: TEAL }} /></div>
              </div>
            ))}
            <div className="sm-magbar-cap" style={{ fontSize: 13, color: "var(--ink-2)" }}>
              Halibut bycatch is split between bottom-trawl fleets (the Amendment 80 flatfish sector) and the hook-and-line groundfish fleets — both operate where halibut live. Pelagic (mid-water) pollock trawl takes very little, because it fishes off the bottom.
            </div>
          </>
        ) : (
          <div className="sm-chart-body placeholder short">Loading…</div>
        )}
      </div>

      {/* SCALE: bycatch vs directed fishery — two area-proportional squares */}
      {removals && (
        <div className="sm-block">
          <div className="sm-block-label">Bycatch against the directed fishery · {removals.year}</div>
          <div className="sm-squares">
            <figure className="sm-square">
              <div className="sm-square-box" style={{ width: squarePx(removals.bycatch, 200), height: squarePx(removals.bycatch, 200), background: ACCENT }} />
              <figcaption>
                <span className="sm-square-val">{k(removals.bycatch)} t</span>
                <span className="sm-square-lbl">Killed as bycatch</span>
                <span className="sm-square-sub">non-directed discard</span>
              </figcaption>
            </figure>
            <figure className="sm-square">
              <div className="sm-square-box" style={{ width: 200, height: 200, background: TEAL }} />
              <figcaption>
                <span className="sm-square-val">{k(removals.commercial)} t</span>
                <span className="sm-square-lbl">Landed by the directed commercial fishery</span>
                <span className="sm-square-sub">IPHC · {removals.year}</span>
              </figcaption>
            </figure>
          </div>
          <div className="sm-magbar-cap" style={{ fontSize: 13, color: "var(--ink-2)" }}>
            Every tonne of halibut killed as bycatch is a tonne the directed longline fleet and coastal communities do not land. The bycatch is about{" "}
            <b style={{ color: "var(--ink)" }}>{escTotal > 0 ? Math.round((removals.bycatch / escTotal) * 100) : 0}%</b> the size of the directed commercial catch.
          </div>
        </div>
      )}

      <div className="sm-note">
        <div className="sm-note-label">How bycatch becomes mortality — discard rates</div>
        <p>
          Not every halibut caught and thrown back dies. Managers apply gear-specific discard mortality rates to estimate how many do:{" "}
          {dmrRows.length > 0
            ? dmrRows.map((d, i) => (
                <span key={d.gear}>{i > 0 ? ", " : ""}<b>{Math.round(d.pct)}%</b> for {d.gear}</span>
              ))
            : "loading"}
          . Sport-caught halibut released at the surface survive far better than halibut crushed in a trawl net.{" "}
          <a href="https://www.npfmc.org/" target="_blank" rel="noreferrer">NPFMC / IPHC</a>
        </p>
      </div>

      {/* METHODOLOGY */}
      <div className="sm-method">
        <div className="sm-method-label">Data sources &amp; methodology</div>
        <p>
          <b>Mortality by source.</b> International Pacific Halibut Commission (IPHC) coastwide total mortality, in metric tonnes (net weight), by source: directed commercial landings, sport (recreational), subsistence, discard mortality in the directed fishery, and non-directed discard — the bycatch in the groundfish fisheries. The long-view chart is the non-directed discard series; the breakdown is the most recent non-preliminary year.
        </p>
        <p>
          <b>Bycatch by gear.</b> Halibut discard mortality by sector and gear, from NMFS catch accounting (monitored catch), most recent year. Gear is grouped as bottom (non-pelagic) trawl, pelagic trawl, hook-and-line, and pot. The Amendment 80 flatfish sector fishes bottom trawl; the directed groundfish longline fleets fish hook-and-line.
        </p>
        <p>
          <b>Discard mortality rates.</b> Gear-specific rates set by the Council and IPHC and applied to discarded halibut to estimate deaths. Trawl rates run high (catch is crushed); hook-and-line, pot, and surface-released sport fish run far lower. Rates shown are the current effective values.
        </p>
      </div>
    </div>
  );
}
