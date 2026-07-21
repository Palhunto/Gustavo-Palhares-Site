import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { runContentGate } from "../../src/lib/content/index.ts";
import { ContentIntegrityError } from "../../src/lib/content/issues.ts";
import { BUILD_INSTANT } from "../fixtures/content/scenarios.ts";

describe("integração do gate com o build", () => {
  it("executa content:validate antes do Astro", async () => {
    const packageJson = JSON.parse(await readFile("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(packageJson.scripts.build).toBe(
      "npm run content:validate && astro build && npm run check:private-media",
    );
    expect(packageJson.scripts["check:private-media"]).toBe(
      "node --experimental-strip-types scripts/check-private-media.ts",
    );
  });

  it("compara a base histórica tanto em pull requests quanto em pushes", async () => {
    const workflow = await readFile(".github/workflows/quality.yml", "utf8");
    expect(workflow).toContain(
      "CONTENT_BASE_REF: ${{ github.event.pull_request.base.sha || github.event.before }}",
    );
  });

  it("bloqueia conteúdo inválido fora das collections ativas", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gp-content-gate-"));
    try {
      await cp(
        path.join(process.cwd(), "src", "content"),
        path.join(root, "src", "content"),
        {
          recursive: true,
        },
      );
      await cp(path.join(process.cwd(), "docs"), path.join(root, "docs"), {
        recursive: true,
      });
      const mediaPath = path.join(
        root,
        "src",
        "content",
        "midia",
        "fixture-imagem.yaml",
      );
      const media = await readFile(mediaPath, "utf8");
      await writeFile(
        mediaPath,
        media.replace("status: cleared", "status: pending"),
        "utf8",
      );

      await expect(
        runContentGate({ root, buildInstant: BUILD_INSTANT }),
      ).rejects.toMatchObject({
        name: "ContentIntegrityError",
      });
      try {
        await runContentGate({ root, buildInstant: BUILD_INSTANT });
      } catch (error) {
        expect(error).toBeInstanceOf(ContentIntegrityError);
        expect(
          (error as ContentIntegrityError).issues.map((issue) => issue.code),
        ).toContain("media-rights");
        expect((error as Error).message).toContain('rights.status é "pending"');
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
