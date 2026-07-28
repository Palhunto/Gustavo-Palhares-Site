import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { buildHomepageModel } from "../../src/lib/homepage/model.ts";
import { loadContentFromDisk } from "../../src/lib/content/source-loader.ts";
import {
  APPROVED_WORK_PRESENTATION,
  isInPublicCirculation,
} from "../../src/lib/content/publication.ts";
import { referenceId } from "../../src/lib/content/schemas/shared.ts";
import {
  WORK_COVER_VIEW_TRANSITION_NAMES,
  workCoverViewTransitionName,
} from "../../src/lib/view-transitions/work-cover.ts";

const root = process.cwd();
const at = new Date("2026-07-27T12:00:00-03:00");
const workId = "kauan-felix-uma-noite-de-k-1";
const route = `/trabalhos/${workId}/`;
const mediaIds = Array.from(
  { length: 12 },
  (_, index) => `kauan-k1-${String(index + 1).padStart(2, "0")}`,
);

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Fase 9A1 — Kauan Felix — Uma noite de K-1", () => {
  it("registra o trabalho público com os fatos e a apresentação aprovados", async () => {
    const dataset = await loadContentFromDisk(root);
    const work = dataset.trabalhos.find((entry) => entry.id === workId);

    expect(work?.data).toMatchObject({
      slug: workId,
      title: "Kauan Felix — Uma noite de K-1",
      summary:
        "Acompanhando Kauan Felix do corner ao combate, a cobertura registra sua luta contra Caio Martins pela categoria K-1 75 kg, durante o Demolidor Fight, em Bauru. Caio venceu por nocaute no segundo round.",
      archiveNumber: "GP-2026-0003",
      date: "2026-07-25",
      status: "published",
      formato: "cobertura",
      contexto: "editorial",
      publicationClearance: "cleared",
      location: { city: "Bauru", subdivision: "SP", country: "Brasil" },
    });
    expect(work?.data.themes).toEqual(
      expect.arrayContaining([
        "esporte",
        "k-1",
        "75 kg",
        "demolidor fight",
        "fib",
        "kauan felix",
        "caio martins",
      ]),
    );
    expect(APPROVED_WORK_PRESENTATION[workId]).toEqual({
      formatLabel: "Cobertura",
      contextLabel: "Demolidor Fight",
      subject: "Esporte",
    });
    expect(work && isInPublicCirculation(work, at)).toBe(true);
    expect(route).toBe("/trabalhos/kauan-felix-uma-noite-de-k-1/");
  });

  it("cataloga somente as 12 fotografias, em ordem, com direitos e alts factuais", async () => {
    const dataset = await loadContentFromDisk(root);
    const work = dataset.trabalhos.find((entry) => entry.id === workId)!;
    expect(work.data.gallery.map((use) => referenceId(use.asset))).toEqual(
      mediaIds,
    );
    expect(referenceId(work.data.cover.asset)).toBe(mediaIds[0]);

    const catalog = new Map(dataset.midia.map((entry) => [entry.id, entry]));
    for (const id of mediaIds) {
      const media = catalog.get(id);
      expect(media?.data.rights).toMatchObject({
        status: "cleared",
        holder: "Gustavo Palhares",
        basis: "authorship",
      });
      expect(media?.data.rights.scope).toContain(
        "autorização de Kauan Felix e do evento confirmadas",
      );
      expect(media?.data.rights.notes).toContain(
        "release individual separado de Caio Martins não documentado",
      );
      expect(media?.data.defaultAlt).toBeTruthy();
      expect(media?.data).not.toHaveProperty("defaultCaption");
    }
    const secondMetadata = await sharp(
      path.join(root, "src/assets/media/kauan-k1-02.jpg"),
    ).metadata();
    expect(secondMetadata).toMatchObject({
      width: 1104,
      height: 1070,
    });

    const assetNames = (await readdir(path.join(root, "src/assets/media")))
      .filter((name) => name.startsWith("kauan-k1-"))
      .sort();
    expect(assetNames).toEqual(mediaIds.map((id) => `${id}.jpg`));
  });

  it("preserva capa, sequência 01–12, composição e lightbox existente", async () => {
    const mdx = await source(`src/content/trabalhos/${workId}.mdx`);
    expect(mdx.match(/asset: kauan-k1-01/g)).toHaveLength(2);
    expect(mdx).toMatch(
      /<Diptych[\s\S]*assets="kauan-k1-02,kauan-k1-03"[\s\S]*numbers="02,03"/,
    );
    expect(mdx).toMatch(
      /assets="kauan-k1-04,kauan-k1-05"[\s\S]*numbers="04,05"/,
    );
    expect(mdx).toMatch(
      /<Triptych[\s\S]*assets="kauan-k1-06,kauan-k1-07,kauan-k1-08"[\s\S]*numbers="06,07,08"[\s\S]*layout="columns"/,
    );
    expect(mdx).toMatch(
      /assets="kauan-k1-09,kauan-k1-10"[\s\S]*numbers="09,10"/,
    );
    expect(mdx).toMatch(
      /assets="kauan-k1-11,kauan-k1-12"[\s\S]*numbers="11,12"/,
    );
    expect(mdx.match(/\blightbox\b/g)).toHaveLength(5);
    expect(mdx).not.toMatch(/caption|figcaption|informacoes\.txt/i);

    const layout = await source("src/layouts/WorkLayout.astro");
    expect(layout).toContain('number="01"');
    expect(layout).toContain("lightbox={Boolean(motion)}");
    expect(layout).toContain("{motion && <WorkLightbox");
  });

  it("mantém dois destaques visuais e inclui os quatro trabalhos no índice textual", async () => {
    const dataset = await loadContentFromDisk(root);
    const model = buildHomepageModel({
      works: dataset.trabalhos as never,
      at,
    });

    expect(model.featuredWorks.map((entry) => entry.id)).toEqual([
      "nephillin-uma-cobertura-sem-credencial",
      "feira-do-rolo",
    ]);
    expect(model.works.map((entry) => entry.id)).toEqual([
      workId,
      "nephillin-uma-cobertura-sem-credencial",
      "magma",
      "feira-do-rolo",
    ]);

    const homeWorks = await source("src/components/home/HomeWorks.astro");
    const homeIndex = await source("src/components/home/HomeIndex.astro");
    const homepageConfig = await source("src/config/homepage.ts");
    expect(homeWorks).toContain("model.featuredWorks.map");
    expect(homeIndex).toContain("model.works.map");
    expect(homepageConfig).toContain("em destaque");
    expect(`${homeWorks}\n${homepageConfig}`).not.toContain("publicados");
  });

  it("encerra o trabalho sem recomendações e retorna ao índice", async () => {
    const layout = await source("src/layouts/WorkLayout.astro");
    expect(layout).not.toMatch(/RelatedWorks|Trabalhos relacionados/);
    expect(layout).toContain("href={publicRoutes.trabalhosIndex}");
    expect(layout).toContain("VER TODOS OS TRABALHOS");
  });

  it("liga uma única transição de capa e nenhum nome às imagens internas", async () => {
    const name = "work-kauan-felix-uma-noite-de-k-1-cover";
    expect(workCoverViewTransitionName(workId)).toBe(name);
    expect(
      WORK_COVER_VIEW_TRANSITION_NAMES.filter((item) => item === name),
    ).toHaveLength(1);

    const mdx = await source(`src/content/trabalhos/${workId}.mdx`);
    const routeSource = await source("src/pages/trabalhos/[slug].astro");
    expect(mdx).not.toContain("view-transition-name");
    expect(routeSource).toContain('? "kauan"');
  });

  it("integra movimento progressivo, cleanup e fallback estático", async () => {
    const motion = await source("src/lib/motion/kauan-work.ts");
    const loader = await source("src/components/editorial/WorkMotion.astro");
    const workLayout = await source("src/layouts/WorkLayout.astro");

    expect(loader).toContain("initializeKauanWorkMotion");
    expect(motion).toContain("initializeMotion");
    expect(motion).toContain("resolveCurrentWorkEntryMode");
    expect(motion).toContain('entryMode === "direct"');
    expect(motion).toContain("animateMobileFigures");
    expect(motion.match(/\bonce: true\b/g)?.length).toBeGreaterThanOrEqual(2);
    expect(motion).not.toMatch(/\bscrub\s*:|\bpin\s*:|\bsnap\s*:/);
    expect(motion).toContain('root.removeAttribute("data-work-entry-mode")');
    expect(motion).toContain(
      'root.removeAttribute("data-work-motion-presented")',
    );
    expect(workLayout).toContain("<slot />");
    expect(`${motion}\n${loader}`).not.toMatch(
      /preventDefault|addEventListener\(\s*["']click/,
    );
  });
});
