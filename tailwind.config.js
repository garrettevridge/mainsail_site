/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Source Serif 4", "Georgia", "serif"],
        sans:  ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono:  ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        bg:         "var(--bg)",
        panel:      "var(--panel)",
        ink:        "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        muted:      "var(--muted)",
        rule:       "var(--rule)",
        "rule-soft":"var(--rule-soft)",
        "table-alt":"var(--table-alt)",
        accent:     "var(--accent)",
        "accent-2": "var(--accent-2)",
        "accent-3": "var(--accent-3)",
      },
      maxWidth: {
        col: "var(--col-max)",
        lede: "780px",
        intro: "760px",
      },
    },
  },
  plugins: [],
};
