export interface FlowStep {
  label: string;
  value: string;
  sub?: string;
}

interface FlowStepsProps {
  steps: FlowStep[];
}

export default function FlowSteps({ steps }: FlowStepsProps) {
  return (
    <div className="flow">
      {steps.map((s, i) => (
        <div className="flow-step" key={i}>
          <div className="step-label">{s.label}</div>
          <div className="step-value">{s.value}</div>
          {s.sub && <div className="step-sub">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}
