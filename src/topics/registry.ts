export interface TopicDefinition {
  slug: string;
  title: string;
}

export const TOPICS: TopicDefinition[] = [
  { slug: "landing",     title: "Landing" },
  { slug: "harvest",     title: "Harvest" },
  { slug: "communities", title: "Communities" },
  { slug: "markets",     title: "Markets" },
  { slug: "management",  title: "Management" },
  { slug: "bycatch",     title: "Bycatch" },
];
