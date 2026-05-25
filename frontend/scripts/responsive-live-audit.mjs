import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:4281";
const outputDir = process.argv[3] ?? path.resolve("..", "artifacts", `responsive-live-${new Date().toISOString().slice(0, 10)}`);
const apiBase = process.env.AUDIT_API_BASE ?? "http://127.0.0.1:3001/api";

const viewports = [
  { label: "320", width: 320, height: 900 },
  { label: "375", width: 375, height: 900 },
  { label: "414", width: 414, height: 900 },
  { label: "768", width: 768, height: 960 },
  { label: "1440", width: 1440, height: 1000 },
  { label: "1920", width: 1920, height: 1080 },
];

const staticRoutes = [
  { name: "home", path: "/" },
  { name: "markets", path: "/markets" },
  { name: "compose", path: "/compose" },
  { name: "verify", path: "/verify" },
  { name: "predictors", path: "/predictors" },
  { name: "claims", path: "/claims" },
  { name: "articles", path: "/articles" },
  { name: "about", path: "/about" },
  { name: "blog", path: "/blog" },
  { name: "whitepaper", path: "/whitepaper" },
  { name: "curators-register", path: "/curators/register" },
  { name: "evalanche", path: "/evalanche" },
];

async function fetchJson(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function dynamicRoutes() {
  const routes = [];
  const [summary, markets, claims, articles] = await Promise.all([
    fetchJson(`${apiBase}/prediction-summary`),
    fetchJson(`${apiBase}/markets`),
    fetchJson(`${apiBase}/claims`),
    fetchJson(`${apiBase}/article`),
  ]);

  const firstMarket = markets?.markets?.[0] ?? summary?.markets?.[0];
  if (firstMarket?.marketId) routes.push({ name: "market-detail", path: `/markets/${firstMarket.marketId}` });

  const firstThesis = summary?.theses?.[0];
  if (firstThesis?.thesisId) routes.push({ name: "thesis-detail", path: `/thesis/${firstThesis.thesisId}` });

  const firstPredictor = summary?.predictors?.[0];
  if (firstPredictor?.predictorId) routes.push({ name: "predictor-detail", path: `/predictors/${firstPredictor.predictorId}` });

  const firstClaim = claims?.claims?.[0];
  if (firstClaim?.claimId) routes.push({ name: "claim-detail", path: `/claims/${firstClaim.claimId}` });

  const firstArticle = articles?.articles?.[0];
  if (firstArticle?.articleId !== undefined) routes.push({ name: "article-detail", path: `/article/${firstArticle.articleId}` });

  return routes;
}

function slug(value) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const clipped = [];
    const ignoredAncestor = ".participation-loop,.mobile-strip,.quest-line,.filter-bar,.ev-participation,.evidence-list,pre,code";
    const selector = "a,button,h1,h2,h3,p,span,strong,label,li,summary";

    for (const element of document.querySelectorAll(selector)) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
      if (!text || rect.width < 1 || rect.height < 1 || style.visibility === "hidden" || style.display === "none") continue;
      if (element.closest(ignoredAncestor)) continue;

      const horizontalClip = element.scrollWidth > Math.ceil(rect.width) + 1 && style.whiteSpace !== "normal";
      if (horizontalClip) {
        clipped.push({
          tag: element.tagName.toLowerCase(),
          className: element.className.toString(),
          text: text.slice(0, 96),
          scrollWidth: element.scrollWidth,
          clientWidth: Math.ceil(rect.width),
        });
      }
    }

    return {
      title: document.title,
      main: Boolean(document.querySelector("#main-content")),
      participation: Boolean(document.querySelector(".participation-dock, .ev-participation")),
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      clipped,
    };
  });
}

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
const routes = [...staticRoutes, ...(await dynamicRoutes())];
const failures = [];
const results = [];

for (const viewport of viewports) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });

  for (const route of routes) {
    const url = new URL(route.path, baseUrl).toString();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(750);

    const screenshotPath = path.join(outputDir, `${slug(route.name)}-${viewport.label}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    const inspection = await inspectPage(page);
    const result = { route: route.path, viewport: viewport.label, screenshotPath, ...inspection };
    results.push(result);

    if (!inspection.main) failures.push({ route: route.path, viewport: viewport.label, reason: "missing #main-content" });
    if (!inspection.participation) failures.push({ route: route.path, viewport: viewport.label, reason: "missing participation loop" });
    if (inspection.horizontalOverflow > 1) {
      failures.push({ route: route.path, viewport: viewport.label, reason: `horizontal overflow ${inspection.horizontalOverflow}px` });
    }
    if (inspection.clipped.length > 0) {
      failures.push({ route: route.path, viewport: viewport.label, reason: "clipped nowrap text", clipped: inspection.clipped.slice(0, 5) });
    }
  }
}

await browser.close();

await fs.writeFile(path.join(outputDir, "summary.json"), JSON.stringify({ baseUrl, apiBase, routes, viewports, results, failures }, null, 2));

console.log(`screenshots=${results.length}`);
console.log(`output=${outputDir}`);
console.log(`failures=${failures.length}`);
if (failures.length > 0) {
  console.log(JSON.stringify(failures.slice(0, 20), null, 2));
  process.exit(1);
}
