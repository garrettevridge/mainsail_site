export interface SectionDefinition {
  slug: string;
  title: string;
  short: string;
  blurb: string;
}

export const SECTIONS: SectionDefinition[] = [
  {
    slug: "communities",
    title: "Communities",
    short: "Communities",
    blurb:
      "Where Alaska's seafood is landed — and how those communities rank nationally and globally.",
  },
  {
    slug: "harvest",
    title: "Harvest",
    short: "Harvest",
    blurb:
      "What is caught, how much, where, and how the value has moved over the long run.",
  },
  {
    slug: "markets",
    title: "Markets",
    short: "Markets",
    blurb:
      "Where Alaska seafood goes — exports, US retail and foodservice, and the in-state market.",
  },
  {
    slug: "management",
    title: "Fisheries Management",
    short: "Management",
    blurb:
      "How the rules are made: NPFMC, Board of Fisheries, IPHC, and the science programs they rely on.",
  },
  {
    slug: "bycatch",
    title: "Bycatch",
    short: "Bycatch",
    blurb:
      "Chinook, chum, and halibut bycatch — volumes, sources, and stock context.",
  },
];
