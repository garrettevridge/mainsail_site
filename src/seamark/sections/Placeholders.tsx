// Sections for which Mainsail has not yet ingested data.
// Each renders the whitepaper's narrative scaffolding (prose placeholders +
// chart placeholders) so the page reads end-to-end; charts will be wired
// when the underlying datasets land.

import { PlaceholderChart } from "../ChartCard";

export function OtherFisheries() {
  return (
    <section id="other-bycatch" className="sm-section">
      <div className="sm-marker">
        <span className="num">03e / Other fisheries</span>
        <span className="title">Hook-and-line, pot, state</span>
      </div>

      <h2 className="sm-h2">
        Bycatch outside trawl <span className="sm-confirm-tag">Confirm: keep?</span>
      </h2>

      <div className="sm-annot">
        <strong>SEAMARK NOTE:</strong> Included by recommendation. Without
        it, the whitepaper shows only trawl bycatch and reads as anti-trawl
        by omission. Confirm whether to keep, scope, or drop.
      </div>

      <div className="sm-placeholder">
        <span className="cap">Prose — bycatch outside trawl</span>
        <span className="body">
          Hook-and-line fisheries (cod, sablefish, halibut longline) have
          meaningful bycatch — historically ~14% of total catch by weight
          in some recent years, with seabirds and non-target groundfish as
          the main species of concern. Pot fisheries have lower bycatch
          rates but capture juvenile fish. State fisheries — including
          salmon set and drift gillnet, seine, and beach seine — have far
          less complete bycatch documentation. Present what's available
          and label what isn't.
        </span>
      </div>

      <PlaceholderChart
        label="Fig 3.7 · comparative · 1990s–present"
        source="NOAA AKR · ADF&G"
        title="Bycatch in non-trawl Alaska fisheries, over time."
        caption="Small-multiples or stacked time series: hook-and-line bycatch trajectory, pot bycatch, and where state-fishery data exists, gillnet and seine bycatch."
        note="State-fishery bycatch dataset not yet gathered"
      >
        {null}
      </PlaceholderChart>

      <div className="sm-placeholder">
        <span className="cap">Prose — data gap acknowledgment</span>
        <span className="body">
          Be explicit: state-managed salmon fisheries do not have observer
          programs comparable to federal groundfish. Bycatch in commercial
          salmon nets — including non-target salmon species, char, and
          Dolly Varden — is documented in management reports but not at
          the resolution federal fisheries are. We do not have an estimate
          of total state-fishery bycatch comparable to the federal figures.
          This is a real gap that affects every comparison in this
          whitepaper.
        </span>
      </div>
    </section>
  );
}

export function Observers() {
  return (
    <section id="observers" className="sm-section">
      <div className="sm-marker">
        <span className="num">05 / Observer coverage</span>
        <span className="title">How we know what's in the nets</span>
      </div>

      <h2 className="sm-h2">
        How we know <span className="accent">what's in the nets.</span>
      </h2>

      <div className="sm-placeholder">
        <span className="cap">Prose — history of the observer program</span>
        <span className="body">
          Brief history: federal observer program in the North Pacific
          began in 1973, restructured in 2013 to expand coverage to small
          vessels via partial coverage and electronic monitoring. Walk
          through what observers do — sample catch, record bycatch,
          document gear, transmit data to NOAA for catch accounting.
          Distinguish full coverage (every trip, BSAI pollock, factory
          trawlers) from partial coverage (statistically sampled trips,
          GOA and smaller vessels) from electronic monitoring (cameras,
          increasingly used in GOA).
        </span>
      </div>

      <PlaceholderChart
        label="Fig 5.1 · primary · time series"
        source="NOAA AKR Annual Observer Program Reports"
        title="Observer coverage rates over time, by fleet segment."
        height="tall"
        caption="Stacked or grouped time series: BSAI pollock pelagic (100% / 1-2 observers per trip), GOA pollock (mix of cameras 66% and observer 34% in recent years), shoreside plants (2 observers per offload), longline EFP fleets, partial coverage fleets."
        note="Observer coverage dataset not yet gathered"
      >
        {null}
      </PlaceholderChart>

      <div className="sm-stat-row">
        <div className="sm-stat"><div className="sm-stat-num">98%</div><div className="sm-stat-lbl">Trawl vessel trips observed (federal fisheries)</div></div>
        <div className="sm-stat"><div className="sm-stat-num">100%</div><div className="sm-stat-lbl">BSAI pollock — observer or camera every trip</div></div>
        <div className="sm-stat"><div className="sm-stat-num">2</div><div className="sm-stat-lbl">Observers per shoreside plant offload</div></div>
        <div className="sm-stat"><div className="sm-stat-num">~0%</div><div className="sm-stat-lbl">State fishery observer coverage (most fisheries)</div></div>
      </div>

      <p className="sm-p">
        The honest closing point: federal fisheries are observed at among
        the highest rates in any large-scale wild capture system globally.
        State fisheries are not. The catch and bycatch data we present in
        this whitepaper for federal fisheries comes from one of the most
        scrutinized monitoring systems anywhere. The state-fishery data we
        present comes from logbooks, management reports, and stock
        assessments — useful, but not the same thing. Every comparison in
        this paper should be read with that asymmetry in mind.
      </p>
    </section>
  );
}

