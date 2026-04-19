import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { useDataset } from "../api/manifest";

interface ObsRow {
  year: number;
  sector: string;
  coverage_pct: number;
  category: "full" | "partial";
}

const COLORS: Record<string, string> = {
  "Pollock CP": "#2f5d8a",
  "Pollock CV": "#1a2332",
  "Pollock Mothership": "#6b8fad",
  "Amendment 80": "#0f3a5c",
  "Halibut+Sablefish IFQ (longline)": "#b45309",
  "CV under-60 (groundfish)": "#c2410c",
};

export default function StoryObserver() {
  const { data, isLoading, error } = useDataset<ObsRow>("observer_coverage");

  // pivot to one row per year with a column per sector
  const years = Array.from(new Set((data ?? []).map((r) => r.year))).sort();
  const sectors = Array.from(new Set((data ?? []).map((r) => r.sector)));

  const chartData = years.map((y) => {
    const row: Record<string, number | string> = { year: y };
    for (const s of sectors) {
      const match = data!.find((r) => r.year === y && r.sector === s);
      if (match) row[s] = match.coverage_pct;
    }
    return row;
  });

  return (
    <article className="prose-mainsail">
      <p className="text-sm text-muted uppercase tracking-wide mb-2">Theme D · Observer coverage</p>
      <h1 className="font-serif text-4xl font-semibold text-ink mb-2">
        Who is watching Alaska's federal fisheries?
      </h1>
      <p className="text-xl text-muted mb-8">
        Observer coverage rates by sector, 2013 restructure forward.
      </p>

      <section>
        <h2>Coverage by sector, 2013-present</h2>
        <p>
          Federal fisheries off Alaska are monitored to differing degrees
          depending on sector. Some operate under full coverage — an observer
          or Electronic Monitoring system on every trip, or two observers on
          every vessel. Others operate under partial coverage: a stratified
          random sample of trips, with selection rates set annually by NMFS.
        </p>
        <p>
          The pattern is consistent across years: sectors taking the majority
          of Alaska's federal groundfish operate at or near{" "}
          <strong>100% coverage</strong>. Partial-coverage sectors operate at{" "}
          <strong>10% to 45%</strong> depending on stratum.
        </p>
        {isLoading && <p className="text-muted">Loading…</p>}
        {error && <p className="text-flag">Data unavailable: {error.message}</p>}
        {data && (
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                <XAxis dataKey="year" tick={{ fill: "#1a2332", fontSize: 12 }} />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  label={{
                    value: "coverage rate (%)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#6b7280",
                  }}
                />
                <Tooltip formatter={(v) => (typeof v === "number" ? `${v.toFixed(1)}%` : String(v))} />
                <Legend />
                <ReferenceLine
                  y={100}
                  stroke="#6b7280"
                  strokeDasharray="3 3"
                  label={{ value: "Full coverage", position: "insideTopRight", fill: "#6b7280", fontSize: 11 }}
                />
                {sectors.map((s) => (
                  <Line
                    key={s}
                    type="monotone"
                    dataKey={s}
                    stroke={COLORS[s] ?? "#6b7280"}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <aside className="methodology-box">
        <h3>The 2013 restructure — a hard methodology break</h3>
        <p>
          Before 2013, the North Pacific Observer Program operated on a
          pay-as-you-go basis: vessels contracted directly with observer
          providers, and coverage depended largely on vessel length. The 2013
          restructure introduced pooled funding, stratified random sampling,
          and an annual Deployment-Plan / Annual-Report cycle.
        </p>
        <p>
          Pre-2013 and post-2013 coverage rates are not directly comparable.
          This chart begins at 2013 for that reason.
        </p>
      </aside>

      <aside className="methodology-box">
        <h3>What coverage rate is and is not</h3>
        <p>
          Coverage rate is a ratio, not a workload measure. A 100%-coverage
          sector uses more observer-days than a 20%-coverage sector if it has
          more trips. And coverage rate does not equal data completeness: the
          NMFS Catch Accounting System extrapolates observed haul data to
          unobserved trips using statistical methods. A lower coverage rate
          means wider confidence intervals on the extrapolation, not a
          proportional gap in knowledge.
        </p>
      </aside>

      <p className="text-sm text-muted mt-8">
        Source: derived from NMFS Alaska Region monitored catch tables via the{" "}
        <code>monitored_or_total</code> column. Methodology in the Observer
        Program Annual Reports (NPFMC C-agenda).
      </p>
    </article>
  );
}
