import { NavLink } from "react-router-dom";
import { SECTIONS } from "../../sections/registry";

interface TopNavProps {
  generatedAt?: string | null;
}

export default function TopNav({ generatedAt }: TopNavProps) {
  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <NavLink to="/" className="brand">
          <span
            aria-hidden="true"
            className="brand-bar"
          />
          <span className="brand-text">
            Mainsail
            <span className="brand-sub">Alaska Fisheries</span>
          </span>
        </NavLink>

        <nav aria-label="Sections" className="top-nav-sections">
          {SECTIONS.map((s) => (
            <NavLink
              key={s.slug}
              to={`/${s.slug}`}
              className={({ isActive }) =>
                `top-nav-link${isActive ? " active" : ""}`
              }
            >
              {s.short}
            </NavLink>
          ))}
        </nav>

        {generatedAt && (
          <div className="top-nav-meta">
            <span className="meta-label">Data as of</span>
            <span className="meta-date font-mono">
              {new Date(generatedAt).toISOString().slice(0, 10)}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
