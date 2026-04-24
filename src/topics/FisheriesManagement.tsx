import {
  Card,
  Crumb,
  KV,
  Note,
  Pill,
  Table,
} from "../components/primitives";

export default function FisheriesManagement() {
  return (
    <>
      <Crumb topic="Fisheries Management" />
      <h1 className="page-title">Fisheries Management</h1>
      <p className="page-lede first-sentence">
        Alaska supplies more than half of all U.S. seafood by weight, drawn from
        some of the most productive marine ecosystems in the world — and it does
        so under a fisheries management system that is unusual for its
        scientific basis, its layered jurisdiction, and its record of avoiding
        stock collapse since statehood in 1959.
      </p>
      <p className="page-lede">
        Three bodies share authority. The <b>State of Alaska</b> manages all
        salmon, herring, shellfish, and nearshore groundfish inside three
        nautical miles from shore. The <b>federal government</b>, through NMFS
        and the North Pacific Fishery Management Council, manages groundfish
        and crab between 3 and 200 miles. <b>Pacific halibut</b> is managed
        coastwide by the International Pacific Halibut Commission under a 1923
        U.S.–Canada treaty — the oldest active fisheries treaty in North
        America.
      </p>
      <p className="page-lede">
        Each body sets catch limits through a public, peer-reviewed process:
        biologists estimate what the stock can support, the limit is reduced
        for uncertainty and policy considerations, and the final number is
        published before the season opens. The rest of this page describes
        that system as it stands today.
      </p>

      <h2 className="h2">Jurisdiction at a glance</h2>
      <Card>
        <Table
          columns={[
            { label: "Fishery" },
            { label: "Waters" },
            { label: "Managing body" },
            { label: "Authority" },
          ]}
          rows={[
            ["All salmon", "0–200 nm", "State — ADF&G Division of Commercial Fisheries", "Alaska statutes + Board of Fisheries regs"],
            ["Herring", "0–200 nm", "State — ADF&G", "Alaska statutes + Board of Fisheries"],
            ["State-waters groundfish", "0–3 nm", "State — ADF&G", "Alaska statutes + Board of Fisheries"],
            ["Federal groundfish (pollock, cod, sablefish, flatfish, etc.)", "3–200 nm", "Federal — NMFS AKRO, advised by NPFMC", "Magnuson-Stevens Act + FMPs"],
            ["BSAI & GOA crab", "3–200 nm", "Federal — NMFS, state cooperatively", "MSA + state-federal crab FMPs"],
            ["Pacific halibut", "Coastwide (AK, BC, WA, OR, CA)", "International — IPHC, implemented by NMFS (US) and DFO (CA)", "Halibut Convention Act of 1982"],
            ["Federal subsistence (rural, federal lands/waters)", "Federal public waters", "USFWS Office of Subsistence Management", "ANILCA Title VIII"],
            ["Recreational (sport)", "0–200 nm", "State inside 3 nm; charter halibut co-managed with IPHC/NMFS", "AK statutes + 50 CFR 300 Subpart E"],
          ]}
        />
      </Card>

      <h3 className="h3">How rules are made</h3>
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card>
          <div><Pill kind="fed">Federal</Pill></div>
          <div className="card-title" style={{ marginTop: 8 }}>North Pacific Fishery Management Council</div>
          <div className="card-sub">MSA-chartered body · Anchorage-based · 15 voting members (AK, WA, OR, federal, tribal)</div>
          <KV
            pairs={[
              { dt: "Meets", dd: "5× per year, publicly, with SSC and AP advisory bodies" },
              { dt: "Key outputs", dd: "Fishery Management Plans (FMPs), annual harvest specifications, PSC caps, gear & area rules" },
              { dt: "Science", dd: "Stock assessments from AFSC (NOAA Alaska Fisheries Science Center); SAFE reports annually" },
              { dt: "Implements", dd: "NMFS AKRO promulgates and enforces as federal regulations (50 CFR 679)" },
            ]}
          />
        </Card>
        <Card>
          <div><Pill kind="st">State</Pill></div>
          <div className="card-title" style={{ marginTop: 8 }}>Alaska Board of Fisheries</div>
          <div className="card-sub">7 members appointed by the Governor · 4–6 meetings per year on regional cycles</div>
          <KV
            pairs={[
              { dt: "Cycle", dd: "Three-year rotation by region (Lower Cook Inlet, Bristol Bay, AYK, etc.)" },
              { dt: "Key outputs", dd: "Management plans, escapement goals, allocation between user groups" },
              { dt: "Science", dd: "ADF&G Division of Commercial Fisheries and Division of Sport Fish" },
              { dt: "Implements", dd: "ADF&G area managers exercise emergency order authority in-season" },
            ]}
          />
        </Card>
      </div>

      <h2 className="h2">Transboundary bodies</h2>
      <Card>
        <Table
          columns={[
            { label: "Body" },
            { label: "Parties" },
            { label: "Scope" },
            { label: "Est." },
          ]}
          rows={[
            ["International Pacific Halibut Commission (IPHC)", "U.S. & Canada", "Stock assessment, catch limits (TCEY), regulation of the halibut fishery coastwide", "1923"],
            ["Pacific Salmon Commission", "U.S. & Canada", "Transboundary salmon sharing under the Pacific Salmon Treaty (Stikine, Taku, Alsek; WCVI Chinook)", "1985"],
            ["Yukon River Panel", "U.S. & Canada", "Yukon Chinook, chum and coho management under the Yukon River Salmon Agreement", "1995"],
            ["North Pacific Anadromous Fish Commission (NPAFC)", "U.S., Canada, Japan, Russia, Korea", "High-seas salmon research and enforcement of no-directed-harvest rule beyond EEZs", "1993"],
          ]}
        />
      </Card>

      <Note>
        <b>IPHC.</b> The International Pacific Halibut Commission was
        established in 1923 by treaty between the U.S. and Canada. Its annual
        stock assessment consolidates halibut mortality reported by U.S. and
        Canadian agencies into a single coastwide ledger.
      </Note>
    </>
  );
}
