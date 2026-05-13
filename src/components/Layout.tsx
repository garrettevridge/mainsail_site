import { NavLink, Outlet } from "react-router-dom";
import { useManifest } from "../api/manifest";
import { TOPICS } from "../topics/registry";

export default function Layout() {
  const { data: manifest } = useManifest();
  const generatedAt = manifest?.generated_at
    ? new Date(manifest.generated_at).toISOString().slice(0, 10)
    : null;

  return (
    <div className="min-h-screen">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-brand">
            <span
              aria-hidden="true"
              className="brand-rule"
            />
            <div>
              <div className="brand-title">Alaska Fisheries Reference Dashboard</div>
              <div className="brand-sub">Mainsail · Data engine v0.1</div>
            </div>
          </div>

          <nav className="topnav" aria-label="Topics">
            {TOPICS.map((t, i) => (
              <NavLink
                key={t.slug}
                to={`/topics/${t.slug}`}
                className={({ isActive }) =>
                  "topnav-link" + (isActive ? " active" : "")
                }
              >
                <span className="topnav-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="topnav-label">{t.title}</span>
              </NavLink>
            ))}
          </nav>

          {generatedAt && (
            <div className="topbar-meta">
              Data as of <span className="mono">{generatedAt}</span>
            </div>
          )}
        </div>
      </header>

      <main className="page-main">
        <Outlet />
      </main>
    </div>
  );
}
