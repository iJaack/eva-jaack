import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const vercelConfig = JSON.parse(
  await readFile(new URL("../vercel.json", import.meta.url), "utf8"),
);

test("Vercel leaves frontend dynamic paths for the Next builder to resolve", () => {
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
  assert.ok(
    vercelConfig.routes.some(
      (route) =>
        route.src === "/(.*)" &&
        route.dest === "/frontend/$1" &&
        route.continue === true,
    ),
  );
});
