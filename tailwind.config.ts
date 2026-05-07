import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#0a0a0a",
        white: "#f5f5f0",
        "grey-light": "#e0e0da",
        "grey-mid": "#b0b0a8",
        "grey-dark": "#4a4a44",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        brutal: "4px 4px 0px #0a0a0a",
        "brutal-sm": "3px 3px 0px #0a0a0a",
        "brutal-lg": "6px 6px 0px #0a0a0a",
        "brutal-xl": "8px 8px 0px #0a0a0a",
        "brutal-card": "5px 5px 0px #0a0a0a",
      },
      borderWidth: {
        "3": "3px",
      },
      keyframes: {
        "pulse-border": {
          "0%, 100%": { borderColor: "#0a0a0a" },
          "50%": { borderColor: "#4a4a44" },
        },
        "timer-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "card-stamp": {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "70%": { transform: "scale(1.03)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "pulse-border": "pulse-border 1s ease-in-out infinite",
        "timer-pulse": "timer-pulse 0.5s ease-in-out infinite",
        "card-stamp": "card-stamp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
