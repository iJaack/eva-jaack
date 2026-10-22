import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        /* Brand mark only. Surfaces and text come from --jk-* (see tokens.css). */
        eva: {
          cyan: "#7ED8E7",
          lavender: "#B5A1D2",
          coral: "#F29C79",
          lime: "#C8F35D",
        },
        jk: {
          bg: "var(--jk-bg)",
          surface: "var(--jk-surface)",
          ink: "var(--jk-ink)",
          "ink-2": "var(--jk-ink-2)",
          accent: "var(--jk-accent)",
          "accent-text": "var(--jk-accent-text)",
          ok: "var(--jk-ok)",
          fail: "var(--jk-fail)",
          amb: "var(--jk-amb)",
          info: "var(--jk-info)",
        },
      },
      fontFamily: {
        display: ["var(--jk-font)", "system-ui", "sans-serif"],
        body: ["var(--jk-font)", "system-ui", "sans-serif"],
        sans: ["var(--jk-font)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "jk-xs": "var(--jk-fs-xs)",
        "jk-sm": "var(--jk-fs-sm)",
        "jk-note": "var(--jk-fs-note)",
        "jk-body": "var(--jk-fs-body)",
        "jk-lede": "var(--jk-fs-lede)",
        "jk-title": "var(--jk-fs-title)",
      },
      spacing: {
        "jk-1": "var(--jk-s1)",
        "jk-2": "var(--jk-s2)",
        "jk-3": "var(--jk-s3)",
        "jk-4": "var(--jk-s4)",
        "jk-6": "var(--jk-s6)",
        "jk-7": "var(--jk-s7)",
        "jk-8": "var(--jk-s8)",
        "jk-10": "var(--jk-s10)",
        "jk-16": "var(--jk-s16)",
      },
      borderRadius: {
        "jk-xs": "var(--jk-r-xs)",
        "jk-s": "var(--jk-r-s)",
        "jk-panel": "var(--jk-r-panel)",
        "jk-pill": "var(--jk-r-pill)",
      },
      maxWidth: {
        jk: "var(--jk-max)",
      },
    },
  },
  plugins: [],
};

export default config;
