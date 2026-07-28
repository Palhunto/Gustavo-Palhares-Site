import { readdir } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadContentFromDisk } from "../../src/lib/content/source-loader.ts";
import {
  APPROVED_WORK_PRESENTATION,
  isInPublicCirculation,
  isIndividuallyPublic,
  sortWorksByDate,
  workPresentation,
} from "../../src/lib/content/publication.ts";
import { referenceId } from "../../src/lib/content/schemas/shared.ts";

const root = process.cwd();
const at = new Date("2026-07-21T12:00:00-03:00");

const expected = {
  "nephillin-uma-cobertura-sem-credencial": {
    archiveNumber: "GP-2026-0002",
    date: "2026-07-19",
    dateEnd: undefined,
    formato: "cobertura",
    contexto: "autoral",
    title: "Nephillin — Uma cobertura sem credencial",
    summary:
      "Feita de dentro do público e sem posição oficial, a cobertura acompanha a Nephillin pela proximidade, pela luz e pelo improviso do show.",
    gallery: [
      "fase-5-show-01-abertura",
      "fase-5-show-02-ambiente",
      "fase-5-show-03-silhueta",
      "fase-4-palco-02",
      "fase-4-palco-03",
      "fase-4-palco-04",
      "fase-5-show-07-confronto",
      "fase-5-show-08-encerramento",
    ],
  },
  "feira-do-rolo": {
    archiveNumber: "GP-2025-0001",
    date: "2025-07-20",
    dateEnd: "2025-07-21",
    formato: "ensaio",
    contexto: "autoral",
    title: "Feira do Rolo",
    summary:
      "Entre objetos usados, encontros e negociações, o ensaio registra o movimento cotidiano da Feira do Rolo em Bauru.",
    gallery: [
      "fase-4-mercado-01",
      "fase-5-rua-02-plano-geral",
      "fase-5-rua-03-personagem",
      "fase-4-mercado-02",
      "fase-5-rua-05-relacao",
      "fase-5-rua-06-detalhe",
      "fase-5-rua-07-espaco",
      "fase-5-rua-08-sequencia",
      "fase-4-retrato-amplo",
    ],
  },
} as const;

