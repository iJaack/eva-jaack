import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { name: "outer-portrait", width: 466, height: 678 },
  { name: "outer-landscape", width: 678, height: 466 },
  { name: "inner-portrait", width: 669, height: 951 },
  { name: "inner-spec", width: 626, height: 890 },
  { name: "inner-landscape", width: 951, height: 669 },
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

const routes = ["/", "/markets", "/compose", "/predictors", "/eva", "/thesis/thesis-0fdef25794b38b6e8eed7524"] as const;

async function columnCount(page: Page, selector: string): Promise<number> {
  const locator = page.locator(selector);
  if ((await locator.count()) === 0) return 0;
  const value = await locator.first().evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  return value.split(" ").filter((track) => track.length > 0 && track !== "none").length;
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(async () => {
    return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  }).toBe(true);
}

test("viewport-fit cover is declared for the Dynamic Island and rounded corners", async ({ page }) => {
  await page.goto("/");
  const content = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(content).toContain("viewport-fit=cover");
  expect(content).toContain("width=device-width");
});

test("iPhone Duo widths reflow without horizontal scroll and keep phone and desktop layouts", async ({ page }) => {
  test.setTimeout(180_000);
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    await page.goto("/");
    const heroColumns = await columnCount(page, ".eva-hero");
    const processColumns = await columnCount(page, ".eva-process");
    await page.goto("/compose");
    const composeColumns = await columnCount(page, ".compose-layout");

    if (viewport.width < 600) {
      expect(heroColumns, viewport.name).toBe(1);
      expect(processColumns, viewport.name).toBe(1);
      expect(composeColumns, viewport.name).toBe(1);
    } else if (viewport.width <= 920) {
      expect(heroColumns, viewport.name).toBe(2);
      expect(processColumns, viewport.name).toBe(2);
      expect(composeColumns, viewport.name).toBe(2);
    } else {
      expect(heroColumns, viewport.name).toBe(2);
      expect(composeColumns, viewport.name).toBe(2);
    }

    if (viewport.width >= 1200) {
      expect(processColumns, viewport.name).toBe(4);
    }
  }
});
