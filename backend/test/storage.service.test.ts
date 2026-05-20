import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const cleanupDirs: string[] = [];

describe("storage service", () => {
  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
    await Promise.all(
      cleanupDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it("persists local JSON reports across service reloads", async () => {
    const dir = await mkdtemp(join(tmpdir(), "eva-storage-"));
    cleanupDirs.push(dir);
    vi.stubEnv("EVA_STORAGE_PROVIDER", "local");
    vi.stubEnv("EVA_STORAGE_DIR", dir);

    const firstModule = await import("../src/services/storage.js");
    const firstService = firstModule.getStorageService();
    const uri = await firstService.uploadJSON({ score: 88, title: "Persist me" });

    vi.resetModules();
    vi.stubEnv("EVA_STORAGE_PROVIDER", "local");
    vi.stubEnv("EVA_STORAGE_DIR", dir);

    const secondModule = await import("../src/services/storage.js");
    const secondService = secondModule.getStorageService();

    await expect(secondService.loadJSON(uri)).resolves.toEqual({
      score: 88,
      title: "Persist me",
    });
  });

  it("uses Vercel Blob when durable blob credentials are configured", async () => {
    const put = vi.fn().mockResolvedValue({ url: "https://blob.vercel-storage.com/report.json" });
    vi.doMock("@vercel/blob", () => ({ put }));
    vi.stubEnv("EVA_STORAGE_PROVIDER", "vercel-blob");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "blob-token");

    const { getStorageService } = await import("../src/services/storage.js");
    const service = getStorageService();
    const uri = await service.uploadJSON({ ok: true }, { name: "report.json" });

    expect(service.provider).toBe("vercel-blob");
    expect(uri).toBe("https://blob.vercel-storage.com/report.json");
    expect(put).toHaveBeenCalledWith(
      "report.json",
      JSON.stringify({ ok: true }, null, 2),
      expect.objectContaining({
        access: "public",
        addRandomSuffix: true,
        contentType: "application/json",
        token: "blob-token",
      }),
    );
  });
});
