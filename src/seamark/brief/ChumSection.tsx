import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type { PscAnnualHistoricalRow, ChumGsiRow, SalmonEscapementRow } from "../../api/types";
import { StackedBar, MultiLine } from "../SmChart";
import { ACCENT, TEAL, HATCHERY, NEUTRAL } from "../colors";
import { Section, Block, Magbar, Squares, Source, LegendLines, Notes, Methodology, k, type Seg } from "./parts";

const ALASKA_GROUPS = new Set(["W Alaska", "Up/Mid Yukon"]);
const CHUM_SYSTEMS: [RegExp, string][] = [
  [/yukon.*summer|summer.*chum/i, "Yukon summer"],
  [/yukon.*fall|fall.*chum/i, "Yukon fall"],
  [/kuskokwim/i, "Kuskokwim"],
  [/norton|kwiniuk|unalakleet/i, "Norton Sound"],
];

export default function ChumSection() {
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

  const gsiYear = useMemo(() => (gsi && gsi.length ? Math.max(...gsi.map((r) => r.year)) : null), [gsi]);
  const breakdown = useMemo(() => {
    if (!gsi || gsiYear == null) return [];
    return gsi.filter((r) => r.year === gsiYear).sort((a, b) => b.mean_pct - a.mean_pct);
  }, [gsi, gsiYear]);
  const asianPct = breakdown.filter((r) => /Asia/.test(r.region)).reduce((a, r) => a + r.mean_pct, 0);
  const alaskaPct = breakdown.filter((r) => ALASKA_GROUPS.has(r.region)).reduce((a, r) => a + r.mean_pct, 0);
  const usPacificPct = breakdown.filter((r) => /GOA|PNW/.test(r.region)).reduce((a, r) => a + r.mean_pct, 0);
  // Anchor the river comparison on the genetics year so the origin share and
  // the bycatch count it scales come from the same season.
  const bycatchInGsiYear = useMemo(() => (gsiYear == null ? null : series.find((s) => s.year === gsiYear)?.Bycatch ?? null), [series, gsiYear]);
  const alaskaBycatch = bycatchInGsiYear != null ? Math.round(bycatchInGsiYear * (alaskaPct / 100)) : null;

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
  const sqPx = (v: number) => (riverTotal > 0 ? Math.max(46, Math.round(200 * Math.sqrt(v / riverTotal))) : 200);

  const AK_REGIONS = new Set([...ALASKA_GROUPS, "SW Alaska", "Kotzebue Sound"]);
  const genColor = (region: string) =>
    AK_REGIONS.has(region) ? ACCENT : /Asia/.test(region) ? HATCHERY : NEUTRAL[2];
  const genSegs: Seg[] = breakdown.map((r) => ({ name: r.region, w: r.mean_pct, color: genColor(r.region), val: `${r.mean_pct.toFixed(0)}%` }));

  return (
    <Section
      id="chum"
      num="02"
      cat="Salmon Bycatch"
      title="Chum salmon"
      dek="Bering Sea chum bycatch swings sharply from year to year, even as Western Alaska residents face closures on their own rivers. The genetics point to an unexpected source: most of these chum originate in hatcheries in Russia and Japan, not Western Alaska's runs."
    >
      <Block
        label="The long view"
        title="Chum taken as groundfish bycatch, by year."
        caption="Chum bycatch swings widely with ocean conditions — spiking above 700,000 in 2005 and again after 2017. For most of this record it carried no numeric limit; in 2026 the Council adopted the first cap aimed at Western Alaska chum."
      >
        <div className="br-chart">
          {series.length > 0 ? (
            <StackedBar data={series} xKey="year" keys={["Bycatch"]} colors={[ACCENT]} height={240} yFormatter={(v) => `${Math.round(v / 1000)}k`} />
          ) : null}
          <Source>Source · NMFS PSC (BSAI + GOA) · fish per year</Source>
        </div>
      </Block>

      <Block
        variant="alt"
        label={`Where the bycatch comes from${gsiYear ? ` · ${gsiYear} genetics` : ""}`}
        title="Most of it is hatchery fish from across the Pacific."
        caption={breakdown.length ? <>About <b>{asianPct.toFixed(0)}%</b> is Asian-hatchery origin. The at-risk Western Alaska &amp; Yukon runs — the stocks the debate is about — make up <b>{alaskaPct.toFixed(0)}%</b>{westernRange ? <>, and have ranged {westernRange.lo}–{westernRange.hi}% since {westernRange.from}</> : null}.{usPacificPct > 0 ? <> Another <b>{usPacificPct.toFixed(0)}%</b> traces to the Eastern Gulf of Alaska and Pacific Northwest — like the Asian groups, largely hatchery production.</> : null}</> : undefined}
      >
        {genSegs.length > 0 && <Magbar segs={genSegs} />}
      </Block>

      <Block
        variant="div"
        label={`Origin over time${westernRange ? ` · ${westernRange.from}–${westernRange.to}` : ""}`}
        title="In historical perspective."
        caption={westernRange ? <>Asian-hatchery fish have dominated the chum bycatch every year since {westernRange.from}. The Western Alaska / Yukon share has ranged <b>{westernRange.lo}–{westernRange.hi}%</b>, averaging about {westernRange.mean}%.</> : undefined}
      >
        <div className="br-chart">
          {originSeries.length > 1 ? (
            <MultiLine data={originSeries} xKey="year" keys={["Asian hatchery", "Western Alaska & Yukon"]} colors={[HATCHERY, ACCENT]} height={240} yFormatter={(v) => `${Math.round(v)}%`} />
          ) : null}
          <LegendLines items={[{ color: HATCHERY, name: "Asian hatchery (NE + SE Asia)" }, { color: ACCENT, name: "Western Alaska & Yukon" }]} />
        </div>
      </Block>

      {alaskaBycatch != null && rivers.length > 0 && (
        <Block
          variant="alt"
          label={`Bycatch in context${gsiYear ? ` · ${gsiYear}` : ""}`}
          title="The Western-origin bycatch, set against river escapement."
          note={<>The Western Alaska / Yukon-origin chum bycatch is under <b>{riverTotal > 0 ? Math.max(1, Math.round((alaskaBycatch / riverTotal) * 100)) : 0}%</b> of the counted escapement at these index projects — the Yukon basin sonar plus the Kuskokwim and Norton Sound indicator weirs.{belowGoal.length ? <> The smaller counts tell the harder story: {belowGoal.map((r) => `${r.label} ran ${k(r.value)} against a ${k(r.goalLow!)}–${k(r.goalHigh!)} goal`).join("; ")} — below escapement goals.</> : null}</>}
        >
          <Squares
            a={{ px: sqPx(alaskaBycatch), color: ACCENT, val: k(alaskaBycatch), lbl: "Bycatch of Western Alaska / Yukon origin", sub: `${alaskaPct.toFixed(0)}% of the ${gsiYear} bycatch (${bycatchInGsiYear != null ? k(bycatchInGsiYear) : "—"})` }}
            b={{ px: 200, color: TEAL, val: k(riverTotal), lbl: "Escapement into those rivers", sub: rivers.map((r) => `${r.label} ${k(r.value)}`).join(" · ") }}
          />
        </Block>
      )}

      <Notes
        items={[
          { label: "Reaching the river", body: <>Most chum bycatch is immature fish that face heavy natural mortality at sea before they would return. Accounting for that, the federal impact analysis puts the pollock fishery's effect at roughly <b>1%</b> of the chum returning to western Alaska rivers.</> },
          { label: "Regulation", body: <>In February 2026 the Council adopted the first limit aimed at Western Alaska chum: a <b>45,000-fish cap</b> on Western-Alaska-origin chum, apportioned by genetics, in the Bering Sea pollock fishery. Exceed it and half the chum “corridor” closes for the rest of the season.</> },
          { label: "A crowded ocean", body: <>Western Alaska chum fell to record lows after 2020. The same waters now hold roughly five billion hatchery chum a year — most from Asia, which is why the bycatch genetics are hatchery-dominated — plus record pink salmon, linked to smaller size and weaker survival across the Bering Sea.</> },
        ]}
      />

      <Methodology
        items={[
          { strong: "Bycatch.", body: "Chum taken incidentally in the federal groundfish fisheries (BSAI + GOA), from NMFS PSC annual counts, 1991–2024. Managed through closures and incentive agreements with no numeric limit until the February 2026 cap." },
          { strong: "Origin.", body: "Genetic stock identification of the Bering Sea chum bycatch by reporting group (NOAA AFSC / NPFMC). The highlighted estimate sums the Western Alaska and Up/Mid Yukon groups; the Asian-hatchery estimate sums NE and SE Asia. Reporting groups are geographic, not split hatchery-versus-wild; the Eastern Gulf of Alaska / Pacific Northwest group is dominated by Southeast Alaska and PNW hatchery production, but the dataset does not isolate hatchery origin within it." },
          { strong: "Rivers.", body: "Counted chum escapement (ADF&G) at each region's index project — Yukon basin sonar (summer and fall), Kuskokwim and Norton Sound indicator weirs. The total is Yukon-dominated; below-goal flags use each project's published goal." },
        ]}
      />

    </Section>
  );
}
