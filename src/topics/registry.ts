export interface TopicDefinition {
  slug: string;
  title: string;
}

export const TOPICS: TopicDefinition[] = [
  { slug: "fisheries-management", title: "Fisheries Management" },
  { slug: "biomass",               title: "Biomass, TAC & ABC" },
  { slug: "observer",              title: "Observer Coverage" },
  { slug: "halibut",               title: "Halibut Mortality by Source" },
  { slug: "chinook",               title: "Chinook Mortality & Genetics" },
  { slug: "chum",                  title: "Chum Salmon Mortality & Genetics" },
  { slug: "discards",              title: "Discards & Utilization" },
];
