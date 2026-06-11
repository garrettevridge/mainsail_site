import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type {
  PscAnnualHistoricalRow,
  SalmonCommercialHarvestDataRow,
  SportHarvestDataRow,
  SubsistenceHarvestStatewideRow,
  ChinookDrainageTotalsRow,
  ChinookGsiRow,
} from "../../api/types";
import ChartCard from "../ChartCard";
import { StackedBar, Legend } from "../SmChart";
import { SERIES } from "../colors";

const SOURCE_KEYS = ["Pollock bycatch", "Commercial", "Sport", "Subsistence", "Escapement"] as const;
const BYAREA_KEYS = ["BSAI", "GOA"] as const;

export default function Chinook() {
  const { data: psc } = useDataset<PscAnnualHistoricalRow>("psc_annual_historical");
  const { data: commercial } = useDataset<SalmonCommercialHarvestDataRow>("salmon_commercial_harvest");
  const { data: sport } = useDataset<SportHarvestDataRow>("sport_harvest");
  const { data: subsistence } = useDataset<SubsistenceHarvestStatewideRow>("subsistence_harvest_statewide");
  const { data: drainage } = useDataset<ChinookDrainageTotalsRow>("chinook_drainage_totals");
  const { data: gsi } = useDataset<ChinookGsiRow>("chinook_gsi");

  const byAreaData = useMemo(() => {
    if (!psc) return [];
    const byYear = new Map<number, Record<string, number>>();
    for (const r of psc) {
      if (r.species !== "chinook") continue;
      if (r.mortality_count == null) continue;
      const row = byYear.get(r.year) ?? { year: r.year };
      row[r.region] = (row[r.region] ?? 0) + r.mortality_count;
      byYear.set(r.year, row);
    }
    return [...byYear.values()].sort((a, b) => (a.year as number) - (b.year as number));
  }, [psc]);

  const accountingData = useMemo(() => {
    const byYear = new Map<number, Record<string, number>>();
    const bump = (yr: number, k: string, v: number) => {
      if (!Number.isFinite(v) || v <= 0) return;
      const row = byYear.get(yr) ?? { year: yr };
      row[k] = (row[k] ?? 0) + v;
      byYear.set(yr, row);
    };
    if (psc) for (const r of psc) {
      if (r.species === "chinook" && r.mortality_count != null) bump(r.year, "Pollock bycatch", r.mortality_count);
    }
    if (commercial) for (const r of commercial) {
      if (r.species === "chinook" && r.harvest_fish != null) bump(r.year, "Commercial", r.harvest_fish);
    }
    if (sport) for (const r of sport) {
      if (r.species_name === "Chinook salmon" && r.record_type === "harvest" && r.fish_count != null)
        bump(r.year, "Sport", r.fish_count);
    }
    if (subsistence) for (const r of subsistence) {
      if (r.species === "chinook" && r.harvest_count != null) bump(r.year, "Subsistence", r.harvest_count);
    }
    if (drainage) for (const r of drainage) {
      if (r.actual_count != null) bump(r.year, "Escapement", r.actual_count);
    }
    return [...byYear.values()].sort((a, b) => (a.year as number) - (b.year as number));
  }, [psc, commercial, sport, subsistence, drainage]);

  // Chinook bycatch as a share of all Chinook taken by people — the sum of the
  // published removal categories (commercial + sport + subsistence + bycatch),
  // excluding in-river escapement. Averaged over recent years where every
  // category has reported, so partial-year tails don't distort it.
  const bycatchShare = useMemo(() => {
    const complete = accountingData.filter(
      (r) =>
        (r["Commercial"] ?? 0) > 0 &&
        (r["Sport"] ?? 0) > 0 &&
        (r["Subsistence"] ?? 0) > 0 &&
        (r["Pollock bycatch"] ?? 0) > 0
    );
    const recent = complete.slice(-5);
    if (recent.length === 0) return null;
    const shares = recent.map((r) => {
      const removals =
        (r["Commercial"] ?? 0) +
        (r["Sport"] ?? 0) +
        (r["Subsistence"] ?? 0) +
        (r["Pollock bycatch"] ?? 0);
      return (r["Pollock bycatch"] / removals) * 100;
    });
    const avg = shares.reduce((a, b) => a + b, 0) / shares.length;
    return {
      avg: Math.round(avg),
      lo: Math.round(Math.min(...shares)),
      hi: Math.round(Math.max(...shares)),
    };
  }, [accountingData]);

  // Sport-fishery Chinook caught-and-released mortality. `sport_harvest` carries
  // both total catch and kept harvest, so released = catch − harvest (source
  // data). The mortality rate applied to released fish is an EXPLICIT
  // methodology assumption stated in the prose — not a published figure.
  const SPORT_RELEASE_MORTALITY = 0.1; // documented assumption (see prose)
  const sportRelease = useMemo(() => {
    if (!sport) return null;
    const byYear = new Map<number, { catch: number; harvest: number }>();
    for (const r of sport) {
      if (r.species_name !== "Chinook salmon" || r.fish_count == null) continue;
      const o = byYear.get(r.year) ?? { catch: 0, harvest: 0 };
      if (r.record_type === "catch") o.catch += r.fish_count;
      else if (r.record_type === "harvest") o.harvest += r.fish_count;
      byYear.set(r.year, o);
    }
    const candidates = [...byYear.entries()].filter(([, o]) => o.catch > 0 && o.harvest > 0);
    if (candidates.length === 0) return null;
    const [year, o] = candidates.reduce((a, b) => (b[0] > a[0] ? b : a));
    const released = o.catch - o.harvest;
    if (released <= 0) return null;
    return {
      year,
      released,
      mortality: Math.round(released * SPORT_RELEASE_MORTALITY),
      ratePct: Math.round(SPORT_RELEASE_MORTALITY * 100),
    };
  }, [sport]);

  const gsiLatest = useMemo(() => {
    if (!gsi || gsi.length === 0) return { year: null as number | null, rows: [] as ChinookGsiRow[] };
    const year = Math.max(...gsi.map((r) => r.year));
    const rows = gsi.filter((r) => r.year === year).sort((a, b) => b.mean_pct - a.mean_pct);
    return { year, rows };
  }, [gsi]);

  const gsiChartData = useMemo(
    () => gsiLatest.rows.map((r) => ({ region: r.region, share: r.mean_pct })),
    [gsiLatest]
  );

  return (
    <section id="chinook" className="sm-section">
      <div className="sm-marker">
        <span className="num">Chinook bycatch</span>
        <span className="title">BSAI and Gulf of Alaska</span>
      </div>

      <h2 className="sm-h2">
        Chinook salmon bycatch, <span className="accent">in context.</span>
      </h2>

      <p className="sm-p">
        Chinook salmon are taken incidentally in the Bering Sea and Gulf of
        Alaska pollock fisheries each year — recently in the thousands to low
        tens of thousands of fish. A federal cap, introduced in 2011, limits
        BSAI Chinook bycatch in the pollock trawl fishery to 60,000 fish. The
        chart below shows the counts by management area and year.
      </p>

      <ChartCard
        label="Fig 3.1 · primary · 1991–present"
        source="NOAA AKR Catch Accounting · NPFMC"
        title="Chinook bycatch in groundfish fisheries, BSAI + GOA, by year."
        height="tall"
        caption={
          <>
            Stacked bars by year and FMP area. Hard cap for BSAI Chinook in
            the pollock trawl fishery is 60,000 fish; recent BSAI Chinook
            bycatch has run well below the cap. Earlier years reflect the
            pre-cap regulatory environment (PSC limit introduced via
            Amendment 91, 2011).
          </>
        }
      >
        {byAreaData.length > 0 ? (
          <>
            <StackedBar
              data={byAreaData}
              xKey="year"
              keys={[...BYAREA_KEYS]}
              height={360}
              yFormatter={(v) => v.toLocaleString()}
            />
            <Legend
              items={BYAREA_KEYS.map((k, i) => ({ label: k, color: SERIES[i] }))}
            />
          </>
        ) : (
          <div className="sm-chart-body placeholder tall">Loading…</div>
        )}
      </ChartCard>

      <p className="sm-p">
        Chinook are removed from the system in several other ways: commercial
        nets, sport anglers, and subsistence harvest, alongside the counted
        escapement that returns to spawn. Across recent years, groundfish bycatch
        accounted for roughly{" "}
        {bycatchShare
          ? `${bycatchShare.avg} percent (ranging ${bycatchShare.lo}–${bycatchShare.hi}%)`
          : "well under a fifth"}{" "}
        of all Chinook taken by people — commercial, sport, subsistence, and
        bycatch combined. The chart below stacks those sources together by year.
      </p>

      <ChartCard
        label="Fig 3.2 · context · long record"
        source="NMFS PSC · ADF&G commercial · ADF&G SWHS · NPAFC subsistence · Mainsail drainage rollup"
        title="Total Chinook accounting across Alaska, by source, by year."
        height="tall"
        caption={
          <>
            Stacked bars by year: commercial harvest (statewide), sport
            harvest (kept fish), subsistence (statewide), pollock bycatch
            (BSAI + GOA), counted in-river escapement (sum across canonical
            drainages). Series begin where their record begins, so the stack
            grows toward the present as datasets come online. The visual
            point: bycatch is one column in a tall stack.
          </>
        }
      >
        {accountingData.length > 0 ? (
          <>
            <StackedBar
              data={accountingData}
              xKey="year"
              keys={[...SOURCE_KEYS]}
              height={360}
              yFormatter={(v) => v.toLocaleString()}
            />
            <Legend
              items={SOURCE_KEYS.map((k, i) => ({ label: k, color: SERIES[i] }))}
            />
          </>
        ) : (
          <div className="sm-chart-body placeholder tall">Loading…</div>
        )}
      </ChartCard>

      <p className="sm-p">
        The sport figure counts only the Chinook anglers keep, not those they
        catch and release. Released fish outnumber kept fish in the sport Chinook
        fishery
        {sportRelease ? `: roughly ${sportRelease.released.toLocaleString()} released in ${sportRelease.year}` : ""}
        . Applying a commonly-used {sportRelease ? sportRelease.ratePct : 10}-percent
        catch-and-release mortality rate — a methodology assumption, not a
        published figure — implies on the order of{" "}
        {sportRelease ? sportRelease.mortality.toLocaleString() : "tens of thousands of"}{" "}
        additional Chinook deaths beyond the landed sport catch.
      </p>

      <p className="sm-p">
        Bycatch is not drawn evenly from every run; it is a genetic mixture, and
        stock-of-origin sampling shows where it comes from. The case study below
        summarizes the latest genetics. <strong>Pending data:</strong> run-by-run
        attribution — translating a year's bycatch into the number of fish that
        would have reached the Yukon, the Kuskokwim, and other indicator rivers —
        requires the multi-year genetics series joined to drainage run
        reconstructions, not yet wired into this engine.
      </p>

      <div className="sm-case">
        <div className="sm-case-label">Case study · genetics</div>
        <h4>Where the bycatch comes from: Chinook stock of origin.</h4>
        <p>
          Bycatch is not a single population — it is a mix. NOAA genetic
          sampling, which began in earnest in 2011, has shown that roughly
          47 percent of BSAI Chinook bycatch originates from Coastal Western
          Alaska, with the rest distributed across North Alaska Peninsula,
          British Columbia, the West Coast US, and elsewhere. This is the
          data that connects offshore trawl impacts to the in-river runs
          subsistence and rural communities depend on. The full implications
          of stock-of-origin data, including what it does and does not say
          about run-recovery prospects, are taken up directly in Section 3c.
        </p>

        <div className="sm-grid-2">
          <ChartCard
            label={`Stock composition · ${gsiLatest.year ?? "—"}`}
            source="NOAA Genetics"
            title={`BSAI Chinook bycatch — stock of origin, ${gsiLatest.year ?? ""}.`}
            height="short"
            caption={
              <>
                Single-year snapshot ({gsiLatest.year}). The published genetic
                stock-of-origin time series is sparse; longer multi-year
                series are pending publication.
              </>
            }
          >
            {gsiChartData.length > 0 ? (
              <>
                <StackedBar
                  data={gsiChartData}
                  xKey="region"
                  keys={["share"]}
                  height={200}
                  yFormatter={(v) => `${v.toFixed(0)}%`}
                />
              </>
            ) : (
              <div className="sm-chart-body placeholder short">Loading…</div>
            )}
          </ChartCard>

          <ChartCard
            label="Time series · regional"
            source="NOAA AKR + Genetics"
            title="Annual BSAI Chinook bycatch attributable to Western AK origins."
            height="short"
            caption={
              <>
                Single line: estimated Coastal Western AK origin bycatch in
                numbers of fish, by year since 2011. Requires per-year GSI ×
                per-year BSAI bycatch — multi-year genetics not yet wired.
              </>
            }
          >
            <div className="sm-chart-body placeholder short">
              Awaiting multi-year GSI dataset
            </div>
          </ChartCard>
        </div>
      </div>
    </section>
  );
}
