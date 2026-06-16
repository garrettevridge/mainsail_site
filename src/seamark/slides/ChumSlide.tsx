import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type {
  PscAnnualHistoricalRow,
  ChumGsiRow,
  SalmonEscapementRow,
} from "../../api/types";
import ChartCard from "../ChartCard";
import { StackedBar, MultiLine, Legend } from "../SmChart";
import { ACCENT } from "../colors";

const TEAL = "#2f6b73";
const HATCHERY = "#7b6a4f"; // warm taupe — the Asian-hatchery majority
// Compact: 1,018,000 → "1.0M", 48,767 → "49k", 4,048 → "4.0k", 880 → "880".
const k = (v: number) =>
  v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 10000 ? `${Math.round(v / 1000)}k` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString();

// The at-risk Western Alaska + Yukon runs — the stocks the bycatch debate is about.
// (SW Alaska / Alaska Peninsula is Alaska-origin too but a separate, healthier group.)
const ALASKA_GROUPS = new Set(["W Alaska", "Up/Mid Yukon"]);

// Struggling chum systems the river graphic compares against. Matched loosely by
// system_name so it wires up whatever exact labels the chum-escapement ingest
// (INGEST_SPECS P6) lands on. Empty today — salmon_escapement has no chum yet.
const CHUM_SYSTEMS: [RegExp, string][] = [
  [/yukon.*summer|summer.*chum/i, "Yukon summer"],
  [/yukon.*fall|fall.*chum/i, "Yukon fall"],
  [/kuskokwim/i, "Kuskokwim"],
  [/norton|kwiniuk|unalakleet/i, "Norton Sound"],
];

