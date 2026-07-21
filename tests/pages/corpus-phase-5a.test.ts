import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { parse as parseYaml } from "yaml";
import { describe, expect, it } from "vitest";

import { validateMdxPolicy } from "../../src/lib/content/mdx-policy.ts";

const root = process.cwd();

describe("corpus editorial inicial da Fase 5A", () => {
  it("mantém os 11 derivados em catálogo privado com direitos pendentes", async () => {
    const manifestPath = path.join(
      root,
      "docs",
      "phase-5a",
      "media-pendente.yaml",
    );
    const data = parseYaml(await readFile(manifestPath, "utf8"));
    expect(data.documentType).toBe("catalogo-tecnico-fora-da-collection");
    expect(data.generatesRoute).toBe(false);
    expect(data.items).toHaveLength(11);

    const productionMedia = await readdir(
      path.join(root, "src", "content", "midia"),
    );
    expect(productionMedia.some((name) => name.startsWith("fase-5-"))).toBe(
      false,
    );

    for (const item of data.items) {
      expect(item.rights.status).toBe("pending");
      expect(item.rights.scope).toMatch(/processamento técnico/i);
      expect(item).not.toHaveProperty("capturedAt");
      expect(item).not.toHaveProperty("location");
      await expect(
        readFile(path.join(root, item.asset)),
      ).resolves.toBeInstanceOf(Buffer);
    }
  });

  it("mantém os dois trabalhos pendentes fora da collection e sem expressão MDX", async () => {
    const pendingDir = path.join(root, "docs", "phase-5a");
    const files = (await readdir(pendingDir)).filter((name) =>
      name.endsWith(".mdx"),
    );
    expect(files.sort()).toEqual([
      "trabalho-rua-pendente.mdx",
      "trabalho-show-pendente.mdx",
    ]);

    for (const filename of files) {
      const content = await readFile(path.join(pendingDir, filename), "utf8");
      const body = content.slice(content.indexOf("\n---\n", 4) + 5);
      expect(validateMdxPolicy(body)).toEqual([]);
      expect(content).toContain("generatesRoute: false");
      expect(content).toContain("publicationClearance: pending");
      expect(content).toContain("date: null");
    }

    const productionWorks = await readdir(
      path.join(root, "src", "content", "trabalhos"),
    );
    expect(productionWorks).not.toContain("selecao-show-titulo-pendente.mdx");
    expect(productionWorks).not.toContain("selecao-rua-titulo-pendente.mdx");
  });
});
