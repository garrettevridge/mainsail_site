import { Link } from "react-router-dom";
import { SECTIONS } from "../sections/registry";
import { Crumb, Note } from "../components/primitives";

export default function Landing() {
  return (
    <article>
      <Crumb topic="Overview" />
      <h1 className="page-title">Alaska Seafood, at a Glance</h1>

      <p className="page-lede first-sentence">
        For more than 150 years, commercial fisheries have anchored Alaska's
        economy and the communities along its coast.
      </p>
      <p className="page-lede">
        The same ecosystems that sustained Indigenous peoples for thousands of
        years now feed the largest wild-capture seafood industry in the United
        States — and one of the largest in the world. Today the sector is
        mature: roughly 100 active shore-based processors, several thousand
        commercial vessels, and dockside landings worth billions of dollars
        each year. This site is a guided tour through how the industry works,
        organized around five topics.
      </p>

      <nav className="section-row" aria-label="Top-level sections">
        {SECTIONS.map((s, i) => (
          <Link key={s.slug} to={`/${s.slug}`} className="section-btn">
            <span className="section-num">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="section-title">{s.title}</span>
            <span className="section-blurb">{s.blurb}</span>
          </Link>
        ))}
      </nav>

      <h2 className="h2">By the numbers</h2>
      <p className="section-intro">
        The headline statistics that frame the rest of the site. These will be
        wired to the data engine as the underlying datasets land on S3 — see
        the methodology note below.
      </p>
      <div className="stats">
        <div className="stat">
          <div className="stat-val">—</div>
          <div className="stat-lbl">Statewide ex-vessel value</div>
          <div className="stat-sub">real USD, latest year</div>
        </div>
        <div className="stat">
          <div className="stat-val">—</div>
          <div className="stat-lbl">Statewide first-wholesale value</div>
          <div className="stat-sub">real USD, latest year</div>
        </div>
        <div className="stat">
          <div className="stat-val">—</div>
          <div className="stat-lbl">Total landings</div>
          <div className="stat-sub">round lbs, latest year</div>
        </div>
        <div className="stat">
          <div className="stat-val">—</div>
          <div className="stat-lbl">Active vessels</div>
          <div className="stat-sub">CFEC + NMFS, latest year</div>
        </div>
      </div>

      <Note>
        <b>Status.</b> This page reflects the May 2026 information-architecture
        pivot. The headline statistics above and the hero chart (planned) are
        blocked on new datasets the <code>mainsail_data</code> engine will
        publish: NMFS commercial landings (statewide and regional), NMFS
        first-wholesale value, CFEC vessel + permit rollups, NMFS processor
        count, and a pinned CPI-U deflator (base year 2025). The full
        information architecture and dataset list is in{" "}
        <a
          href="https://github.com/garrettevridge/mainsail_site/blob/main/docs/INFORMATION_ARCHITECTURE.md"
          target="_blank"
          rel="noreferrer"
        >
          docs/INFORMATION_ARCHITECTURE.md
        </a>
        .
      </Note>
    </article>
  );
}
