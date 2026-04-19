import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useManifest } from "../api/manifest";

const STORIES = [
  { id: "chinook",  label: "Chinook salmon",    theme: "A" },
  { id: "halibut",  label: "Pacific halibut",   theme: "B" },
  { id: "discards", label: "Federal discards",  theme: "C" },
  { id: "observer", label: "Observer coverage", theme: "D" },
] as const;

export default function Layout() {
  const { data: manifest } = useManifest();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-baseline justify-between">
          <Link to="/" className="no-underline text-ink">
            <span className="font-serif text-2xl font-semibold">Mainsail</span>
            <span className="ml-2 text-sm text-muted">Alaska fisheries data</span>
          </Link>
          <nav className="text-sm">
            <ul className="flex gap-6">
              {STORIES.map((s) => (
                <li key={s.id}>
                  <NavLink
                    to={`/stories/${s.id}`}
                    className={({ isActive }) =>
                      isActive
                        ? "font-semibold text-ink no-underline"
                        : "text-muted hover:text-ink no-underline"
                    }
                  >
                    {s.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className={isHome ? "flex-1" : "flex-1 max-w-5xl mx-auto px-6 py-10 w-full"}>
        <Outlet />
      </main>

      <footer className="border-t border-line bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-muted flex justify-between">
          <div>
            <p>
              Data published by Mainsail. Sources cited in each story.{" "}
              <a href="https://github.com/garrettevridge/mainsail_data" target="_blank" rel="noreferrer">
                Data pipeline repository
              </a>
              .
            </p>
            {manifest && (
              <p className="text-xs mt-1">
                Data as of {new Date(manifest.generated_at).toLocaleDateString()}
                {" · "}
                {manifest.datasets.length} datasets,{" "}
                {manifest.datasets.reduce((n, d) => n + d.row_count, 0).toLocaleString()}{" "}
                rows
              </p>
            )}
          </div>
          <div>
            <p>Seamark Analytics</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
