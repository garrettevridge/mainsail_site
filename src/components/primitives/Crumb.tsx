interface CrumbProps {
  topic: string;
  root?: string;
}

export default function Crumb({ topic, root = "Dashboard" }: CrumbProps) {
  return (
    <div className="crumb">
      <span>{root}</span>
      <span className="sep">/</span>
      <span className="topic">{topic}</span>
    </div>
  );
}
