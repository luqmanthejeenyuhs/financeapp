import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F17",
        surface: "#111827",
        panel: "#161D2C",
        line: "#232C40",
        paper: "#E7EAF2",
        muted: "#8792A8",
        faint: "#5A6478",
        brass: {
          DEFAULT: "#C9A24B",
          bright: "#E4C170",
          dim: "#8C7134",
        },
        rise: "#4FAE7C",
        fall: "#C9605A",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      letterSpacing: {
        widest2: "0.28em",
      },
      backgroundImage: {
        "grid-fade": "linear-gradient(180deg, rgba(201,162,75,0.08) 0%, rgba(201,162,75,0) 60%)",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 20px 40px -20px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
