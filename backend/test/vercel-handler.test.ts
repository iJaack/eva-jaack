import { describe, expect, it } from "vitest";
import { resolveOriginalPathFromUrl } from "../../api/index.js";

describe("Vercel API handler routing", () => {
  it("preserves non-routing query params when reconstructing API paths", () => {
    expect(resolveOriginalPathFromUrl("/api/index.ts?route=api&path=storage-readiness&probe=1", "eva.jaack.me")).toBe(
      "/api/storage-readiness?probe=1",
    );
  });

  it("drops only internal route parameters for rewritten API requests", () => {
    expect(
      resolveOriginalPathFromUrl(
        "/api/index.ts?route=api&path=markets%2Fspacex-ipo-before-2027&utm_source=x",
        "eva.jaack.me",
      ),
    ).toBe("/api/markets/spacex-ipo-before-2027?utm_source=x");
  });

  it("leaves direct requests untouched", () => {
    expect(resolveOriginalPathFromUrl("/api/storage-readiness?probe=1", "eva.jaack.me")).toBe(
      "/api/storage-readiness?probe=1",
    );
  });
});
