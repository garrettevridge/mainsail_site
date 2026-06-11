import { useEffect } from "react";
import { Link } from "react-router-dom";
import { TOPICS, type Topic } from "./topics";

// A focused single-topic view. Renders one section component on its own, with
// a path back to the overview and prev/next links to the neighboring topics —
// so the reader can step through if they want, but never has to.

export default function TopicView({ topic }: { topic: Topic }) {
  const idx = TOPICS.findIndex((t) => t.slug === topic.slug);
  const prev = idx > 0 ? TOPICS[idx - 1] : null;
  const next = idx < TOPICS.length - 1 ? TOPICS[idx + 1] : null;
  const { Component } = topic;

  // Reset scroll when switching topics.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [topic.slug]);

  return (
    <article className="sm-topic">
      <Link to="/#explore" className="sm-topic-back">
        ← Overview
      </Link>

      <Component />

      <nav className="sm-topic-nav">
        {prev ? (
          <Link to={`/${prev.slug}`} className="sm-topic-nav-link prev">
            <span className="dir">← Previous</span>
            <span className="lbl">{prev.label}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/${next.slug}`} className="sm-topic-nav-link next">
            <span className="dir">Next →</span>
            <span className="lbl">{next.label}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
