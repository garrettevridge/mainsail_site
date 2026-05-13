import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import { Card } from "../components/primitives";
import TimeSeriesLine from "../components/charts/TimeSeriesLine";

type CommercialLandingsRow = {
  year: number;
  region: string;
  species_group: string;
  landings_lbs: number | null;
};

export default function Landing() {
  const { data: landings } = useDataset<CommercialLandingsRow>("nmfs_commercial_landings");

  // Total Alaska commercial landings — sum across all species groups, statewide
  const totalLandings = useMemo(() => {
    if (!landings) return { data: [], range: "" };
    const statewide = landings.filter((r) => r.region === "Statewide" && r.landings_lbs != null);
    const years = [...new Set(statewide.map((r) => r.year))].sort((a, b) => a - b);
    const data = years.map((yr) => ({
      year: yr,
      total_b_lbs: statewide
        .filter((r) => r.year === yr)
        .reduce((s, r) => s + (r.landings_lbs ?? 0), 0) / 1_000_000_000,
    }));
    return { data, range: years.length ? `${years[0]}–${years.at(-1)}` : "" };
  }, [landings]);

  return (
    <>
      <h1 className="page-title">Landing</h1>

      <h2 className="h2">Total Alaska commercial landings, {totalLandings.range}</h2>
      <Card>
        {totalLandings.data.length > 0 && (
          <TimeSeriesLine
            data={totalLandings.data}
            xKey="year"
            yKey="total_b_lbs"
            yLabel="billion lbs"
            unitSuffix="B lbs"
          />
        )}
        <div className="data-caption">
          Source: <code>nmfs_commercial_landings</code> · statewide aggregate, all seven species groups (Pollock, Salmon, Flatfish, Halibut, Crab, Sablefish, Other) summed. Longest continuous total-harvest series in the manifest.
        </div>
      </Card>
    </>
  );
}
