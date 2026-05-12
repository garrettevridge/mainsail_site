export type PlannedStatus = "ready" | "author" | "blocked";

export interface PlannedElement {
  title: string;
  source: string;
  status: PlannedStatus;
  note?: string;
}

const STATUS_LABEL: Record<PlannedStatus, string> = {
  ready: "Data on S3",
  author: "Editorial",
  blocked: "Awaiting ingest",
};

const STATUS_PILL: Record<PlannedStatus, string> = {
  ready: "fed",
  author: "st",
  blocked: "int",
};

interface PlannedElementsProps {
  elements: PlannedElement[];
}

export default function PlannedElements({ elements }: PlannedElementsProps) {
  return (
    <table className="data">
      <thead>
        <tr>
          <th style={{ width: "44%" }}>Planned element</th>
          <th style={{ width: "36%" }}>Source</th>
          <th style={{ width: "20%" }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {elements.map((e, i) => (
          <tr key={i}>
            <td>
              {e.title}
              {e.note && (
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--muted)",
                    marginTop: 3,
                  }}
                >
                  {e.note}
                </div>
              )}
            </td>
            <td style={{ color: "var(--ink-soft)", fontSize: 13 }}>
              {e.source}
            </td>
            <td>
              <span className={`pill ${STATUS_PILL[e.status]}`}>
                {STATUS_LABEL[e.status]}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
