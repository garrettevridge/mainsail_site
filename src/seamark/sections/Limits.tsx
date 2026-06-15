import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type {
  StockAssessmentBiomassRow,
  TacSpecsRow,
  MonitoredCatchRow,
} from "../../api/types";
import ChartCard from "../ChartCard";
import { MultiLine, Legend } from "../SmChart";
import SmTable from "../SmTable";
import { SERIES } from "../colors";

// BSAI EBS pollock biomass + TAC/ABC/OFL + actual catch.
// Biomass: stock_assessment_biomass.stock_id="bsai_ebs_pollock", total_biomass_kt.
// TAC/ABC/OFL: tac_specs, BSAI Pollock, summed across area_detail (EBS dominates).
// Catch: monitored_catch (Total) — tac_specs.catch_mt is unpopulated, so actual
// harvest is reconstructed from the catch-accounting tonnage instead.

// Stocks that have both an assessed biomass series and a federal harvest:
// the headline groundfish of the Bering Sea. Sablefish biomass is the
// Alaska-wide stock (the only published series), so its BSAI take understates
// the coastwide harvest rate — flagged in the table footnote.
const TABLE_STOCKS: {
  label: string;
  stockId: string;
  mcGroup: string;
  alaskaWideBiomass?: boolean;
}[] = [
  { label: "Walleye pollock", stockId: "bsai_ebs_pollock", mcGroup: "Walleye Pollock" },
  { label: "Pacific cod", stockId: "bsai_ebs_pcod", mcGroup: "Pacific Cod" },
  {
    label: "Sablefish",
    stockId: "alaska_sablefish",
    mcGroup: "Sablefish (Black Cod)",
    alaskaWideBiomass: true,
  },
];

interface BiomassTakeRow {
  label: string;
  biomassKt: number;
  biomassYear: number;
  takeKt: number;
  takeYear: number;
  sharePct: number;
  alaskaWideBiomass: boolean;
}

