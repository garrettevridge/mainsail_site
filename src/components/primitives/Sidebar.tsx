import { NavLink } from "react-router-dom";

export interface TopicEntry {
  slug: string;
  title: string;
}

interface SidebarProps {
  topics: TopicEntry[];
  generatedAt?: string | null;
}

export default function Sidebar({ topics, generatedAt }: SidebarProps) {
  return (
    <aside
      className="bg-[#fafafa] border-r border-rule sticky top-0 h-screen overflow-y-auto self-start"
      style={{ padding: "32px 26px 40px" }}
    >
      <div
        className="font-serif text-[22px] leading-[1.15] font-semibold text-ink"
        style={{ letterSpacing: "-0.015em" }}
      >
        <span
          aria-hidden="true"
          className="block bg-ink"
          style={{ width: 22, height: 2, marginBottom: 10 }}
        />
        Alaska Fisheries
        <br />
        Reference Dashboard
      </div>
      <div
        className="text-muted font-sans"
        style={{
          fontSize: 10.5,
          marginTop: 6,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontWeight: 500,
        }}
      >
        Mainsail · Data engine v0.1
      </div>

      <div
        className="text-muted font-sans"
        style={{
          marginTop: 28,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          fontWeight: 600,
        }}
      >
        Topics
      </div>
      <ul className="list-none p-0 m-0" style={{ marginTop: 10 }}>
        {topics.map((t, i) => (
          <li key={t.slug} style={{ padding: "8px 0" }}>
            <NavLink
              to={`/topics/${t.slug}`}
              className={({ isActive }) =>
                [
                  "flex gap-3 items-baseline no-underline hover:text-accent",
                  isActive ? "text-ink font-semibold" : "text-ink-soft",
                  "sidebar-link",
                  isActive ? "active" : "",
                ].join(" ")
              }
              style={{ fontSize: 13.5 }}
            >
              {({ isActive }) => (
                <>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 10.5,
                      color: isActive ? "var(--accent-2)" : "var(--muted)",
                      minWidth: 22,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{t.title}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      <div
        className="font-serif text-muted"
        style={{
          marginTop: 32,
          fontSize: 11.5,
          lineHeight: 1.55,
          borderTop: "1px solid var(--rule)",
          paddingTop: 14,
        }}
      >
        Figures sourced from NMFS, ADF&amp;G, IPHC, NPFMC and AFSC publications.
        Nothing on this page is an advocacy statement.
        {generatedAt && (
          <div style={{ marginTop: 10, fontSize: 11 }}>
            Data as of{" "}
            <span className="font-mono">
              {new Date(generatedAt).toISOString().slice(0, 10)}
            </span>
            .
          </div>
        )}
      </div>
    </aside>
  );
}
