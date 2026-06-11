// Sections for which Mainsail has not yet ingested data.
// Each renders the whitepaper's narrative scaffolding (prose placeholders +
// chart placeholders) so the page reads end-to-end; charts will be wired
// when the underlying datasets land.

import { PlaceholderChart } from "../ChartCard";

export function OtherFisheries() {
  return (
    <section id="other-bycatch" className="sm-section">
      <div className="sm-marker">
        <span className="num">Other fisheries</span>
        <span className="title">Other fisheries — hook-and-line, pot, state</span>
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
        <span className="num">Observer coverage</span>
        <span className="title">Observer coverage</span>
      </div>

      <h2 className="sm-h2">
        How we know <span className="accent">what's in the nets.</span>
      </h2>

      <p className="sm-p">
        Every catch and bycatch figure in this paper's federal sections rests on
        one thing: independent observation. The North Pacific observer program
        began in 1973 and was restructured in 2013 to bring smaller vessels into
        coverage through statistical sampling and, increasingly, cameras.
        Observers do unglamorous, essential work — they sample the catch, record
        the bycatch, document the gear, and feed it all to NOAA's catch
        accounting. Coverage is tiered: the Bering Sea pollock and factory-trawl
        fleets carry full coverage, with an observer or camera on essentially
        every trip; the Gulf of Alaska and smaller vessels fall under partial
        coverage, where trips are statistically sampled or monitored by
        electronic camera systems that now cover a majority of some fleets.
      </p>

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

      <p className="sm-p">
        The contrast in numbers is stark. Federal trawl trips are observed at
        rates approaching 100 percent — the Bering Sea pollock fleet carries an
        observer or camera on every trip, and shoreside plants run two observers
        per offload. State fisheries, by and large, carry close to none.
      </p>

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
        <span className="num">Climate &amp; ocean</span>
        <span className="title">The signal under the signal</span>
      </div>

      <h2 className="sm-h2">
        The signal <span className="accent">under the signal.</span>
      </h2>

      <p className="sm-p">
        Every debate in this paper — bycatch, harvest limits, observer coverage,
        allocation — is partly an argument about one question: how much of what
        we see in the data is driven by fishing, and how much by the ocean
        itself. For the past decade, the honest answer is that most of it is the
        ocean. Bering Sea surface temperatures since 2014 have been the warmest
        in the instrumental record, peaking around three degrees Celsius above
        normal in 2018–2019. The cold pool — the band of frigid bottom water
        that structures the whole shelf ecosystem — retreated dramatically. Snow
        crab biomass collapsed by more than 90 percent between 2018 and 2022.
        Pacific cod recruitment failed in the Gulf of Alaska. Yukon Chinook
        subsistence fishing has now been closed for more than ten consecutive
        years. Almost none of this is fishery-driven in any meaningful sense.
      </p>

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

      <p className="sm-p">
        Three cases make the pattern concrete. Snow crab collapsed rapidly
        during the marine heatwave; the AFSC literature attributes it to direct
        heat mortality and metabolic mismatch — the warm water raised the
        animals' energy demand past what the system could feed — not to
        overfishing. Western Alaska salmon marine-survival rates crashed across
        stocks that share nothing in common except where they spend their ocean
        phase. And Gulf of Alaska Pacific cod failed to produce strong
        year-classes during the warm years and began recovering when the cold
        returned. In each case the fishing fleet is a bystander to the dominant
        signal, and in each case the management system responded by cutting
        harvest or closing the fishery outright.
      </p>

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
        <span className="num">Seafloor &amp; habitat</span>
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
        <span className="num">Conclusion</span>
        <span className="title">What the data adds up to</span>
      </div>

      <h2 className="sm-h2">
        What we <span className="accent">make of it.</span>
      </h2>

      <p className="sm-p">
        Everything to this point has been the data. This is the part where we
        tell you what we think it means. It is labeled as opinion because that is
        what it is — you have the same charts we do, and you are free to reach a
        different conclusion.
      </p>

      <p className="sm-p">
        The benefits of the Bering Sea
        pollock fishery — the scale of the food, the jobs, and the communities it
        holds up, under one of the most conservative and most closely observed
        management systems on earth — are worth its cost. That is not the same as
        saying the cost is acceptable and finished. Bycatch is real, it includes
        fish that Western Alaska is grieving, and it has to keep falling; the
        fishery that is counted to the last fish is the one with the least excuse
        to stop improving. But the case that pollock is the cause of the salmon
        collapse does not survive contact with the data, and the lever the public
        is reaching for — shutting down the cleanest gear in the ocean — cannot
        deliver the recovery people are owed. A warming ocean did that damage,
        and only a different conversation will begin to address it.
      </p>

      <p className="sm-p">
        None of the hard problems in this paper get solved by a single document,
        and we are not pretending otherwise. The marine-survival crisis behind
        the Western Alaska salmon collapse, the gaps in state-fishery
        monitoring, the allocation fights that the data alone cannot settle —
        these require sustained attention, and they require Alaskans to assert
        clear leadership in deciding what their fisheries are for. Our role is
        narrower and we will keep to it: to put the best available data in front
        of that conversation, update it as the record grows, and follow this
        paper with the sections still marked pending here.
      </p>

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

      <p className="sm-p">
        This work stands on public data. We are grateful to the agencies that
        collect and publish it — NOAA's Alaska Fisheries Science Center, the
        North Pacific Fishery Management Council, the Alaska Department of Fish
        and Game, the International Pacific Halibut Commission, the U.S. Fish and
        Wildlife Service, AKFIN, and AOOS — and to the academic and industry
        partners whose engagement supported portions of the underlying data
        infrastructure.
      </p>
    </section>
  );
}