export default function Limits() {
  const { data: biomass } = useDataset<StockAssessmentBiomassRow>("stock_assessment_biomass");
  const { data: tac } = useDataset<TacSpecsRow>("tac_specs");
  const { data: monitored } = useDataset<MonitoredCatchRow>("monitored_catch");

  // Actual BSAI pollock removals by year from catch accounting (Total).
  const pollockCatchByYear = useMemo(() => {
    const m = new Map<number, number>();
    if (!monitored) return m;
    for (const r of monitored) {
      if (r.fmp_area !== "BSAI") continue;
      if (r.species_group !== "Walleye Pollock") continue;
      if (r.monitored_or_total !== "Total") continue;
      m.set(r.year, (m.get(r.year) ?? 0) + r.metric_tons);
    }
    return m;
  }, [monitored]);

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
      }
    }
    // Actual harvest from catch accounting.
    for (const [yr, mt] of pollockCatchByYear) ensure(yr).Catch = mt;

    return [...byYear.values()]
      .filter((r) => r.year >= 1960)
      .sort((a, b) => a.year - b.year);
  }, [biomass, tac, pollockCatchByYear]);

  // Buffer chart: TAC as % of ABC.
  const bufferData = useMemo(() => {
    return chartData
      .filter((r) => r.TAC != null && r.ABC != null && r.ABC > 0)
      .map((r) => ({
        year: r.year,
        "TAC ÷ ABC": +((r.TAC! / r.ABC!) * 100).toFixed(1),
      }));
  }, [chartData]);

  // Biomass-vs-take summary table.
  const tableRows = useMemo<BiomassTakeRow[]>(() => {
    if (!biomass || !monitored) return [];
    const out: BiomassTakeRow[] = [];
    for (const s of TABLE_STOCKS) {
      const brows = biomass.filter((r) => r.stock_id === s.stockId && r.total_biomass_kt != null);
      if (brows.length === 0) continue;
      const latestB = brows.reduce((a, b) => (b.year > a.year ? b : a));
      // BSAI take for this species, latest monitored_catch year (Total, both dispositions).
      const takeByYear = new Map<number, number>();
      for (const r of monitored) {
        if (r.fmp_area !== "BSAI") continue;
        if (r.species_group !== s.mcGroup) continue;
        if (r.monitored_or_total !== "Total") continue;
        takeByYear.set(r.year, (takeByYear.get(r.year) ?? 0) + r.metric_tons);
      }
      if (takeByYear.size === 0) continue;
      const takeYear = Math.max(...takeByYear.keys());
      const takeKt = (takeByYear.get(takeYear) ?? 0) / 1000;
      const biomassKt = latestB.total_biomass_kt!;
      out.push({
        label: s.label,
        biomassKt,
        biomassYear: latestB.year,
        takeKt,
        takeYear,
        sharePct: (takeKt / biomassKt) * 100,
        alaskaWideBiomass: !!s.alaskaWideBiomass,
      });
    }
    return out;
  }, [biomass, monitored]);

  const lastYear = chartData.at(-1)?.year;

  const fmtKt = (kt: number) =>
    kt >= 1000 ? `${(kt / 1000).toFixed(2)} M` : `${kt.toLocaleString(undefined, { maximumFractionDigits: 0 })} kt`;

  return (
    <section id="limits" className="sm-section">
      <div className="sm-marker">
        <span className="num">Federal harvest limits</span>
        <span className="title">Caps, biomass, and what gets caught</span>
      </div>

      <ChartCard
        label={`Fig · pollock biomass vs. harvest · ${chartData[0]?.year ?? ""}–${lastYear ?? ""}`}
        source="NOAA AFSC · NPFMC SAFE · AKR Catch Accounting"
        title="Bering Sea pollock — biomass, harvest limits, and actual harvest."
        height="tall"
        caption={
          <>
            Lines, BSAI EBS pollock. Total biomass (age 3+) from the assessment
            time series, 1960–present; OFL / ABC / TAC from NMFS AKRO tables
            (2007 onward); actual harvest from AKR catch accounting (2013
            onward). Read the gap: every year, the harvest line sits far below
            the biomass that produced it.
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

      {tableRows.length > 0 && (
        <SmTable<BiomassTakeRow>
          label="Fig · biomass vs. take · latest assessment year"
          headNote="Bering Sea / Aleutian Islands"
          title="What is in the water, and what gets taken out."
          columns={[
            { key: "label", header: "Stock" },
            {
              key: "biomass",
              header: "Assessed biomass",
              numeric: true,
              render: (r) => (
                <>
                  {fmtKt(r.biomassKt)}
                  {r.alaskaWideBiomass ? " *" : ""}{" "}
                  <span className="dim">({r.biomassYear})</span>
                </>
              ),
            },
            {
              key: "take",
              header: "Annual take",
              numeric: true,
              render: (r) => (
                <>
                  {fmtKt(r.takeKt)} <span className="dim">({r.takeYear})</span>
                </>
              ),
            },
            {
              key: "share",
              header: "Take ÷ biomass",
              numeric: true,
              render: (r) => `${r.sharePct.toFixed(1)}%`,
            },
          ]}
          rows={tableRows}
          foot={
            <>
              Assessed biomass from NOAA stock assessments (kt = thousand metric
              tons); annual take is total federal removals (retained +
              discarded) from AKR catch accounting. * Sablefish biomass is the
              Alaska-wide assessed stock — the only published series — so its
              Bering Sea take understates the coastwide harvest rate. Harvest
              and biomass are reported in different years where the latest
              assessment and the latest catch-accounting year differ.
            </>
          }
        />
      )}

      <ChartCard
        label="Fig · precautionary buffer · time series"
        source="NPFMC SAFE · NOAA AFSC"
        title="The precautionary buffer — TAC as a share of ABC."
        height="short"
        caption={
          <>
            Line, BSAI pollock TAC ÷ ABC by year, percent. The discount is
            structural, not occasional — TAC sits persistently below what the
            biology would allow.
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
    </section>
  );
}
