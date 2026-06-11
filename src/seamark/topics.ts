import type { ComponentType } from "react";
import Scale from "./sections/Scale";
import Limits from "./sections/Limits";
import BycatchOverview from "./sections/BycatchOverview";
import Chinook from "./sections/Chinook";
import Chum from "./sections/Chum";
import WesternAlaska from "./sections/WesternAlaska";
import Halibut from "./sections/Halibut";
import Discards from "./sections/Discards";
import StateManagement from "./sections/StateManagement";
import { Observers, Climate, Habitat } from "./sections/Placeholders";

// Hub-and-spoke topic registry. The spine (Introduction / History /
// Conclusion) lives on the landing route; everything here is a "spoke" — a
// focused single-topic view reached from the sidebar at its own URL.

export interface Topic {
  slug: string;
  label: string;
  group: TopicGroup;
  Component: ComponentType;
}

export type TopicGroup = "The fish" | "How the system works" | "Context";

export const TOPIC_GROUPS: TopicGroup[] = [
  "The fish",
  "How the system works",
  "Context",
];

export const TOPICS: Topic[] = [
  { slug: "bycatch-overview", label: "Bycatch, by gear", group: "The fish", Component: BycatchOverview },
  { slug: "chinook", label: "Chinook bycatch", group: "The fish", Component: Chinook },
  { slug: "chum", label: "Chum bycatch", group: "The fish", Component: Chum },
  { slug: "halibut", label: "Halibut", group: "The fish", Component: Halibut },
  { slug: "western-alaska", label: "Western Alaska salmon", group: "The fish", Component: WesternAlaska },
  { slug: "federal-tac", label: "Federal harvest limits (TAC)", group: "How the system works", Component: Limits },
  { slug: "state-management", label: "State of Alaska management", group: "How the system works", Component: StateManagement },
  { slug: "observers", label: "Observer coverage", group: "How the system works", Component: Observers },
  { slug: "discards", label: "Discards & mortality rates", group: "How the system works", Component: Discards },
  { slug: "scale", label: "The scale", group: "Context", Component: Scale },
  { slug: "climate", label: "Climate & ocean", group: "Context", Component: Climate },
  { slug: "habitat", label: "Seafloor & habitat", group: "Context", Component: Habitat },
];

export const topicBySlug = (slug: string | undefined) =>
  TOPICS.find((t) => t.slug === slug);