export default function ChumSlide() {
  const { data: psc } = useDataset<PscAnnualHistoricalRow>("psc_annual_historical");
  const { data: gsi } = useDataset<ChumGsiRow>("chum_gsi");
  const { data: esc } = useDataset<SalmonEscapementRow>("salmon_escapement");

  const series = useMemo(() => {
    if (!psc) return [];
    const m = new Map<number, number>();
    for (const r of psc) {
      if (r.species !== "chum" || r.mortality_count == null || r.year > 2024) continue;
      m.set(r.year, (m.get(r.year) ?? 0) + r.mortality_count);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([year, Bycatch]) => ({ year, Bycatch }));
  }, [psc]);
  const bycatchLatest = series.at(-1) ?? null;

  // Full genetic origin breakdown (latest GSI year).
  const gsiYear = useMemo(() => (gsi && gsi.length ? Math.max(...gsi.map((r) => r.year)) : null), [gsi]);
  const breakdown = useMemo(() => {
    if (!gsi || gsiYear == null) return [];
    return gsi.filter((r) => r.year === gsiYear).sort((a, b) => b.mean_pct - a.mean_pct);
  }, [gsi, gsiYear]);
  const asianPct = breakdown.filter((r) => /Asia/.test(r.region)).reduce((a, r) => a + r.mean_pct, 0);
  const alaskaPct = breakdown.filter((r) => ALASKA_GROUPS.has(r.region)).reduce((a, r) => a + r.mean_pct, 0);
  const alaskaBycatch = bycatchLatest ? Math.round(bycatchLatest.Bycatch * (alaskaPct / 100)) : null;

  // Origin over time — the multi-year genetics (2011→) so one year isn't read as
  // the whole story. Two aggregates: at-risk Western Alaska/Yukon vs Asian hatchery.
  const originSeries = useMemo(() => {
    if (!gsi) return [];
    const years = [...new Set(gsi.map((r) => r.year))].sort((a, b) => a - b);
    const share = (year: number, pred: (region: string) => boolean) =>
      gsi.filter((r) => r.year === year && pred(r.region)).reduce((a, r) => a + r.mean_pct, 0);
    return years.map((year) => ({
      year,
      "Western Alaska & Yukon": +share(year, (r) => ALASKA_GROUPS.has(r)).toFixed(1),
      "Asian hatchery": +share(year, (r) => /Asia/.test(r)).toFixed(1),
    }));
  }, [gsi]);
  const westernRange = useMemo(() => {
    if (originSeries.length === 0) return null;
    const v = originSeries.map((r) => r["Western Alaska & Yukon"]);
    return { lo: Math.round(Math.min(...v)), hi: Math.round(Math.max(...v)), mean: Math.round(v.reduce((a, b) => a + b, 0) / v.length), from: originSeries[0].year, to: originSeries.at(-1)!.year };
  }, [originSeries]);

  // Chum escapement for the struggling systems — empty until P6 ingest lands.
  const rivers = useMemo(() => {
    if (!esc) return [];
    const chum = esc.filter((r) => r.species === "chum" && r.actual_count != null);
    return CHUM_SYSTEMS.map(([re, label]) => {
      const rows = chum.filter((r) => re.test(r.system_name));
      if (rows.length === 0) return null;
      const latest = Math.max(...rows.map((r) => r.year));
      const row = rows.filter((r) => r.year === latest).reduce((a, b) => (b.actual_count! > a.actual_count! ? b : a));
      const goalLow = row.goal_lower;
      const belowGoal = goalLow != null && row.actual_count! < goalLow;
      return { label, value: row.actual_count!, year: latest, goalLow, goalHigh: row.goal_upper, belowGoal };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [esc]);
  const riverTotal = rivers.reduce((a, r) => a + r.value, 0);
  const belowGoal = rivers.filter((r) => r.belowGoal);
  const riverPx = (val: number, base: number) =>
    riverTotal > 0 ? Math.max(46, Math.round(base * Math.sqrt(val / riverTotal))) : base;
  const segGray = ["#9a9a9a", "#bdbdbd", "#dcdcdc", "#eaeaea"];
  const breakdownColor = (region: string) =>
    ALASKA_GROUPS.has(region) ? ACCENT : segGray[breakdown.filter((r) => !ALASKA_GROUPS.has(r.region)).findIndex((r) => r.region === region) % 4];

  return (
    <div className="sm-slide">
      <div className="sm-slide-kicker">Bycatch · 02</div>
      <h2 className="sm-slide-title">Chum salmon</h2>

      <div className="sm-block">
        <div className="sm-block-label">The long view</div>
        <ChartCard
          label="Chum bycatch · 1991–2024"
          source="NMFS PSC (BSAI + GOA)"
          title="Chum taken as groundfish bycatch, by year."
          caption="Chum bycatch swings widely year to year with ocean conditions — spiking above 700,000 in 2005 and again after 2017. For most of this record it carried no numeric limit; in 2026 the Council adopted the first cap aimed at Western Alaska chum."
        >
          {series.length > 0 ? (
            <StackedBar data={series} xKey="year" keys={["Bycatch"]} colors={[ACCENT]} height={240} yFormatter={(v) => `${Math.round(v / 1000)}k`} />
          ) : (
            <div className="sm-chart-body placeholder">Loading…</div>
          )}
        </ChartCard>
      </div>

      {/* WHERE THE BYCATCH COMES FROM (genetics) — the headline for chum */}
      <div className="sm-block">
        <div className="sm-block-label">Where the bycatch comes from{gsiYear ? ` · ${gsiYear} genetics` : ""}</div>
        {breakdown.length > 0 ? (
          <>
            <div className="sm-magbar">
              {breakdown.map((r) => (
                <span key={r.region} style={{ width: `${r.mean_pct}%`, background: breakdownColor(r.region) }} />
              ))}
            </div>
            <div className="sm-magbar-legend">
              {breakdown.filter((r) => r.mean_pct >= 1).map((r) => (
                <span key={r.region}><span className="sw" style={{ background: breakdownColor(r.region) }} />{r.region} {r.mean_pct.toFixed(0)}%</span>
              ))}
            </div>
            <div className="sm-magbar-cap">
              Most Bering Sea chum bycatch is hatchery fish from across the Pacific: about <b>{asianPct.toFixed(0)}%</b> is Asian-hatchery origin and another fifth is from the Eastern Gulf and Pacific Northwest. The Western Alaska and Yukon runs — shown in <b style={{ color: ACCENT }}>terracotta</b> — make up <b>{alaskaPct.toFixed(0)}%</b> in {gsiYear}{westernRange ? `, and have ranged ${westernRange.lo}–${westernRange.hi}% since ${westernRange.from}` : ""}.
            </div>
          </>
        ) : (
          <div className="sm-chart-body placeholder short">Loading…</div>
        )}
      </div>

      {/* ORIGIN OVER TIME — multi-year genetics so one year isn't the whole story */}
      <div className="sm-block">
        <div className="sm-block-label">Origin over time{westernRange ? ` · ${westernRange.from}–${westernRange.to}` : ""}</div>
        {originSeries.length > 1 ? (
          <>
            <MultiLine
              data={originSeries}
              xKey="year"
              keys={["Asian hatchery", "Western Alaska & Yukon"]}
              colors={[HATCHERY, ACCENT]}
              height={220}
              yFormatter={(v) => `${Math.round(v)}%`}
            />
            <Legend items={[{ label: "Asian hatchery (NE + SE Asia)", color: HATCHERY }, { label: "Western Alaska & Yukon", color: ACCENT }]} />
            <div className="sm-magbar-cap">
              The single-year snapshot isn't a fluke: Asian-hatchery fish have dominated the chum bycatch every year since {westernRange?.from}, and the Western Alaska / Yukon share has stayed a minor fraction — ranging <b>{westernRange?.lo}–{westernRange?.hi}%</b>, averaging about <b>{westernRange?.mean}%</b>. {gsiYear} ({alaskaPct.toFixed(0)}%) sits near the low end of that range.
            </div>
          </>
        ) : (
          <div className="sm-chart-body placeholder short">Loading…</div>
        )}
      </div>

      {/* THE ALASKA SHARE vs RIVER ESCAPEMENT — wired to chum escapement (P6) */}
      <div className="sm-block">
        <div className="sm-block-label">The Western Alaska share, against those rivers{bycatchLatest ? ` · ${bycatchLatest.year}` : ""}</div>
        {alaskaBycatch != null && rivers.length > 0 ? (
          <>
            <div className="sm-squares">
              <figure className="sm-square">
                <div className="sm-square-box" style={{ width: riverPx(alaskaBycatch, 200), height: riverPx(alaskaBycatch, 200), background: ACCENT }} />
                <figcaption>
                  <span className="sm-square-val">{k(alaskaBycatch)}</span>
                  <span className="sm-square-lbl">Bycatch of Western Alaska / Yukon origin</span>
                  <span className="sm-square-sub">{alaskaPct.toFixed(0)}% of the {k(bycatchLatest!.Bycatch)} chum bycatch</span>
                </figcaption>
              </figure>
              <figure className="sm-square">
                <div className="sm-square-box" style={{ width: 200, height: 200, background: TEAL }} />
                <figcaption>
                  <span className="sm-square-val">{k(riverTotal)}</span>
                  <span className="sm-square-lbl">Escapement into those rivers</span>
                  <span className="sm-square-sub">{rivers.map((r) => `${r.label.replace(" chum", "")} ${k(r.value)}`).join(" · ")}</span>
                </figcaption>
              </figure>
            </div>
            <div className="sm-magbar-cap" style={{ fontSize: 13, color: "var(--ink-2)" }}>
              The Western Alaska / Yukon-origin chum bycatch is under{" "}
              <b style={{ color: "var(--ink)" }}>{riverTotal > 0 ? Math.max(1, Math.round((alaskaBycatch / riverTotal) * 100)) : 0}%</b> of the counted escapement at these index projects — the Yukon basin sonar plus the Kuskokwim and Norton Sound indicator weirs. Genetics resolve the region, not the river, so the bycatch cannot be assigned to one run.
            </div>
            {belowGoal.length > 0 && (
              <div className="sm-context">
                The denominator is carried by the Yukon, where the summer run met its goal. The smaller index counts tell the harder story: {belowGoal.map((r) => `${r.label} ran ${k(r.value)} against a ${k(r.goalLow!)}–${k(r.goalHigh!)} goal`).join("; ")} — below escapement goals.
              </div>
            )}
          </>
        ) : (
          <div className="sm-chart-body placeholder short">
            River escapement graphic — wired to chum escapement, pending ingest (see methodology / INGEST_SPECS P6).
          </div>
        )}
      </div>

      <div className="sm-note">
        <div className="sm-note-label">Reaching the river</div>
        <p>
          Most chum bycatch is immature fish, years from spawning, that face heavy natural mortality at sea before they would return. Accounting for that, the federal bycatch-impact analysis puts the pollock fishery's effect at roughly <b>1%</b> of the chum returning to western Alaska rivers — a small share of a collapse driven mostly at sea and in the rivers.{" "}
          <a href="https://www.kuskosalmon.org/s/Chum-EIS-App_5_Chinook_Feb-2025.pdf" target="_blank" rel="noreferrer">NPFMC / AFSC</a>
        </p>
      </div>

      <div className="sm-note">
        <div className="sm-note-label">What's being done</div>
        <p>
          In February 2026 the Council adopted the first limit aimed at Western Alaska chum: a <b>45,000-fish cap</b> on Western-Alaska-origin chum — apportioned by genetics — in the Bering Sea pollock fishery. Exceed it and half the chum &quot;corridor&quot; closes for the rest of the June 10–August 31 season. It joins the salmon-excluder gear and real-time avoidance already required.{" "}
          <a href="https://www.npfmc.org/notice-of-council-action-western-alaska-chum-salmon-bycatch-limit/" target="_blank" rel="noreferrer">NPFMC</a>
        </p>
      </div>

      <div className="sm-note">
        <div className="sm-note-label">A crowded ocean</div>
        <p>
          Western Alaska chum fell to record lows after 2020, as a Bering Sea marine heatwave (2014–2019) reshaped the food web and shrank returning fish. The same waters now hold roughly five billion hatchery chum a year — most from Asia, which is why the bycatch genetics are hatchery-dominated — plus record numbers of pink salmon, whose abundance is linked to smaller size and weaker survival in chum across the Bering Sea.{" "}
          <a href="https://doi.org/10.3354/meps14491" target="_blank" rel="noreferrer">Farley et al.</a> ·{" "}
          <a href="https://doi.org/10.3354/meps14402" target="_blank" rel="noreferrer">Ruggerone &amp; Irvine</a>
        </p>
      </div>

      {/* METHODOLOGY */}
      <div className="sm-method">
        <div className="sm-method-label">Data sources &amp; methodology</div>
        <p>
          <b>Bycatch.</b> Chum taken incidentally in the federal groundfish fisheries (Bering Sea / Aleutian Islands and Gulf of Alaska), from NMFS Prohibited Species Catch (PSC) annual counts, 1991–2024. For most of this record chum bycatch was managed through area closures and incentive agreements with no numeric limit; in February 2026 the Council adopted a 45,000-fish cap on Western-Alaska-origin chum.
        </p>
        <p>
          <b>Origin.</b> Genetic stock identification (GSI) of the Bering Sea chum bycatch by reporting group, from the NOAA AFSC / NPFMC annual genetics reports, {westernRange ? `${westernRange.from}–${westernRange.to}` : "recent years"}. The breakdown bar is the most recent year ({gsiYear ?? "recent"}); the origin-over-time chart is the full series so a single year isn't read as the whole picture. The highlighted estimate sums the Western Alaska and Up/Mid Yukon groups — the at-risk runs in the bycatch debate; Southwest Alaska (Alaska Peninsula / Kodiak) is Alaska-origin too but reported as a separate group. The Asian-hatchery estimate sums the NE Asia and SE Asia groups. GSI resolves the region but cannot be split among individual rivers.
        </p>
        <p>
          <b>River escapement.</b> Counted chum escapement (ADF&amp;G), most recent year per system, from the same manifest table the Chinook slide uses. The systems are each region's primary escapement index project, and they are not the same scope: the Yukon counts are whole-basin sonar passage at Pilot Station (summer and fall runs), while the Kuskokwim (Kogrukluk weir) and Norton Sound (Kwiniuk tower) counts are single indicator weirs that sample a fraction of their basins. The total is therefore dominated by the Yukon, and the &quot;below goal&quot; flags use each project's own published escapement goal.
        </p>
      </div>
    </div>
  );
}
