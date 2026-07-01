import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        eva: {
          cyan: "#7ED8E7",
          lavender: "#B5A1D2",
          coral: "#F29C79",
          lime: "#C8F35D",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        body: ["var(--font-manrope)", "Manrope", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
