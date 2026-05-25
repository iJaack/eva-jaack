import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: ["test-results/**", "playwright-report/**", ".next/**"],
  },
  ...nextCoreWebVitals,
  {
    settings: {
      next: {
        rootDir: ".",
      },
    },
  },
];

export default config;
