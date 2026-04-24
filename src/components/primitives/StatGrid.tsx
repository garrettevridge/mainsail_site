export interface Stat {
  val: string;
  label: string;
  sub?: string;
  accent?: "accent" | "accent-2";
}

interface StatGridProps {
  stats: Stat[];
}

export default function StatGrid({ stats }: StatGridProps) {
  return (
    <div className="stats">
      {stats.map((s, i) => (
        <div className="stat" key={i}>
          <div className={"stat-val" + (s.accent ? " " + s.accent : "")}>{s.val}</div>
          <div className="stat-lbl">{s.label}</div>
          {s.sub && <div className="stat-sub">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}
