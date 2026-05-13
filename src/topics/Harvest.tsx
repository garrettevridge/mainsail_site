import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type {
  SalmonCommercialHarvestDataRow,
  HatcheryReleasesRow,
  SubsistenceHarvestStatewideRow,
} from "../api/types";
import { Card } from "../components/primitives";
import MultiLineTrend from "../components/charts/MultiLineTrend";
import TimeSeriesLine from "../components/charts/TimeSeriesLine";
import StackedTrend from "../components/charts/StackedTrend";
import SpeciesBar from "../components/charts/SpeciesBar";
import SourcePie from "../components/charts/SourcePie";

type CommercialLandingsRow = {
  year: number;
  region: string;
  species_group: string;
  landings_lbs: number | null;
  ex_vessel_value_usd_nominal: number | null;
};

type FirstWholesaleRow = {
  year: number;
  species_group: string;
  first_wholesale_value_usd_nominal: number | null;
  first_wholesale_volume_lbs: number | null;
};

const SPECIES = ["chinook", "sockeye", "coho", "pink", "chum"] as const;

export default function Harvest() {
  const { data: nmfs } = useDataset<CommercialLandingsRow>("nmfs_commercial_landings");
  const { data: salmon } = useDataset<SalmonCommercialHarvestDataRow>("salmon_commercial_harvest");
  const { data: fw } = useDataset<FirstWholesaleRow>("first_wholesale_value");
  const { data: sub } = useDataset<SubsistenceHarvestStatewideRow>("subsistence_harvest_statewide");
  const { data: hatch } = useDataset<HatcheryReleasesRow>("hatchery_releases");

  const nmfsByGroup = useMemo(() => {
    if (!nmfs) return { data: [], keys: [] as string[] };
    const groups = [...new Set(nmfs.map((r) => r.species_group))];
    const years = [...new Set(nmfs.map((r) => r.year))].sort((a, b) => a - b);
    const data = years.map((yr) => {
      const point: Record<string, number | string> = { year: yr };
      for (const g of groups) {
        const row = nmfs.find((r) => r.year === yr && r.species_group === g && r.region === "Statewide");
        point[g] = row?.landings_lbs ? row.landings_lbs / 1_000_000 : 0;
      }
      return point;
    });
    return { data, keys: groups };
  }, [nmfs]);

  const salmonSeries = useMemo(() => {
    if (!salmon) return [];
    const statewide = salmon.filter((r) => r.region === "statewide");
    const years = [...new Set(statewide.map((r) => r.year))].sort((a, b) => a - b);
    return years.map((yr) => {
      const point: Record<string, number | null> = { year: yr };
      for (const s of SPECIES) {
        const row = statewide.find((r) => r.year === yr && r.species === s);
        point[s] = row?.harvest_fish != null ? row.harvest_fish / 1_000_000 : null;
      }
      return point;
    });
  }, [salmon]);

  const fwTrend = useMemo(() => {
    if (!fw) return [];
    const years = [...new Set(fw.map((r) => r.year))].sort((a, b) => a - b);
    return years.map((yr) => {
      const total = fw
        .filter((r) => r.year === yr && (r.first_wholesale_value_usd_nominal ?? 0) > 0)
        .reduce((s, r) => s + (r.first_wholesale_value_usd_nominal ?? 0), 0);
      return { year: yr, value: total / 1_000_000 };
    });
  }, [fw]);

  const subSeries = useMemo(() => {
    if (!sub) return [];
    const years = [...new Set(sub.map((r) => r.year))].sort((a, b) => a - b);
    return years.map((yr) => {
      const point: Record<string, number | null> = { year: yr };
      for (const s of SPECIES) {
        const row = sub.find((r) => r.year === yr && r.species === s);
        point[s] = row?.harvest_count != null ? row.harvest_count : null;
      }
      return point;
    });
  }, [sub]);

  const hatchByYear = useMemo(() => {
    if (!hatch) return { data: [], keys: [] as string[] };
    const akOnly = hatch.filter((r) => r.country === "USA" && r.number_released != null);
    const speciesSet = [...new Set(akOnly.map((r) => r.species))];
    const years = [...new Set(akOnly.map((r) => r.release_year))].sort((a, b) => a - b);
    const data = years.map((yr) => {
      const point: Record<string, number | string> = { release_year: yr };
      for (const sp of speciesSet) {
        const sum = akOnly
          .filter((r) => r.release_year === yr && r.species === sp)
          .reduce((s, r) => s + (r.number_released ?? 0), 0);
        point[sp] = sum / 1_000_000;
      }
      return point;
    });
    return { data, keys: speciesSet };
  }, [hatch]);

  const fwLatest = useMemo(() => {
    if (!fw) return { rows: [], year: null as number | null };
    const finals = fw.filter((r) => (r.first_wholesale_volume_lbs ?? 0) > 0);
    if (!finals.length) return { rows: [], year: null };
    const year = Math.max(...finals.map((r) => r.year));
    const rows = finals
      .filter((r) => r.year === year)
      .map((r) => ({ species: r.species_group, value: (r.first_wholesale_volume_lbs ?? 0) / 1_000_000 }))
      .sort((a, b) => b.value - a.value);
    return { rows, year };
  }, [fw]);

  // Pie charts: by volume + by value, latest year, from first_wholesale_value
  const fwPies = useMemo(() => {
    if (!fw) return { byVol: [], byVal: [], year: null as number | null, totalLbs: 0, totalUsd: 0 };
    const valid = fw.filter((r) => (r.first_wholesale_volume_lbs ?? 0) > 0 || (r.first_wholesale_value_usd_nominal ?? 0) > 0);
    if (!valid.length) return { byVol: [], byVal: [], year: null, totalLbs: 0, totalUsd: 0 };
    const year = Math.max(...valid.map((r) => r.year));
    const rows = valid.filter((r) => r.year === year);
    const byVol = rows
      .filter((r) => (r.first_wholesale_volume_lbs ?? 0) > 0)
      .map((r) => ({ source: r.species_group, value: r.first_wholesale_volume_lbs ?? 0 }))
      .sort((a, b) => b.value - a.value);
    const byVal = rows
      .filter((r) => (r.first_wholesale_value_usd_nominal ?? 0) > 0)
      .map((r) => ({ source: r.species_group, value: r.first_wholesale_value_usd_nominal ?? 0 }))
      .sort((a, b) => b.value - a.value);
    const totalLbs = byVol.reduce((s, r) => s + r.value, 0);
    const totalUsd = byVal.reduce((s, r) => s + r.value, 0);
    return { byVol, byVal, year, totalLbs, totalUsd };
  }, [fw]);

  return (
    <>
      <h1 className="page-title">Harvest</h1>

      <h2 className="h2">What Alaska caught last year, and what it was worth — {fwPies.year ?? "—"}</h2>
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card title="By volume" sub={fwPies.totalLbs > 0 ? `${(fwPies.totalLbs / 1_000_000_000).toFixed(2)} B lbs · first-wholesale` : undefined}>
          {fwPies.byVol.length > 0 && (
            <SourcePie data={fwPies.byVol} unit="lbs" />
          )}
          <div className="data-caption">Source: <code>first_wholesale_value</code> · <code>first_wholesale_volume_lbs</code> by species group.</div>
        </Card>
        <Card title="By first-wholesale value" sub={fwPies.totalUsd > 0 ? `$${(fwPies.totalUsd / 1_000_000_000).toFixed(2)} B · nominal USD` : undefined}>
          {fwPies.byVal.length > 0 && (
            <SourcePie data={fwPies.byVal} unit="USD" />
          )}
          <div className="data-caption">Source: <code>first_wholesale_value</code> · <code>first_wholesale_value_usd_nominal</code> by species group.</div>
        </Card>
      </div>

      <h2 className="h2">NMFS commercial landings by species group</h2>
      <Card>
        {nmfsByGroup.data.length > 0 && (
          <MultiLineTrend
            data={nmfsByGroup.data}
            xKey="year"
            seriesKeys={nmfsByGroup.keys}
            yLabel="million lbs"
            unitSuffix="M lbs"
          />
        )}
        <div className="data-caption">Source: <code>nmfs_commercial_landings</code> · statewide aggregate.</div>
      </Card>

      <h2 className="h2">Commercial salmon harvest by species</h2>
      <Card>
        {salmonSeries.length > 0 && (
          <MultiLineTrend
            data={salmonSeries}
            xKey="year"
            seriesKeys={[...SPECIES]}
            yLabel="million fish"
            unitSuffix="M fish"
          />
        )}
        <div className="data-caption">Source: <code>salmon_commercial_harvest</code> · statewide · ADF&amp;G + NPAFC.</div>
      </Card>

      <h2 className="h2">First-wholesale value, statewide</h2>
      <Card>
        {fwTrend.length > 0 && (
          <TimeSeriesLine data={fwTrend} xKey="year" yKey="value" yLabel="USD millions (nominal)" unitSuffix="M USD" />
        )}
        <div className="data-caption">Source: <code>first_wholesale_value</code> · ADF&amp;G COAR rollup · nominal USD.</div>
      </Card>

      <h2 className="h2">First-wholesale volume by species group, {fwLatest.year ?? "—"}</h2>
      <Card>
        {fwLatest.rows.length > 0 && (
          <SpeciesBar data={fwLatest.rows} unitLabel="M lbs" color="#7b6a4f" />
        )}
        <div className="data-caption">Source: <code>first_wholesale_value</code> · latest year in dataset.</div>
      </Card>

      <h2 className="h2">Subsistence salmon harvest, statewide</h2>
      <Card>
        {subSeries.length > 0 && (
          <MultiLineTrend
            data={subSeries}
            xKey="year"
            seriesKeys={[...SPECIES]}
            yLabel="fish"
            unitSuffix="fish"
          />
        )}
        <div className="data-caption">Source: <code>subsistence_harvest_statewide</code> · NPAFC.</div>
      </Card>

      <h2 className="h2">Alaska hatchery releases by species</h2>
      <Card>
        {hatchByYear.data.length > 0 && (
          <StackedTrend
            data={hatchByYear.data}
            xKey="release_year"
            stackKeys={hatchByYear.keys}
            yLabel="million fish"
            yFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}B` : `${v.toFixed(0)}M`}
          />
        )}
        <div className="data-caption">Source: <code>hatchery_releases</code> · USA facilities · NPAFC.</div>
      </Card>
    </>
  );
}