export function Climate() {
  return (
    <section id="climate" className="sm-section">
      <div className="sm-marker">
        <span className="num">06 / Climate &amp; ocean</span>
        <span className="title">The signal under the signal</span>
      </div>

      <h2 className="sm-h2">
        The signal <span className="accent">under the signal.</span>
      </h2>

      <div className="sm-placeholder">
        <span className="cap">Prose — why this section exists at all</span>
        <span className="body">
          Every debate in this whitepaper — bycatch, harvest limits,
          observer coverage, allocation — is partly a debate about how
          much of what we see in the data is fishery-driven and how much
          is environmentally driven. The honest answer for the past
          decade is: most of it, environmentally. Bering Sea sea surface
          temperatures since 2014 have been the warmest in the
          instrumental record. The cold pool has retreated dramatically.
          Snow crab biomass collapsed by more than 90 percent between
          2018 and 2022. Pacific cod recruitment failed in the Gulf of
          Alaska. AYK salmon returns collapsed. None of this is
          fishery-driven in any meaningful sense.
        </span>
      </div>

      <PlaceholderChart
        label="Fig 6.1 · primary · 1980–present"
        source="NOAA AFSC ESR · NCEI"
        title="Bering Sea sea surface temperature anomaly, with major fishery events annotated."
        height="tall"
        caption="Line chart of annual SST anomaly with fishery events overlaid."
        note="SST anomaly dataset not yet gathered"
      >
        {null}
      </PlaceholderChart>

      <PlaceholderChart
        label="Fig 6.2 · supporting · 1982–present"
        source="NOAA AFSC EBS Bottom Trawl Survey · ESR"
        title="Cold pool extent — Eastern Bering Sea, by year."
        caption="Time series of summer cold pool area (km² of bottom water below 2°C)."
        note="Cold pool dataset not yet gathered"
      >
        {null}
      </PlaceholderChart>

      <div className="sm-stat-row">
        <div className="sm-stat"><div className="sm-stat-num">+3°C</div><div className="sm-stat-lbl">Peak Bering Sea SST anomaly, 2018–2019</div></div>
        <div className="sm-stat"><div className="sm-stat-num">~90%</div><div className="sm-stat-lbl">Snow crab biomass decline, 2018–2022</div></div>
        <div className="sm-stat"><div className="sm-stat-num">10+ yrs</div><div className="sm-stat-lbl">Consecutive Yukon Chinook subsistence closures</div></div>
        <div className="sm-stat"><div className="sm-stat-num">≈0</div><div className="sm-stat-lbl">Of these driven by fishing fleet activity</div></div>
      </div>

      <div className="sm-placeholder">
        <span className="cap">Prose — three worked examples</span>
        <span className="body">
          Walk through three specific cases where environmental signal
          dominates fisheries data. (1) Snow crab: rapid collapse during
          the heatwave, attributed in AFSC literature to direct mortality
          and metabolic mismatch, not to overfishing. (2) AYK salmon:
          marine survival rates crashed across stocks that have nothing
          in common except where they spend their ocean phase. (3)
          Pacific cod GOA recruitment: failed to produce strong
          year-classes during warm years; recovered with cold years.
        </span>
      </div>

      <PlaceholderChart
        label="Fig 6.3 · interactive · ESR indicator selector"
        source="NOAA AFSC ESR · AOOS"
        title="Ecosystem indicator dashboard."
        caption="Selector with 6–8 indicators from the NOAA AFSC Ecosystem Status Reports."
        note="ESR indicator dataset not yet gathered"
      >
        {null}
      </PlaceholderChart>

      <p className="sm-p">
        Two closing points. First, a management system that responds to
        environmental shocks by closing fisheries and reducing harvest —
        which is what happened in snow crab, in Pacific cod, in AYK
        salmon — is a system that is working as designed. Second,
        pretending that the trends visible in the data are primarily
        fishery-driven, when the science says they are primarily
        environmental, leads to policy choices that won't produce the
        outcomes the public wants.
      </p>
    </section>
  );
}

