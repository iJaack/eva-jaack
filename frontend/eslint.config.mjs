import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
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
