/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif:   ["Source Serif Pro", "Georgia", "serif"],
        sans:    ["Archivo", "system-ui", "-apple-system", "sans-serif"],
        display: ["Archivo Black", "Archivo", "sans-serif"],
        mono:    ["Space Mono", "ui-monospace", "monospace"],
      },
      colors: {
        bg:       "var(--bg)",
        "bg-2":   "var(--bg-2)",
        "bg-3":   "var(--bg-3)",
        ink:      "var(--ink)",
        "ink-2":  "var(--ink-2)",
        "ink-3":  "var(--ink-3)",
        "ink-4":  "var(--ink-4)",
        accent:   "var(--accent)",
        "accent-2":   "var(--accent-2)",
        "accent-soft":"var(--accent-soft)",
        rule:     "var(--rule)",
        "rule-2": "var(--rule-2)",
        "rule-3": "var(--rule-3)",
      },
    },
  },
  plugins: [],
};
