import { Link } from "react-router-dom";

const STORIES = [
  {
    id: "chinook",
    title: "Chinook salmon: removals and escapement",
    lede: "Where do Alaska's Chinook salmon go each year? Commercial harvest, escapement, subsistence, sport, and bycatch — rendered at rough statewide magnitudes.",
  },
  {
    id: "halibut",
    title: "Pacific halibut: where the fish go",
    lede: "The only fishery Alaska shares with Canada under a dedicated treaty organization. One reconciled mortality ledger, published by the International Pacific Halibut Commission.",
  },
  {
    id: "discards",
    title: "Federal groundfish: catch, retention, discards",
    lede: "How much of Alaska's 2-million-ton federal groundfish catch is retained, how much is discarded, and how that varies across gear types.",
  },
  {
    id: "observer",
    title: "Who is watching Alaska's federal fisheries?",
    lede: "Observer coverage rates by sector, 2013 through the most recent year. The 2013 program restructure is a hard methodology break.",
  },
  {
    id: "season",
    title: "Season tracker: what the fisheries look like right now",
    lede: "In-season views of Chinook PSC, federal groundfish TAC utilization, and Kenai Chinook sonar passage — refreshed as NMFS and ADF&G publish.",
  },
];

export default function Home() {
  return (
    <div className="bg-paper">
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-10">
        <h1 className="font-serif text-5xl md:text-6xl font-semibold leading-[1.1] tracking-tight">
          Alaska fisheries data,
          <br />
          curated and cited.
        </h1>
        <p className="prose-mainsail mt-6">
          Mainsail compiles, reconciles, and publishes publicly available data
          from federal, state, and international fisheries agencies. Each story
          below presents one topic in Alaska fisheries at rough magnitudes,
          with methodology notes and direct links to every source.
        </p>
        <p className="prose-mainsail">
          We do not advocate for outcomes. We publish the numbers. Readers draw
          their own conclusions.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-6">
          {STORIES.map((s) => (
            <Link
              key={s.id}
              to={`/stories/${s.id}`}
              className="block p-6 border border-line bg-white hover:border-accent transition-colors no-underline"
            >
              <h2 className="font-serif text-2xl font-semibold text-ink mb-2">{s.title}</h2>
              <p className="text-ink text-base leading-relaxed">{s.lede}</p>
              <p className="mt-4 text-accent text-sm">Read the story →</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
