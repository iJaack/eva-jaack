import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

const [baseUrlArg, outputDirArg] = process.argv.slice(2);

if (!baseUrlArg || !outputDirArg) {
  console.error("Usage: node frontend/scripts/responsive-live-audit.mjs <base-url> <output-dir>");
  process.exit(1);
}

const baseUrl = new URL(baseUrlArg);
const outputDir = path.resolve(outputDirArg);
const apiBase = process.env.AUDIT_API_BASE ?? process.env.NEXT_PUBLIC_API_BASE;

const viewports = [
  { name: "desktop", width: 1440, height: 1100 },
  { name: "mobile", width: 390, height: 844 },
];

const staticRoutes = [
  { path: "/", label: "home" },
  { path: "/campaigns", label: "campaigns" },
  { path: "/campaigns/agent-forecast-interface", label: "campaign-agent-forecast-interface" },
  { path: "/campaigns/agent-receipts", label: "campaign-agent-receipts" },
  { path: "/campaigns/ai-forecast-receipts", label: "campaign-ai-forecast-receipts" },
  { path: "/campaigns/forecast-provenance", label: "campaign-forecast-provenance" },
  { path: "/campaigns/forecast-qa-checklist", label: "campaign-forecast-qa-checklist" },
  { path: "/campaigns/forecast-trust-loop", label: "campaign-forecast-trust-loop" },
  { path: "/campaigns/launch-truth-status", label: "campaign-launch-truth-status" },
  { path: "/campaigns/policy-safe-theses", label: "campaign-policy-safe-theses" },
  { path: "/campaigns/prediction-memory", label: "campaign-prediction-memory" },
  { path: "/campaigns/protocol-proof", label: "campaign-protocol-proof" },
  { path: "/campaigns/reply-sprint", label: "campaign-reply-sprint" },
  { path: "/campaigns/source-quality-sprint", label: "campaign-source-quality-sprint" },
  { path: "/campaigns/trust-receipts", label: "campaign-trust-receipts" },
  { path: "/campaigns/verifier-adoption", label: "campaign-verifier-adoption" },
  { path: "/markets", label: "markets" },
  { path: "/compose", label: "compose" },
  { path: "/predictors", label: "predictors" },
  { path: "/eva", label: "eva" },
  { path: "/resolve", label: "detail-resolver" },
];

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

async function dynamicRoutes() {
  if (!apiBase) return [];

  const routes = [];
  const [markets, theses, predictors] = await Promise.allSettled([
    fetchJson(`${apiBase}/markets`),
    fetchJson(`${apiBase}/theses`),
    fetchJson(`${apiBase}/predictors`),
  ]);

  if (markets.status === "fulfilled") {
    const market = markets.value.markets?.[0];
    if (market?.marketId) {
      routes.push({ path: `/markets/${market.marketId}`, label: "market-detail" });
    }
  }

  if (theses.status === "fulfilled") {
    const thesis = theses.value.theses?.[0];
    if (thesis?.thesisId) {
      routes.push({ path: `/thesis/${thesis.thesisId}`, label: "thesis-detail" });
    }
  }

  if (predictors.status === "fulfilled") {
    const predictor = predictors.value.predictors?.[0];
    if (predictor?.predictorId) {
      routes.push({ path: `/predictors/${predictor.predictorId}`, label: "predictor-detail" });
    }
  }

  return routes;
}

function routeUrl(routePath) {
  return new URL(routePath, baseUrl).toString();
}

function screenshotPath(route, viewportName) {
  const safePath = route.path === "/" ? "home" : route.path.replace(/^\//, "").replaceAll("/", "__");
  return path.join(outputDir, `${viewportName}-${route.label}-${safePath}.png`);
}

async function auditRoute(page, route, viewport) {
  const errors = [];
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  const response = await page.goto(routeUrl(route.path), { waitUntil: "domcontentloaded", timeout: 30_000 });
  const status = response?.status() ?? 0;
  if (status < 200 || status >= 400) {
    errors.push(`HTTP ${status}`);
  }

  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

  const metrics = await page.evaluate(() => {
    const main = document.querySelector("main");
    const body = document.body;
    const root = document.documentElement;
    const visibleText = body.innerText.trim();
    const horizontalOverflow = Math.max(body.scrollWidth, root.scrollWidth) - root.clientWidth;
    const tinyViewport = root.clientWidth < 430;
    const overflowingElements = Array.from(document.querySelectorAll("main, main *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className.slice(0, 120) : "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((item) => item.left < -2 || item.right > root.clientWidth + 2)
      .slice(0, 8);
    const clippedElements = Array.from(document.querySelectorAll("button, a, input, textarea, select, [role='button']"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          text: (element.textContent || element.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 80),
          width: rect.width,
          scrollWidth: element.scrollWidth,
          overflowX: style.overflowX,
          display: style.display,
        };
      })
      .filter((item) => item.display !== "none" && item.overflowX === "visible" && item.scrollWidth - item.width > 2)
      .slice(0, 5);

    return {
      hasMain: Boolean(main),
      designVersion: main?.dataset.evaDesign ?? null,
      mainHeight: main?.getBoundingClientRect().height ?? 0,
      visibleTextLength: visibleText.length,
      horizontalOverflow,
      overflowingElements,
      clippedElements: tinyViewport ? clippedElements : [],
    };
  });

  if (!metrics.hasMain) errors.push("Missing <main>");
  if (metrics.designVersion !== "v2") errors.push("Missing Eva v2 design shell");
  if (metrics.mainHeight < 120) errors.push(`Main content too short (${Math.round(metrics.mainHeight)}px)`);
  if (metrics.visibleTextLength < 80) errors.push("Page rendered with too little visible text");
  if (metrics.horizontalOverflow > 4) {
    errors.push(
      `Horizontal overflow ${Math.round(metrics.horizontalOverflow)}px: ${
        metrics.overflowingElements.map((item) => `${item.tag}.${item.className || "(no-class)"}@${item.left}..${item.right}`).join(", ") ||
        "source unknown"
      }`,
    );
  }
  if (metrics.clippedElements.length > 0) {
    errors.push(`Clipped controls: ${metrics.clippedElements.map((item) => `${item.tag}:${item.text}`).join(", ")}`);
  }

  await page.screenshot({ path: screenshotPath(route, viewport.name) });

  return {
    route: route.path,
    viewport: viewport.name,
    status,
    metrics,
    consoleErrors,
    errors,
  };
}

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const routes = [...staticRoutes, ...(await dynamicRoutes())];
const results = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });

    for (const route of routes) {
      const page = await context.newPage();
      try {
        results.push(await auditRoute(page, route, viewport));
      } catch (error) {
        results.push({
          route: route.path,
          viewport: viewport.name,
          status: 0,
          metrics: null,
          consoleErrors: [],
          errors: [error instanceof Error ? error.message : String(error)],
        });
      } finally {
        await page.close().catch(() => {});
      }
    }

    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(path.join(outputDir, "report.json"), JSON.stringify({ baseUrl: baseUrl.toString(), routes, results }, null, 2));

const failures = results.filter((result) => result.errors.length > 0);
if (failures.length > 0) {
  console.error("Responsive audit failed:");
  for (const failure of failures) {
    console.error(`- ${failure.viewport} ${failure.route}: ${failure.errors.join("; ")}`);
  }
  process.exit(1);
}

console.log(`Responsive audit passed for ${routes.length} routes across ${viewports.length} viewports.`);
