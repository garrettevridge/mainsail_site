import { Link } from "react-router-dom";

interface CrumbProps {
  topic: string;
  root?: string;
  section?: { label: string; href: string };
}

export default function Crumb({
  topic,
  root = "Dashboard",
  section,
}: CrumbProps) {
  return (
    <div className="crumb">
      <Link to="/" style={{ color: "var(--muted)" }}>
        {root}
      </Link>
      <span className="sep">/</span>
      {section && (
        <>
          <Link
            to={section.href}
            style={{ color: "var(--muted)" }}
          >
            {section.label}
          </Link>
          <span className="sep">/</span>
        </>
      )}
      <span className="topic">{topic}</span>
    </div>
  );
}
