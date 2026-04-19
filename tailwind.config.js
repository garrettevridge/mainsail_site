/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Source Serif Pro", "Georgia", "serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      colors: {
        ink: "#1a2332",
        paper: "#fafaf7",
        accent: "#2f5d8a",
        muted: "#6b7280",
        line: "#e5e5e0",
        flag: "#b45309",
      },
      maxWidth: {
        prose: "68ch",
        chart: "960px",
      },
    },
  },
  plugins: [],
};
