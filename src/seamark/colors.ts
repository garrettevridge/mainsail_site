// Seamark series palette — an editorial categorical scale tuned for legibility
// on the paper background. Hues are spaced around the wheel (teal → orange →
// gold → olive → plum → steel → caramel → grey) so adjacent stacked bands stay
// distinct rather than muddying together. The brand terracotta (ACCENT) is held
// back for single-series emphasis and headline accents, not the category scale.
export const SERIES = [
  "#2f6b73", // deep teal
  "#c2683b", // burnt orange
  "#d2a23f", // goldenrod
  "#6e8c5a", // olive
  "#7d5a7f", // muted plum
  "#3f5a78", // steel blue
  "#a8754a", // caramel
  "#8a8780", // warm grey
];

// Thin separator drawn between stacked bands/bars — the (white) page color,
// so stacked segments read as cleanly divided rather than blended.
export const BAND_STROKE = "#ffffff";

// Chart text (axis ticks, axis labels) is black — never grey. Axis and grid
// LINES are a light neutral rule (they are rules, not text).
export const INK = "#111111";
export const AXIS = "#d8d8d8";
export const INK_2 = "#111111";
export const RULE_3 = "#e6e6e6";
export const ACCENT = "#b8421e";