export function Habitat() {
  return (
    <section id="habitat" className="sm-section">
      <div className="sm-marker">
        <span className="num">07 / Habitat</span>
        <span className="title">Seafloor contact and habitat</span>
      </div>

      <h2 className="sm-h2">
        Seafloor contact <span className="sm-confirm-tag">Confirm: keep?</span>
      </h2>

      <div className="sm-annot">
        <strong>SEAMARK NOTE:</strong> Not in your May 18 section list but
        in your May 15 list and prominent in Pollock 101. Confirm whether
        to include, defer to a follow-up paper, or drop.
      </div>

      <div className="sm-placeholder">
        <span className="cap">Prose — habitat framing</span>
        <span className="body">
          Seafloor contact is not the same as habitat harm. All
          bottom-tending gear contacts the seafloor, including longline,
          pot, and trawl. NOAA's Essential Fish Habitat (EFH) review
          framework estimates cumulative habitat impact across all
          fishing gear types over time. Cumulative impact from the pollock
          fishery is roughly 1.4% in the Bering Sea and 0.7% in the Gulf
          of Alaska.
        </span>
      </div>

      <PlaceholderChart
        label="Fig 7.1 · cumulative · time series"
        source="NOAA EFH 5-Year Review"
        title="Cumulative seafloor impact by gear type, BSAI and GOA, over time."
        caption="Cumulative impact accumulating year over year, with the slope showing the rate of new impact in any given year."
        note="EFH cumulative impact dataset not yet gathered"
      >
        {null}
      </PlaceholderChart>
    </section>
  );
}

export function Closing() {
  return (
    <section id="closing" className="sm-section">
      <div className="sm-marker">
        <span className="num">Closing</span>
        <span className="title">Where this goes from here</span>
      </div>

      <h2 className="sm-h2">
        Where the conversation <span className="accent">goes from here.</span>
      </h2>

      <div className="sm-placeholder">
        <span className="cap">Closing prose</span>
        <span className="body">
          Restate the position from the intro: best available data,
          allocation versus conservation distinction, defend the regime
          not the status quo. Acknowledge what's coming next from Seamark
          — new sections, data updates, follow-on whitepapers. Invite
          engagement without rhetorical flourish. End on cooperation, not
          victory: this is the kind of conversation that requires
          sustained attention, not a single document.
        </span>
      </div>

      <div className="sm-cta">
        <div className="label">For the reader</div>
        <h3>Download the data. Read the methodology. Stay informed.</h3>
        <p>
          Every chart in this paper draws on public data. We are
          publishing the source data, the methodology notes, and the
          underlying API. Use it to verify, to disagree, or to do your
          own analysis.
        </p>
        <div className="sm-cta-buttons">
          <a
            href="https://mainsail-public-data.s3.us-west-2.amazonaws.com/manifest.json"
            target="_blank"
            rel="noreferrer"
            className="sm-cta-btn"
          >
            Download data
          </a>
          <a href="#" className="sm-cta-btn ghost">Read methodology</a>
          <a href="#" className="sm-cta-btn ghost">Subscribe to updates</a>
        </div>
      </div>

      <div className="sm-placeholder">
        <span className="cap">Acknowledgments</span>
        <span className="body">
          Brief acknowledgments: data providers (NOAA AFSC, NPFMC, ADF&amp;G,
          IPHC, USFWS, AKFIN, AOOS), academic partners where relevant, the
          AFISH engagement that supported portions of the underlying data
          infrastructure.
        </span>
      </div>
    </section>
  );
}
