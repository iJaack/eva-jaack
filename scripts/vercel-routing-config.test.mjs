import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const vercelConfig = JSON.parse(
  await readFile(new URL("../vercel.json", import.meta.url), "utf8"),
);

test("Vercel resolves public dynamic paths through the static detail entry", () => {
  const destinations = vercelConfig.routes
    .filter((route) => typeof route.dest === "string")
    .map((route) => route.dest);

  assert.equal(
    destinations.some((destination) => destination.includes("/markets/[marketId]")),
    false,
  );
  assert.equal(
    destinations.some((destination) => destination.includes("/predictors/[id]")),
    false,
  );
  assert.equal(
    destinations.some((destination) => destination.includes("/thesis/[thesisId]")),
    false,
  );
  assert.deepEqual(
    vercelConfig.routes
      .filter((route) => ["/markets/([^/]+)", "/predictors/([^/]+)", "/thesis/([^/]+)"].includes(route.src))
      .map((route) => route.dest),
    [
      "/resolve?kind=market&id=$1",
      "/resolve?kind=predictor&id=$1",
      "/resolve?kind=thesis&id=$1",
    ],
  );
  assert.ok(
    vercelConfig.routes
      .filter((route) => ["/markets/([^/]+)", "/predictors/([^/]+)", "/thesis/([^/]+)"].includes(route.src))
      .every((route) => route.continue === true),
  );
  assert.ok(vercelConfig.routes.some((route) => route.src === "/(.*)" && route.dest === "/frontend/$1"));
});