describe("Fase 5B — promoção e superfície pública", () => {
  it("carrega somente os quatro trabalhos aprovados em circulação pública", async () => {
    const dataset = await loadContentFromDisk(root);
    const publicWorks = sortWorksByDate(
      dataset.trabalhos.filter((entry) => isInPublicCirculation(entry, at)),
    );
    expect(publicWorks.map((entry) => entry.id)).toEqual([
      "kauan-felix-uma-noite-de-k-1",
      "nephillin-uma-cobertura-sem-credencial",
      "magma",
      "feira-do-rolo",
    ]);
    expect(publicWorks.map((entry) => entry.data.archiveNumber)).toEqual([
      "GP-2026-0003",
      "GP-2026-0002",
      "GP-2025-0002",
      "GP-2025-0001",
    ]);
    expect(publicWorks.some((entry) => entry.id === "fixture-trabalho")).toBe(
      false,
    );
  });

  it("preserva contratos, clearance e ordem numérica das imagens", async () => {
    const dataset = await loadContentFromDisk(root);
    for (const [id, contract] of Object.entries(expected)) {
      const work = dataset.trabalhos.find((entry) => entry.id === id);
      expect(work).toBeDefined();
      expect(work?.data).toMatchObject({
        slug: id,
        title: contract.title,
        summary: contract.summary,
        archiveNumber: contract.archiveNumber,
        date: contract.date,
        formato: contract.formato,
        contexto: contract.contexto,
        location: { city: "Bauru", subdivision: "SP", country: "Brasil" },
        status: "published",
        publicationClearance: "cleared",
      });
      expect(work?.data.dateEnd).toBe(contract.dateEnd);
      expect(work?.data.gallery.map((use) => referenceId(use.asset))).toEqual(
        contract.gallery,
      );
      expect(work?.body).not.toMatch(
        /provisóri|placeholder|narrativa editorial publicada/i,
      );
      expect(work?.body).not.toContain("<figcaption");
    }
  });

  it("mantém estrutura e apresentação pública da Feira do Rolo distintas", async () => {
    expect(APPROVED_WORK_PRESENTATION["feira-do-rolo"]).toEqual({
      formatLabel: "Documental",
      contextLabel: "Feira do Rolo",
      subject: "Feira do Rolo",
      peopleRelease: "not-confirmed",
    });
    expect(
      APPROVED_WORK_PRESENTATION["nephillin-uma-cobertura-sem-credencial"],
    ).toMatchObject({
      formatLabel: "Cobertura",
      contextLabel: "Autoral",
      subject: "Banda Nephillin",
      peopleRelease: "not-confirmed",
    });
  });

  it("promove 11 mídias novas, reutiliza seis IDs e não duplica arquivos", async () => {
    const dataset = await loadContentFromDisk(root);
    const used = new Set(
      Object.values(expected).flatMap((work) => work.gallery),
    );
    expect(used).toHaveLength(17);
    const reused = [...used].filter((id) => id.startsWith("fase-4-"));
    const promoted = [...used].filter((id) => id.startsWith("fase-5-"));
    expect(reused).toEqual([
      "fase-4-palco-02",
      "fase-4-palco-03",
      "fase-4-palco-04",
      "fase-4-mercado-01",
      "fase-4-mercado-02",
      "fase-4-retrato-amplo",
    ]);
    expect(promoted).toHaveLength(11);
    const catalog = new Map(dataset.midia.map((entry) => [entry.id, entry]));
    for (const id of used) {
      const media = catalog.get(id);
      expect(media?.data.rights).toMatchObject({
        status: "cleared",
        basis: "authorship",
      });
      expect(media?.data.defaultAlt).toBeTruthy();
      expect(media?.data.defaultAlt).not.toMatch(/\.jpe?g|fase-[45]-/i);
      expect(media?.data.defaultAlt).not.toMatch(/Gustavo|Nephillin/i);
    }
    const phase5Assets = (
      await readdir(path.join(root, "src", "assets", "media"))
    ).filter((name) => name.startsWith("fase-5-") && name.endsWith(".jpg"));
    expect(phase5Assets).toHaveLength(11);
    expect(new Set(phase5Assets).size).toBe(phase5Assets.length);
  });

  it("aplica a mesma elegibilidade a páginas e índices", async () => {
    const dataset = await loadContentFromDisk(root);
    const fixture = dataset.trabalhos.find(
      (entry) => entry.id === "fixture-trabalho",
    );
    const nephillin = dataset.trabalhos.find(
      (entry) => entry.id === "nephillin-uma-cobertura-sem-credencial",
    );
    expect(fixture && isIndividuallyPublic(fixture, at)).toBe(false);
    expect(nephillin && isIndividuallyPublic(nephillin, at)).toBe(true);
    expect(nephillin && isInPublicCirculation(nephillin, at)).toBe(true);

    const archived = structuredClone(nephillin!);
    archived.id = "trabalho-arquivado-em-memoria";
    archived.data.status = "archived";
    expect(isIndividuallyPublic(archived, at)).toBe(true);
    expect(isInPublicCirculation(archived, at)).toBe(false);
    expect(workPresentation(archived.id, archived.data)).toMatchObject({
      formatLabel: "Cobertura",
      contextLabel: "Autoral",
    });
  });

  it("encerra todos os trabalhos com retorno único ao índice", async () => {
    const layout = await import("node:fs/promises").then(({ readFile }) =>
      readFile(path.join(root, "src", "layouts", "WorkLayout.astro"), "utf8"),
    );
    const route = await import("node:fs/promises").then(({ readFile }) =>
      readFile(
        path.join(root, "src", "pages", "trabalhos", "[slug].astro"),
        "utf8",
      ),
    );
    expect(layout).toContain("data-work-continuity");
    expect(layout).toContain("href={publicRoutes.trabalhosIndex}");
    expect(layout).toContain("VER TODOS OS TRABALHOS");
    expect(layout.match(/class="work-continuity__link/g)).toHaveLength(1);
    expect(`${layout}\n${route}`).not.toMatch(
      /RelatedWorks|publicRelatedWorks|Trabalhos relacionados/,
    );
  });

  it("mantém apenas as rotas públicas permitidas e a arquitetura futura fora de pages", async () => {
    const pageFiles = (
      await readdir(path.join(root, "src", "pages"), { recursive: true })
    ).map((name) => String(name).replaceAll("\\", "/"));
    for (const route of ["trabalhos/index.astro", "trabalhos/[slug].astro"])
      expect(pageFiles).toContain(route);
    for (const removed of [
      "caderno/index.astro",
      "caderno/[slug].astro",
      "colecoes/index.astro",
      "colecoes/[slug].astro",
      "edicoes/index.astro",
      "edicoes/[numero].astro",
    ])
      expect(pageFiles).not.toContain(removed);
    expect(pageFiles.some((name) => /(?:arquivo|busca)/i.test(name))).toBe(
      false,
    );
    expect(pageFiles).toEqual(
      expect.arrayContaining(["rss.xml.ts", "sitemap.xml.ts", "robots.txt.ts"]),
    );

    const dataset = await loadContentFromDisk(root);
    expect(
      dataset.caderno.filter((entry) => isIndividuallyPublic(entry, at)),
    ).toHaveLength(0);
    expect(
      dataset.colecoes.filter((entry) => isIndividuallyPublic(entry, at)),
    ).toHaveLength(0);
    expect(
      dataset.edicoes.filter((entry) => isIndividuallyPublic(entry, at)),
    ).toHaveLength(0);
  });
});
