import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        eva: {
          navy: "#0a0f1c",
          blue: "#3b82f6",
          cyan: "#06b6d4"
        }
      },
      fontFamily: {
        display: ["Orbitron", "Space Grotesk", "Sora", "sans-serif"],
        body: ["Manrope", "Space Grotesk", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(59,130,246,0.35), 0 0 24px rgba(6,182,212,0.2)",
        card: "0 18px 40px rgba(4, 10, 24, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
