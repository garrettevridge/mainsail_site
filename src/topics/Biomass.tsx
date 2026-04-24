import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type { TacSpecsRow } from "../api/types";
import { Card, Crumb, Note, StatGrid, Table } from "../components/primitives";
import MultiLineTrend from "../components/charts/MultiLineTrend";
import SpeciesBar from "../components/charts/SpeciesBar";

const fmt = (n: number | null | undefined, digits = 0) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: digits });

const fmtKt = (mt: number | null | undefined) =>
  mt == null ? "—" : `${Math.round(mt / 1000).toLocaleString()} kt`;

export default function Biomass() {
  const { data, isLoading, error } = useDataset<TacSpecsRow>("tac_specs");

  // BSAI Pollock Bering Sea quota-area OFL/ABC/TAC trend
  const pollockTrend = useMemo(() => {
    if (!data) return [];
    const map = new Map<number, Record<string, number>>();
    for (const r of data) {
      if (
        r.fmp_area === "BSAI" &&
        r.species_complex === "Pollock" &&
        r.area_detail === "BS"
      ) {
        map.set(r.year, {
          year: r.year,
          "OFL (kt)": Math.round((r.ofl_mt ?? 0) / 1000),
          "ABC (kt)": Math.round((r.abc_mt ?? 0) / 1000),
          "TAC (kt)": Math.round((r.tac_mt ?? 0) / 1000),
        });
      }
    }
    return [...map.values()].sort((a, b) => a.year - b.year);
  }, [data]);

  // 2026 BSAI specs: sum sub-areas per species, sort by TAC descending
  const bsai2026 = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { ofl: number; abc: number; tac: number }>();
    for (const r of data) {
      if (r.year === 2026 && r.fmp_area === "BSAI") {
        const prev = map.get(r.species_complex) ?? { ofl: 0, abc: 0, tac: 0 };
        map.set(r.species_complex, {
          ofl: prev.ofl + (r.ofl_mt ?? 0),
          abc: prev.abc + (r.abc_mt ?? 0),
          tac: prev.tac + (r.tac_mt ?? 0),
        });
      }
    }
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.tac - a.tac);
  }, [data]);

  const goa2026 = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { ofl: number; abc: number; tac: number }>();
    for (const r of data) {
      if (r.year === 2026 && r.fmp_area === "GOA") {
        const prev = map.get(r.species_complex) ?? { ofl: 0, abc: 0, tac: 0 };
        map.set(r.species_complex, {
          ofl: prev.ofl + (r.ofl_mt ?? 0),
          abc: prev.abc + (r.abc_mt ?? 0),
          tac: prev.tac + (r.tac_mt ?? 0),
        });
      }
    }
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.tac - a.tac);
  }, [data]);

  const totalBSAITac = bsai2026.reduce((s, r) => s + r.tac, 0);
  const totalGOATac = goa2026.reduce((s, r) => s + r.tac, 0);
  const pollock2026 = pollockTrend.find((r) => r.year === 2026);
  const OFY_CEILING_KT = 2000; // 2 million ton BSAI optimum yield ceiling

  // BSAI ecosystem bar: species sorted by TAC descending, for SpeciesBar
  const bsaiEcosystemBar = useMemo(
    () =>
      bsai2026.map((r) => ({ species: r.name, value: r.tac })),
    [bsai2026]
  );

  // Most recent year available in dataset
  const latestYear = useMemo(() => {
    if (!data) return null;
    return Math.max(...data.map((r) => r.year));
  }, [data]);

  return (
    <>
      <Crumb topic="Biomass, TAC & ABC" />
      <h1 className="page-title">Biomass, TAC &amp; ABC</h1>
      <p className="page-lede first-sentence">
        Every federally-managed groundfish stock in Alaska — pollock, cod,
        sablefish, the flatfishes, rockfish — carries an annual catch limit
        that is built, not chosen. Stock assessment scientists first estimate
        the biomass in the water and the biological maximum it could
        theoretically yield; the Council then reduces that figure twice before
        anyone fishes.
      </p>
      <p className="page-lede">
        The sequence is <b>OFL → ABC → TAC → Catch</b>. The Overfishing Limit
        (OFL) is the biological maximum. The Acceptable Biological Catch (ABC)
        steps it down for scientific uncertainty. The Total Allowable Catch
        (TAC) steps it down again for Council policy — bycatch limits,
        ecosystem caps, the 2-million-metric-ton BSAI optimum yield ceiling.
        Realized catch is what the fleet actually lands.
      </p>
      <p className="page-lede">
        Across the Bering Sea-Aleutian Islands and Gulf of Alaska combined,
        exploitable groundfish biomass is in the tens of millions of metric
        tons. Realized annual harvest is typically well below the TAC for most
        stocks.
      </p>

      {isLoading && (
        <p className="section-intro">Loading harvest specifications…</p>
      )}
      {error && (
        <Note>Could not load harvest specification data from S3.</Note>
      )}

      {data && (
        <>
          <StatGrid
            stats={[
              {
                val: fmtKt(pollock2026?.["TAC (kt)"] != null ? pollock2026["TAC (kt)"] * 1000 : null),
                label: "BSAI Pollock TAC (2026, BS quota area)",
                sub: "Bering Sea pollock — largest single-species fishery in the U.S.",
              },
              {
                val: fmtKt(totalBSAITac),
                label: "Total BSAI TAC (2026)",
                sub: `${Math.round((totalBSAITac / (OFY_CEILING_KT * 1000)) * 100)}% of the 2 million mt optimum yield ceiling`,
              },
              {
                val: fmtKt(totalGOATac),
                label: "Total GOA TAC (2026)",
              },
              {
                val: fmt(
                  data.filter((r) => r.fmp_area === "BSAI" && r.year === 2026)
                    .length > 0
                    ? data.filter(
                        (r) =>
                          r.fmp_area === "BSAI" &&
                          r.year === 2026 &&
                          r.species_complex === "Pollock" &&
                          r.area_detail === "BS"
                      )[0]?.abc_mt ?? null
                    : null
                ),
                label: "BSAI Pollock ABC (2026, BS)",
                sub: "Step-down from OFL for assessment uncertainty",
                accent: "accent",
              },
            ]}
          />

          <h2 className="h2">BSAI Pollock: OFL → ABC → TAC, 2007–2026</h2>
          <p className="section-intro">
            Bering Sea quota area only (excludes Aleutian Islands sub-area,
            which adds ~20 kt). The gap between ABC and TAC reflects Council
            policy decisions: ecosystem caps, PSC constraints, and the BSAI
            2-million-mt optimum yield ceiling.
          </p>
          <Card>
            <MultiLineTrend
              data={pollockTrend}
              xKey="year"
              seriesKeys={["OFL (kt)", "ABC (kt)", "TAC (kt)"]}
              colors={["#9ca3af", "#6b8fad", "#1a2332"]}
              title="BSAI Pollock (Bering Sea quota area) — OFL, ABC, TAC"
              yLabel="thousand mt"
              unitSuffix="kt"
            />
          </Card>

          <h2 className="h2">
            {latestYear} BSAI total allowable catch by species
          </h2>
          <p className="section-intro">
            Total Allowable Catch (mt) for each federally-managed BSAI
            groundfish stock, all quota sub-areas summed. Pollock dominates the
            ecosystem — its TAC is larger than all other BSAI stocks combined.
          </p>
          <Card>
            <SpeciesBar
              data={bsaiEcosystemBar}
              title={`BSAI groundfish TAC, ${latestYear} — all stocks`}
              unitLabel="mt"
              color="#2f5d8a"
            />
            <div className="data-caption">
              Source: NMFS AKRO harvest specifications via Mainsail tac_specs
            </div>
          </Card>

          <h2 className="h2">{latestYear} BSAI Harvest Specifications</h2>
          <p className="section-intro">
            All quota areas summed per species. Pollock figures include both
            Bering Sea and Aleutian Islands sub-areas.
          </p>
          <Card>
            <Table
              columns={[
                { label: "Species" },
                { label: "OFL (mt)", num: true },
                { label: "ABC (mt)", num: true },
                { label: "TAC (mt)", num: true },
              ]}
              rows={bsai2026.map((r) => [
                r.name,
                fmt(r.ofl),
                fmt(r.abc),
                fmt(r.tac),
              ])}
              caption="Source: NMFS AKRO harvest specifications via Mainsail tac_specs dataset"
            />
          </Card>

          <h2 className="h2">{latestYear} GOA Harvest Specifications</h2>
          <Card>
            <Table
              columns={[
                { label: "Species" },
                { label: "OFL (mt)", num: true },
                { label: "ABC (mt)", num: true },
                { label: "TAC (mt)", num: true },
              ]}
              rows={goa2026.map((r) => [
                r.name,
                fmt(r.ofl),
                fmt(r.abc),
                fmt(r.tac),
              ])}
              caption="Source: NMFS AKRO harvest specifications via Mainsail tac_specs dataset"
            />
          </Card>
        </>
      )}
    </>
  );
}
