import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { parse as parseYaml } from "yaml";
import { describe, expect, it } from "vitest";

import { validateMdxPolicy } from "../../src/lib/content/mdx-policy.ts";

const root = process.cwd();

interface PendingWork {
  archiveNumber: string;
  contexto: string;
  date: string;
  dateEnd?: string;
  formato: string;
  generatesRoute: boolean;
  individualCaptions: boolean;
  location: {
    city: string;
    country: string;
    subdivision: string;
  };
  peopleRelease: string;
  publicationClearance: string;
  publicPresentation?: {
    contexto: string;
    formato: string;
  };
  routeActivation: string;
  slug: string;
  status: string;
  summary: string;
  title: string;
}

function parseMdx(content: string): { body: string; data: PendingWork } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(content);
  if (!match) throw new Error("MDX sem frontmatter YAML válido");
  return {
    body: content.slice(match[0].length),
    data: parseYaml(match[1]) as PendingWork,
  };
}

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

  it("valida os dois trabalhos aprovados, privados e sem rota antes da Fase 5B", async () => {
    const pendingDir = path.join(root, "docs", "phase-5a");
    const files = (await readdir(pendingDir)).filter((name) =>
      name.endsWith(".mdx"),
    );
    expect(files.sort()).toEqual([
      "trabalho-rua-pendente.mdx",
      "trabalho-show-pendente.mdx",
    ]);

    const works = new Map<string, PendingWork>();
    for (const filename of files) {
      const content = await readFile(path.join(pendingDir, filename), "utf8");
      const { body, data } = parseMdx(content);
      works.set(filename, data);
      expect(validateMdxPolicy(body)).toEqual([]);
      expect(data).toMatchObject({
        generatesRoute: false,
        individualCaptions: false,
        peopleRelease: "not-confirmed",
        publicationClearance: "cleared",
        routeActivation: "phase-5b",
        status: "draft",
      });
    }

    expect(works.get("trabalho-show-pendente.mdx")).toMatchObject({
      archiveNumber: "GP-2026-0002",
      contexto: "autoral",
      date: "2026-07-19",
      formato: "cobertura",
      location: { city: "Bauru", country: "Brasil", subdivision: "SP" },
      slug: "nephillin-uma-cobertura-sem-credencial",
      summary:
        "Feita de dentro do público e sem posição oficial, a cobertura acompanha a Nephillin pela proximidade, pela luz e pelo improviso do show.",
      title: "Nephillin — Uma cobertura sem credencial",
    });

    expect(works.get("trabalho-rua-pendente.mdx")).toMatchObject({
      archiveNumber: "GP-2025-0001",
      contexto: "autoral",
      date: "2025-07-20",
      dateEnd: "2025-07-21",
      formato: "ensaio",
      location: { city: "Bauru", country: "Brasil", subdivision: "SP" },
      publicPresentation: {
        contexto: "Feira do Rolo",
        formato: "Documental",
      },
      slug: "feira-do-rolo",
      summary:
        "Entre objetos usados, encontros e negociações, o ensaio registra o movimento cotidiano da Feira do Rolo em Bauru.",
      title: "Feira do Rolo",
    });

    const productionDir = path.join(root, "src", "content", "trabalhos");
    const productionWorks = (await readdir(productionDir, { recursive: true }))
      .filter((name) => /\.(?:md|mdx)$/.test(name))
      .sort();
    expect(productionWorks).not.toContain("trabalho-show-pendente.mdx");
    expect(productionWorks).not.toContain("trabalho-rua-pendente.mdx");
    expect(productionWorks).not.toContain(
      "nephillin-uma-cobertura-sem-credencial.mdx",
    );
    expect(productionWorks).not.toContain("feira-do-rolo.mdx");

    const productionArchiveNumbers = await Promise.all(
      productionWorks.map(async (filename) => {
        const content = await readFile(
          path.join(productionDir, filename),
          "utf8",
        );
        return parseMdx(content).data.archiveNumber;
      }),
    );
    expect(productionArchiveNumbers).toContain("GP-2026-0001");

    const pendingArchiveNumbers = [...works.values()].map(
      ({ archiveNumber }) => archiveNumber,
    );
    const allArchiveNumbers = [
      ...productionArchiveNumbers,
      ...pendingArchiveNumbers,
    ];
    expect(
      allArchiveNumbers.every((value) => /^GP-\d{4}-\d{4}$/.test(value)),
    ).toBe(true);
    expect(new Set(allArchiveNumbers).size).toBe(allArchiveNumbers.length);

    const pageFiles = (
      await readdir(path.join(root, "src", "pages"), {
        recursive: true,
      })
    ).map((name) => name.replaceAll("\\", "/"));
    expect(
      pageFiles.some(
        (name) =>
          name.includes("trabalhos/") ||
          name.includes("nephillin-uma-cobertura-sem-credencial") ||
          name.includes("feira-do-rolo"),
      ),
    ).toBe(false);
  });
});
