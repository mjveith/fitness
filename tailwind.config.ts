import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "#050816",
        panel: "#0d1324",
        panelAlt: "#121b31",
        accent: "#7dd3fc",
        accentStrong: "#38bdf8",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#f97316",
        ink: "#f8fafc",
        muted: "#94a3b8",
      },
      boxShadow: {
        glow: "0 24px 60px rgba(14, 165, 233, 0.22)",
      },
      backgroundImage: {
        "mesh-radial":
          "radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 35%), radial-gradient(circle at top right, rgba(34,197,94,0.12), transparent 30%), radial-gradient(circle at bottom, rgba(249,115,22,0.14), transparent 40%)",
      },
    },
  },
  plugins: [],
};

export default config;
