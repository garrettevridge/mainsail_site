import { useEffect } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { useManifest } from "../api/manifest";
import { TOPICS, TOPIC_GROUPS } from "./topics";

// Hub-and-spoke shell: a persistent left-rail topic navigator wrapping a routed
// content area (the spine on "/", a focused topic view on "/:slug"). The spine
// pieces are hash links into the landing; the topics are real routes.

const SPINE_LINKS = [
  { hash: "#top", label: "Overview" },
  { hash: "#intro", label: "Introduction" },
  { hash: "#history", label: "A short history" },
  { hash: "#closing", label: "What we conclude" },
  { hash: "#explore", label: "Explore the data" },
];

export default function Whitepaper() {
  const { data: manifest } = useManifest();
  const generated = manifest?.generated_at
    ? new Date(manifest.generated_at).toISOString().slice(0, 10)
    : null;

  // The spine links are hashes into the landing route; scroll to them once the
  // landing has rendered. Plain "/" with no hash goes to the top.
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (pathname !== "/") return;
    if (!hash || hash === "#top") {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    const id = hash.slice(1);
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 0);
    return () => clearTimeout(t);
  }, [pathname, hash]);

  return (
    <>
      <nav className="sm-topnav scrolled">
        <Link to="/" className="brand">SEAMARK</Link>
        <div className="right">
          <Link to="/">Overview</Link>
          <a
            href="https://mainsail-public-data.s3.us-west-2.amazonaws.com/manifest.json"
            target="_blank"
            rel="noreferrer"
          >
            Data
          </a>
          <Link to="/#closing">Conclusion</Link>
        </div>
      </nav>

      <div className="sm-shell">
        <aside className="sm-rail">
          <div className="sm-rail-group">
            <div className="sm-rail-label">Start here</div>
            {SPINE_LINKS.map((s) => (
              <Link key={s.hash} to={`/${s.hash}`} className="sm-rail-link">
                {s.label}
              </Link>
            ))}
          </div>

          {TOPIC_GROUPS.map((g) => (
            <div className="sm-rail-group" key={g}>
              <div className="sm-rail-label">{g}</div>
              {TOPICS.filter((t) => t.group === g).map((t) => (
                <NavLink
                  key={t.slug}
                  to={`/${t.slug}`}
                  className={({ isActive }) =>
                    `sm-rail-link${isActive ? " active" : ""}`
                  }
                >
                  {t.label}
                </NavLink>
              ))}
            </div>
          ))}
        </aside>

        <main className="sm-paper">
          <Outlet />
        </main>
      </div>

      <footer className="sm-footer">
        <span className="brand">SEAMARK</span>
        Seamark Holdings, LLC · Anchorage, Alaska · 2026
        {generated && (
          <div className="footer-meta-line">
            Data published <span className="mono">{generated}</span>
          </div>
        )}
        <div className="meta">
          <Link to="/#closing">Methodology</Link>
          <a
            href="https://mainsail-public-data.s3.us-west-2.amazonaws.com/manifest.json"
            target="_blank"
            rel="noreferrer"
          >
            Source data
          </a>
        </div>
      </footer>
    </>
  );
}
