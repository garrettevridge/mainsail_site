import { Link } from "react-router-dom";
import Intro from "./sections/Intro";
import History from "./sections/History";
import { Closing } from "./sections/Placeholders";
import { TOPICS, TOPIC_GROUPS } from "./topics";

// The landing / hub: a short, complete read — Introduction, a short history,
// and the conclusion — followed by a map of the deep topics the reader can
// open. Everything below the spine lives in the sidebar and at its own URL.

export default function Spine() {
  return (
    <>
      <header className="sm-hero" id="top">
        <div>
          <div className="sm-hero-meta">
            <span className="marker">VOL 01</span>
            <span>Seamark Whitepaper / 2026</span>
            <span>Read the overview · explore the data</span>
          </div>
          <h1 className="sm-hero-title">
            Alaska's<br />
            fisheries,<br />
            <span className="accent">by the data.</span>
          </h1>
          <div className="sm-hero-deck">
            A century of commercial fishing in Alaska, and what the best
            available data actually says about the contested topics of 2026.
          </div>
        </div>
        <div className="sm-hero-foot">
          <span>Seamark Holdings, Anchorage</span>
          <span className="cue">Read ↓</span>
        </div>
      </header>

      <Intro />
      <History />
      <Closing />

      {/* Map of the deep topics */}
      <section className="sm-section" id="explore">
        <div className="sm-marker">
          <span className="num">Explore the data</span>
          <span className="title">The topics behind the conclusion</span>
        </div>
        <h2 className="sm-h2">
          Go deeper <span className="accent">on any topic.</span>
        </h2>
        <p className="sm-p">
          The conclusion above rests on the data in the topics below. Open any
          one — each is a short, self-contained look at what the best available
          data shows. Nothing here needs to be read in order.
        </p>
        {TOPIC_GROUPS.map((g) => (
          <div className="sm-topic-group" key={g}>
            <div className="sm-topic-group-label">{g}</div>
            <div className="sm-topic-cards">
              {TOPICS.filter((t) => t.group === g).map((t) => (
                <Link key={t.slug} to={`/${t.slug}`} className="sm-topic-card">
                  {t.label}
                  <span className="arr">→</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
