import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type {
  StockAssessmentBiomassRow,
  TacSpecsRow,
} from "../../api/types";
import ChartCard from "../ChartCard";
import { MultiLine, Legend } from "../SmChart";
import { SERIES } from "../colors";

// BSAI EBS pollock biomass + TAC/ABC/OFL + catch.
// Biomass series: stock_assessment_biomass.stock_id="bsai_ebs_pollock", total_biomass_kt (= thousand metric tons).
// TAC/ABC/OFL: tac_specs filtered to fmp_area="BSAI" + species_complex="Pollock", summed across area_detail.
// (BSAI pollock is split EBS / AI / Bogoslof in tac_specs; the EBS row dominates >99% of the total.)

export default function Limits() {
  const { data: biomass } = useDataset<StockAssessmentBiomassRow>("stock_assessment_biomass");
  const { data: tac } = useDataset<TacSpecsRow>("tac_specs");

  const chartData = useMemo(() => {
    const byYear = new Map<number, { year: number; Biomass?: number; OFL?: number; ABC?: number; TAC?: number; Catch?: number }>();
    const ensure = (yr: number) => {
      const r = byYear.get(yr) ?? { year: yr };
      byYear.set(yr, r);
      return r;
    };

    if (biomass) {
      for (const r of biomass) {
        if (r.stock_id !== "bsai_ebs_pollock") continue;
        if (r.total_biomass_kt == null) continue;
        // total_biomass_kt is thousand metric tons; chart in metric tons.
        ensure(r.year).Biomass = r.total_biomass_kt * 1000;
      }
    }
    if (tac) {
      for (const r of tac) {
        if (r.fmp_area !== "BSAI") continue;
        if (r.species_complex !== "Pollock") continue;
        const yr = ensure(r.year);
        if (r.ofl_mt != null) yr.OFL = (yr.OFL ?? 0) + r.ofl_mt;
        if (r.abc_mt != null) yr.ABC = (yr.ABC ?? 0) + r.abc_mt;
        if (r.tac_mt != null) yr.TAC = (yr.TAC ?? 0) + r.tac_mt;
        if (r.catch_mt != null) yr.Catch = (yr.Catch ?? 0) + r.catch_mt;
      }
    }

    return [...byYear.values()]
      .filter((r) => r.year >= 1980)
      .sort((a, b) => a.year - b.year);
  }, [biomass, tac]);

  // Buffer chart: TAC as % of ABC.
  const bufferData = useMemo(() => {
    return chartData
      .filter((r) => r.TAC != null && r.ABC != null && r.ABC > 0)
      .map((r) => ({
        year: r.year,
        "TAC ÷ ABC": +((r.TAC! / r.ABC!) * 100).toFixed(1),
      }));
  }, [chartData]);

  const lastYear = chartData.at(-1)?.year;

  return (
    <section id="limits" className="sm-section">
      <div className="sm-marker">
        <span className="num">02 / Biomass &amp; limits</span>
        <span className="title">How harvest gets capped</span>
      </div>

      <h2 className="sm-h2">
        Biomass, limits, <span className="accent">and what gets caught.</span>
      </h2>

      <p className="sm-p">
        Harvest in federally managed Alaska fisheries is governed by a
        three-layer cap system. Each year the stock assessment estimates the
        spawning biomass. From that estimate, scientists calculate the
        Overfishing Level (OFL) — the harvest above which overfishing occurs
        by statutory definition. Below OFL sits the Acceptable Biological
        Catch (ABC), which discounts OFL for scientific uncertainty. Below
        ABC sits the Total Allowable Catch (TAC), the actual harvest limit,
        set by Council action. For pollock, an additional ceiling — the 2
        million metric ton aggregate BSAI cap — sits above all of this,
        capping the combined groundfish harvest regardless of what the
        biology would otherwise support. The system is layered,
        conservative, and audited annually.
      </p>

      <ChartCard
        label={`Fig 2.1 · primary · ${chartData[0]?.year ?? ""}–${lastYear ?? ""}`}
        source="NOAA AFSC · NPFMC SAFE · AKR Catch Accounting"
        title="Bering Sea pollock — biomass, harvest limits, and actual harvest."
        height="tall"
        caption={
          <>
            Lines, BSAI EBS pollock. Total biomass (age 3+) from the 2024 SAFE
            assessment; OFL / ABC / TAC / catch from NMFS AKRO TAC tables.
            Biomass is shown at full scale (metric tons); harvest tracks
            substantially below biomass year after year.
          </>
        }
      >
        {chartData.length > 0 ? (
          <>
            <MultiLine
              data={chartData as unknown as Record<string, string | number | null>[]}
              xKey="year"
              keys={["Biomass", "OFL", "ABC", "TAC", "Catch"]}
              height={360}
              yLabel="Metric tons"
            />
            <Legend
              items={["Biomass", "OFL", "ABC", "TAC", "Catch"].map((label, i) => ({
                label,
                color: SERIES[i],
              }))}
            />
          </>
        ) : (
          <div className="sm-chart-body placeholder tall">Loading…</div>
        )}
      </ChartCard>

      <div className="sm-stat-row">
        <div className="sm-stat">
          <div className="sm-stat-num">2 MMT</div>
          <div className="sm-stat-lbl">Aggregate BSAI groundfish cap (pollock + cod + flatfish)</div>
        </div>
        <div className="sm-stat">
          <div className="sm-stat-num">30%</div>
          <div className="sm-stat-lbl">2026 pollock TAC set below biological limit</div>
        </div>
        <div className="sm-stat">
          <div className="sm-stat-num">45%</div>
          <div className="sm-stat-lbl">2026 pollock TAC set below overfishing limit</div>
        </div>
        <div className="sm-stat">
          <div className="sm-stat-num">Annual</div>
          <div className="sm-stat-lbl">Assessment, comment, Council action cycle</div>
        </div>
      </div>

      <ChartCard
        label="Fig 2.2 · secondary · time series"
        source="NPFMC SAFE · NOAA AFSC"
        title="The precautionary buffer — TAC as a share of ABC."
        height="short"
        caption={
          <>
            Line, BSAI pollock TAC ÷ ABC by year, percent. Demonstrates the
            precautionary discount is structural, not occasional — TAC sits
            persistently below what biology would allow.
          </>
        }
      >
        {bufferData.length > 0 ? (
          <MultiLine
            data={bufferData}
            xKey="year"
            keys={["TAC ÷ ABC"]}
            height={220}
            yFormatter={(v) => `${v.toFixed(0)}%`}
          />
        ) : (
          <div className="sm-chart-body placeholder short">Loading…</div>
        )}
      </ChartCard>

      <p className="sm-p">
        Two takeaways worth landing here, before the bycatch sections that
        follow. First, when readers see pollock harvest numbers in headlines,
        those numbers reflect a TAC that has already been discounted multiple
        times below what the science says the stock could sustain. Second,
        the 2 MMT aggregate cap is unusual globally — most large fisheries
        do not cap total ecosystem harvest at all, let alone substantially
        below biological yield. Whether that conservatism is sufficient is a
        legitimate debate. That the conservatism exists is not.
      </p>
    </section>
  );
}
