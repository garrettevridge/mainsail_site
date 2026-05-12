import { Link } from "react-router-dom";
import {
  Card,
  Crumb,
  FlowSteps,
  KV,
  Note,
  Pill,
  Table,
} from "../components/primitives";

export default function Management() {
  return (
    <article>
      <Crumb topic="Fisheries Management" />
      <span className="section-pill">04 · Section</span>
      <h1 className="page-title">Fisheries Management</h1>

      <p className="page-lede first-sentence">
        Two bodies make the rules. The North Pacific Fishery Management
        Council manages federal waters; the Alaska Board of Fisheries
        manages state waters.
      </p>
      <p className="page-lede">
        A handful of treaties cover species that don't respect those
        boundaries — Pacific halibut, salmon stocks shared with Canada,
        and the anadromous fish that range across the high seas.
        Underneath all of it is a science program — NMFS, ADF&amp;G, and
        the IPHC — that estimates how much fish is in the water before
        anyone fishes.
      </p>

      <h2 className="h2">Who makes the rules</h2>

      <h3 className="h3">North Pacific Fishery Management Council (NPFMC)</h3>
      <Card>
        <div style={{ marginBottom: 10 }}>
          <Pill kind="fed">Federal</Pill>
        </div>
        <KV
          pairs={[
            { dt: "Authority", dd: "Magnuson-Stevens Fishery Conservation and Management Act (MSA, 1976)" },
            { dt: "Jurisdiction", dd: "Federal waters 3–200 nautical miles off Alaska — Bering Sea, Aleutian Islands, Gulf of Alaska, Arctic" },
            { dt: "Voting members", dd: "11 — including 5 from Alaska, 1 each from Oregon and Washington, the Alaska Regional Administrator of NMFS, the Alaska Commissioner of Fish & Game, and the U.S. Coast Guard / U.S. Fish & Wildlife Service representatives" },
            { dt: "Non-voting", dd: "U.S. State Department, Pacific States Marine Fisheries Commission" },
            { dt: "Meetings", dd: "Approximately 5 per year, rotating among Alaska venues plus Seattle/Portland; all public" },
            { dt: "Species covered", dd: "Groundfish (pollock, cod, sablefish, flatfish, rockfish, Atka mackerel), crab, scallops, salmon in federal waters (limited)" },
          ]}
        />
        <h4 className="h3" style={{ marginTop: 18 }}>Rulemaking process</h4>
        <FlowSteps
          steps={[
            { label: "Step 1", value: "Plan Teams", sub: "Annual stock assessment + SAFE report" },
            { label: "Step 2", value: "SSC", sub: "Scientific & Statistical Committee — sets ABC" },
            { label: "Step 3", value: "Advisory Panel", sub: "Industry / public review" },
            { label: "Step 4", value: "Council", sub: "Sets TAC, adopts measures" },
            { label: "Step 5", value: "NMFS", sub: "Secretary of Commerce reviews; AKRO implements" },
          ]}
        />
        <div className="data-caption">
          Source: NPFMC website (npfmc.org), Magnuson-Stevens Act.
        </div>
      </Card>

      <h3 className="h3">Alaska Board of Fisheries (BOF)</h3>
      <Card>
        <div style={{ marginBottom: 10 }}>
          <Pill kind="st">State</Pill>
        </div>
        <KV
          pairs={[
            { dt: "Authority", dd: "Alaska Statute 16.05 (Department of Fish and Game)" },
            { dt: "Jurisdiction", dd: "State waters 0–3 nautical miles; plus all salmon, herring, and most shellfish in state-controlled areas" },
            { dt: "Members", dd: "7, appointed by the Governor and confirmed by the Legislature; 3-year terms" },
            { dt: "Meetings", dd: "Approximately 4–6 per year, on a 3-year rotating regional cycle (Southeast → AYK/Bristol Bay/Westward → Central/Southcentral → statewide finfish)" },
            { dt: "Process input", dd: "Public proposals submitted in writing; ADF&G staff write Reports to the Board; deliberation and adoption by majority vote" },
            { dt: "Species covered", dd: "Salmon (all five species, statewide), herring, halibut sport allocation, shellfish (state crab, shrimp, dive fisheries), Pacific cod state GHL fisheries, others" },
          ]}
        />
        <h4 className="h3" style={{ marginTop: 18 }}>Rulemaking process</h4>
        <FlowSteps
          steps={[
            { label: "Step 1", value: "Public proposals", sub: "Anyone can submit; deadlines published per cycle" },
            { label: "Step 2", value: "ADF&G", sub: "Staff comments + Reports to the Board" },
            { label: "Step 3", value: "Advisory Committees", sub: "Local user-group input" },
            { label: "Step 4", value: "Board meeting", sub: "Deliberation + majority vote" },
            { label: "Step 5", value: "Regulation", sub: "Published in 5 AAC; enforced by ADF&G" },
          ]}
        />
        <div className="data-caption">
          Source: ADF&amp;G Boards Support Section, Alaska Statute 16.05.
        </div>
      </Card>

      <h2 className="h2">Treaties &amp; cross-jurisdiction</h2>
      <p className="section-intro">
        Three international bodies cover species the Council and Board
        cannot manage alone — halibut (coastwide migration), shared salmon
        stocks (transboundary rivers), and high-seas anadromous fish.
      </p>
      <Card>
        <Table
          columns={[
            { label: "Body" },
            { label: "Type" },
            { label: "Established" },
            { label: "Parties" },
            { label: "Scope" },
          ]}
          rows={[
            [
              "International Pacific Halibut Commission (IPHC)",
              <Pill kind="int">Treaty</Pill>,
              "1923",
              "Canada, United States",
              "Coastwide Pacific halibut stock assessment + allocation across regulatory areas 2A–4CDE",
            ],
            [
              "Pacific Salmon Commission (PSC)",
              <Pill kind="int">Treaty</Pill>,
              "1985",
              "Canada, United States",
              "Transboundary salmon stocks — Southeast Alaska / British Columbia troll and net fisheries; Yukon River; Fraser River sockeye",
            ],
            [
              "North Pacific Anadromous Fish Commission (NPAFC)",
              <Pill kind="int">Convention</Pill>,
              "1992",
              "Canada, Japan, Republic of Korea, Russian Federation, United States",
              "Anadromous fish stocks (salmon, steelhead) on the high seas of the North Pacific north of 33°N; prohibition on directed high-seas harvest",
            ],
          ]}
          caption="Treaty / convention text is the authoritative source; parties listed use UN short-name designations."
        />
      </Card>

      <h2 className="h2">The science behind the rules</h2>
      <p className="section-intro">
        Catch limits don't start with the Council or the Board — they
        start with a biomass estimate. Two agencies (plus IPHC for
        halibut) produce the underlying science.
      </p>
      <Card>
        <KV
          pairs={[
            {
              dt: "NMFS Alaska Fisheries Science Center",
              dd: (
                <>
                  Annual stock assessments for federally-managed groundfish
                  and crab; published in Stock Assessment and Fishery
                  Evaluation (SAFE) reports each November. Feeds the
                  NPFMC's December TAC-setting meeting.
                </>
              ),
            },
            {
              dt: "ADF&G Division of Commercial Fisheries",
              dd: (
                <>
                  In-season management of salmon, herring, and state-water
                  fisheries; sets escapement goals; runs forecasts each
                  spring; manages openings and closures in real time. Deep
                  partnership with NPAFC for high-seas data.
                </>
              ),
            },
            {
              dt: "IPHC Secretariat",
              dd: (
                <>
                  Annual coastwide halibut stock assessment; survey of
                  ~1,300 stations from Oregon to the Aleutians; allocates
                  Total Constant Exploitation Yield (TCEY) across regulatory
                  areas each January.
                </>
              ),
            },
          ]}
        />
      </Card>

      <h2 className="h2">Deeper data on this site</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 14,
          margin: "14px 0 8px",
        }}
      >
        <Link to="/topics/biomass" className="card" style={{ display: "block" }}>
          <div className="card-title">Biomass, TAC &amp; ABC</div>
          <div className="card-sub">Stock assessment → catch limit pipeline</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            Five federally-managed Tier 1 stocks tracked from total biomass
            through OFL → ABC → TAC → realized catch. Sourced from NMFS
            SAFE reports and the BSAI/GOA harvest specifications.
          </div>
        </Link>
        <Link to="/topics/observer" className="card" style={{ display: "block" }}>
          <div className="card-title">Observer coverage</div>
          <div className="card-sub">How catch gets measured at sea</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            Federal observer + electronic monitoring coverage rates by
            sector, gear, and species group, from the 2013 program
            restructure to present. State-side observer programs (ADF&amp;G
            crab, IPHC sea samplers) noted separately.
          </div>
        </Link>
      </div>

      <Note>
        <b>Status.</b> This page is unblocked — no new datasets required.
        Council and Board facts are sourced from public agency pages
        (npfmc.org, adfg.alaska.gov). Full IA in{" "}
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
