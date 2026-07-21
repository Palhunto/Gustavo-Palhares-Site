import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { inspectMediaBuild } from "../../src/lib/media/build-gate.ts";

const at = new Date("2026-07-21T12:00:00-03:00");

async function fakeRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "gp-media-gate-"));
  await cp("src/content", path.join(root, "src", "content"), {
    recursive: true,
  });
  await cp("docs/phase-5a", path.join(root, "docs", "phase-5a"), {
    recursive: true,
  });
  await mkdir(path.join(root, "dist", "_astro"), { recursive: true });
  const ids = [
    "fase-5-show-01-abertura",
    "fase-5-show-02-ambiente",
    "fase-5-show-03-silhueta",
    "fase-4-palco-02",
    "fase-4-palco-03",
    "fase-4-palco-04",
    "fase-5-show-07-confronto",
    "fase-5-show-08-encerramento",
    "fase-4-mercado-01",
    "fase-5-rua-02-plano-geral",
    "fase-5-rua-03-personagem",
    "fase-4-mercado-02",
    "fase-5-rua-05-relacao",
    "fase-5-rua-06-detalhe",
    "fase-5-rua-07-espaco",
    "fase-5-rua-08-sequencia",
    "fase-4-retrato-amplo",
  ];
  await writeFile(
    path.join(root, "dist", "index.html"),
    ids.map((id) => `<figure data-media-id="${id}"></figure>`).join(""),
  );
  return root;
}

describe("gate semântico de mídia do build", () => {
  it("permite derivado canônico aprovado e referenciado", async () => {
    const root = await fakeRoot();
    try {
      await writeFile(
        path.join(root, "dist", "_astro", "fase-5-show-01-abertura.hash.webp"),
        "fixture",
      );
      const result = await inspectMediaBuild(root, at);
      expect(result.publicMediaIds).toHaveLength(17);
      expect(result.emittedMediaIds).toContain("fase-5-show-01-abertura");
      expect(result.privateOnlyIds).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("bloqueia mídia presente somente no catálogo privado com motivo e ID", async () => {
    const root = await fakeRoot();
    try {
      const manifestPath = path.join(
        root,
        "docs",
        "phase-5a",
        "media-pendente.yaml",
      );
      const manifest = await readFile(manifestPath, "utf8");
      await writeFile(
        manifestPath,
        `${manifest}\n  - id: privado-sem-clearance\n    asset: src/assets/media/privado-sem-clearance.jpg\n`,
      );
      await writeFile(
        path.join(root, "dist", "_astro", "privado-sem-clearance.hash.jpg"),
        "fixture",
      );
      await expect(inspectMediaBuild(root, at)).rejects.toThrow(
        /privado-sem-clearance: mídia presente somente no catálogo privado/,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("bloqueia derivado órfão emitido sem referência HTML", async () => {
    const root = await fakeRoot();
    try {
      await writeFile(
        path.join(root, "dist", "_astro", "fase-4-folha-vertical.hash.jpg"),
        "fixture",
      );
      await expect(inspectMediaBuild(root, at)).rejects.toThrow(
        /fase-4-folha-vertical: derivado emitido sem referência/,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
