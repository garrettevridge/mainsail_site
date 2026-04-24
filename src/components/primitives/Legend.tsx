export interface LegendItem {
  color: string;
  label: string;
}

interface LegendProps {
  items: LegendItem[];
}

export default function Legend({ items }: LegendProps) {
  return (
    <div className="legend">
      {items.map((it, i) => (
        <div key={i}>
          <span className="sw" style={{ background: it.color }} />
          {it.label}
        </div>
      ))}
    </div>
  );
}
