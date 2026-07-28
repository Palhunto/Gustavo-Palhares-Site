import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  APPROVED_WORK_PRESENTATION,
  isInPublicCirculation,
} from "../../src/lib/content/publication.ts";
import { referenceId } from "../../src/lib/content/schemas/shared.ts";
import { loadContentFromDisk } from "../../src/lib/content/source-loader.ts";
import { buildHomepageModel } from "../../src/lib/homepage/model.ts";
import { normalizeSiteUrl } from "../../src/lib/seo/site-url.ts";
import { creativeWorkStructuredData } from "../../src/lib/seo/structured-data.ts";
import {
  WORK_COVER_VIEW_TRANSITION_NAMES,
  workCoverViewTransitionName,
} from "../../src/lib/view-transitions/work-cover.ts";
import { PRODUCTION_SITE_URL } from "../fixtures/production-site.ts";

const root = process.cwd();
const at = new Date("2026-07-27T12:00:00-03:00");
const workId = "magma";
const summary =
  "Entre música eletrônica, tatuagem e peças de brechó, o ensaio acompanha os gestos, os personagens e os intervalos do Magma.";
const seoDescription =
  "Ensaio documental realizado em um evento cultural de música eletrônica, tatuagem e brechó, em 20 de julho de 2025.";
const mediaIds = [
  "magma-01-observacao",
  "magma-02-corredor-vermelho",
  "magma-03-retrato",
  "magma-04-tatuagem-aberta",
  "magma-05-tatuagem-aproximada",
  "magma-06-retrato-aproximado",
  "magma-07-gesto",
  "magma-08-espaco",
  "magma-09-tatuagem",
  "magma-10-ambiente",
  "magma-11-saida",
] as const;

const assets = [
  {
    source: "11 - observação.jpg",
    asset: "magma-01-observacao.jpg",
    width: 5568,
    height: 3712,
    sourceHash:
      "2118d544f4814217030bb15aa02f31f815100e5900f32e3cf1364868a16f0404",
    assetHash:
      "6f5eade3ba968ff6a8a83184dbe945b9fc669ad328bf1afbcf0f9df61b092fea",
  },
  {
    source: "1 - abertura pelo corredor vermelho;.jpg",
    asset: "magma-02-corredor-vermelho.jpg",
    width: 1752,
    height: 2588,
    sourceHash:
      "3b257f965d09a724aefc27778f71fb86c86dac726de8e942a7d5233f1e268d89",
    assetHash:
      "910fdd1fc7fd2e79e0d31a27a60633c06eff2ca0abe51a35ca3bd461c2d52779",
  },
  {
    source: "2 retrato.jpg",
    asset: "magma-03-retrato.jpg",
    width: 5243,
    height: 3233,
    sourceHash:
      "429273c6b283a47e5cb4521eb806486911079a54b596212f3c64a009928c4127",
    assetHash:
      "6006417e50c092916f024937d20d45f9e9fedcab3ab680a00b996f80569fcfb9",
  },
  {
    source: "3 - tatuagem aberto.jpg",
    asset: "magma-04-tatuagem-aberta.jpg",
    width: 4233,
    height: 2646,
    sourceHash:
      "ff45c1fe529a1c71ceda61b94838cf1bc54cb275933127b6a2164982e91fb283",
    assetHash:
      "2528afb66391fe0ae70260fdf2c4ae8ac66c54023fd8e472bf4a2b9493ebf3f1",
  },
  {
    source: "4 - tatuagem aproximada.jpg",
    asset: "magma-05-tatuagem-aproximada.jpg",
    width: 5568,
    height: 3712,
    sourceHash:
      "2d6f0601e25239cc53185adffd76fd2cd1330630b3f0c03286dfb8cf81ad68b4",
    assetHash:
      "0560428dd46555d28b0ad75c62af52cc4fb4c2124646ef6843a6337bbaf12f08",
  },
  {
    source: "5 - retrato aproximado.jpg",
    asset: "magma-06-retrato-aproximado.jpg",
    width: 5035,
    height: 3471,
    sourceHash:
      "5cac6549b0d459f5cccaa17db8f963bdaef653bf66866d22785a1173dde1e629",
    assetHash:
      "255fe9413e7dda37a31257fd8cc600c13c6dc54c7d41b8c561230c3c2a967c9b",
  },
  {
    source: "6 - gesto.jpg",
    asset: "magma-07-gesto.jpg",
    width: 4908,
    height: 3712,
    sourceHash:
      "4cbaf4d9b7086d777b838d8e82d872b9927af94cb8ca863414cb1864134fe847",
    assetHash:
      "a26803246731a31338361f6c34241bba1d16fef822114b78a9c246d0eeef8712",
  },
  {
    source: "7 - espaçoo.jpg",
    asset: "magma-08-espaco.jpg",
    width: 3311,
    height: 4162,
    sourceHash:
      "548267eec22bebacafa0188d48db4087395c664d4202dbaf39767a14b4680a64",
    assetHash:
      "3f00efce3248a761528762377b09ade2ebf934fcb2b2320a13648b1967b3bcf9",
  },
  {
    source: "8 - tatuagem.jpg",
    asset: "magma-09-tatuagem.jpg",
    width: 4650,
    height: 2953,
    sourceHash:
      "69c4c105f043c5d2bf774ab2190dacf74ed6dae5d2340c6f5d8ce537220d119e",
    assetHash:
      "6e6c75d725e7c789be7f9fb0e57220edfeb84f49e627833695eb6552ae9ded75",
  },
  {
    source: "9 - ambientee.jpg",
    asset: "magma-10-ambiente.jpg",
    width: 5290,
    height: 2976,
    sourceHash:
      "ab070402c076d14fa93bb0c7f114bb2f075f27453ec56f0ea0990ecaf387a415",
    assetHash:
      "98adb74e11d4a79a2aa4d51ea602d2e00524e373f1727ab616b966a813f1417f",
  },
  {
    source: "10 - saida.jpg",
    asset: "magma-11-saida.jpg",
    width: 5374,
    height: 3023,
    sourceHash:
      "1833f92a5f13a220e10c4e90fd3e03dbcd8f096938a99b803a7b29de981385d1",
    assetHash:
      "db75578b557957c7f93bcfad824a583ac051e7c5931e3af2b66b4826cf969e66",
  },
] as const;

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

async function sha256(file: string): Promise<string> {
  return createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
}

describe("Fase 9A2 — Magma", () => {
  it("publica o quarto trabalho com os fatos e a apresentação aprovados", async () => {
    const dataset = await loadContentFromDisk(root);
    const work = dataset.trabalhos.find((entry) => entry.id === workId);

    expect(work?.data).toMatchObject({
      slug: workId,
      title: "Magma",
      summary,
      archiveNumber: "GP-2025-0002",
      date: "2025-07-20",
      status: "published",
      formato: "ensaio",
      contexto: "editorial",
      publicationClearance: "cleared",
      seo: { description: seoDescription },
    });
    expect(work?.data).not.toHaveProperty("location");
    expect(work?.data.themes).toEqual([
      "evento cultural",
      "música eletrônica",
      "tatuagem",
      "brechó",
    ]);
    expect(APPROVED_WORK_PRESENTATION.magma).toEqual({
      formatLabel: "Documental",
      contextLabel: "Evento cultural",
      subject: "Evento cultural",
      peopleRelease: "not-confirmed",
    });
    expect(work && isInPublicCirculation(work, at)).toBe(true);
  });

  it("cataloga exatamente as 11 fotos selecionadas, sem duplicação ou derivação", async () => {
    const dataset = await loadContentFromDisk(root);
    const work = dataset.trabalhos.find((entry) => entry.id === workId)!;
    expect(work.data.gallery.map((use) => referenceId(use.asset))).toEqual(
      mediaIds,
    );
    expect(referenceId(work.data.cover.asset)).toBe(mediaIds[0]);
    expect(new Set(mediaIds).size).toBe(11);

    const catalog = new Map(dataset.midia.map((entry) => [entry.id, entry]));
    for (const id of mediaIds) {
      const media = catalog.get(id);
      expect(media?.data.rights).toMatchObject({
        status: "cleared",
        holder: "Gustavo Palhares",
        basis: "written-authorization",
      });
      expect(media?.data.rights.scope).toContain("evento Magma");
      expect(media?.data.rights.notes).toContain(
        "releases individuais das pessoas fotografadas não documentados",
      );
      expect(media?.data.defaultAlt).toBeTruthy();
      expect(media?.data).not.toHaveProperty("location");
      expect(media?.data).not.toHaveProperty("defaultCaption");
    }

    const copiedHashes: string[] = [];
    for (const [index, expected] of assets.entries()) {
      const sourceFile = path.join(root, "Trabalhos", "Magma", expected.source);
      const assetFile = path.join(
        root,
        "src",
        "assets",
        "media",
        expected.asset,
      );
      expect(await sha256(sourceFile)).toBe(expected.sourceHash);
      expect(await sha256(assetFile)).toBe(expected.assetHash);
      expect(expected.assetHash).not.toBe(expected.sourceHash);
      expect(catalog.get(mediaIds[index])?.data.checksum).toBe(
        `sha256:${expected.assetHash}`,
      );
      copiedHashes.push(expected.assetHash);
      const metadata = await sharp(assetFile).metadata();
      expect(metadata).toMatchObject({
        width: expected.width,
        height: expected.height,
        space: "srgb",
      });
      expect(metadata.exif).toBeUndefined();
      expect(metadata.iptc).toBeUndefined();
      expect(metadata.xmp).toBeUndefined();
    }
    expect(new Set(copiedHashes).size).toBe(11);

    const sourceNames = (await readdir(path.join(root, "Trabalhos", "Magma")))
      .filter((name) => name.toLowerCase().endsWith(".jpg"))
      .sort();
    expect(sourceNames).toEqual(assets.map((entry) => entry.source).sort());
    const assetNames = (await readdir(path.join(root, "src/assets/media")))
      .filter((name) => name.startsWith("magma-"))
      .sort();
    expect(assetNames).toEqual(assets.map((entry) => entry.asset).sort());
  });

  it("preserva a capa exclusiva, a sequência editorial e o corredor sem recorte", async () => {
    const mdx = await source("src/content/trabalhos/magma.mdx");
    const body = mdx.split("---", 3)[2];

    expect(mdx.match(/asset: magma-01-observacao/g)).toHaveLength(2);
    expect(body).not.toContain("magma-01-observacao");
    expect(body).toMatch(
      /<FullBleed[\s\S]*asset="magma-02-corredor-vermelho"[\s\S]*number="02"[\s\S]*lightbox/,
    );
    expect(body).not.toMatch(/magma-02-corredor-vermelho[\s\S]*crop|aspect/);
    expect(body).toMatch(
      /<Triptych[\s\S]*assets="magma-03-retrato,magma-04-tatuagem-aberta,magma-05-tatuagem-aproximada"[\s\S]*numbers="03,04,05"[\s\S]*layout="mosaic"/,
    );
    expect(body.match(/<Diptych/g)).toHaveLength(3);
    expect(body.match(/\blightbox\b/g)).toHaveLength(5);
    for (const id of mediaIds.slice(1)) expect(body).toContain(id);

    const fullBleed = await source("src/components/editorial/FullBleed.astro");
    expect(fullBleed).toContain("data-work-figure");
    expect(fullBleed).toContain(
      "lightboxNumber={lightbox ? editorialNumber : undefined}",
    );
  });

  it("entra no índice em quarto lugar sem ampliar os dois destaques visuais", async () => {
    const dataset = await loadContentFromDisk(root);
    const model = buildHomepageModel({
      works: dataset.trabalhos as never,
      at,
    });

    expect(model.works.map((entry) => entry.id)).toEqual([
      "kauan-felix-uma-noite-de-k-1",
      "nephillin-uma-cobertura-sem-credencial",
      "magma",
      "feira-do-rolo",
    ]);
    expect(model.featuredWorks.map((entry) => entry.id)).toEqual([
      "nephillin-uma-cobertura-sem-credencial",
      "feira-do-rolo",
    ]);
  });

  it("reutiliza lightbox, movimento padrão e uma única transição de capa", async () => {
    const transitionName = "work-magma-cover";
    expect(workCoverViewTransitionName(workId)).toBe(transitionName);
    expect(
      WORK_COVER_VIEW_TRANSITION_NAMES.filter(
        (name) => name === transitionName,
      ),
    ).toHaveLength(1);

    const mdx = await source("src/content/trabalhos/magma.mdx");
    const route = await source("src/pages/trabalhos/[slug].astro");
    const loader = await source("src/components/editorial/WorkMotion.astro");
    const sharedMotion = await source("src/lib/motion/nephillin-work.ts");
    expect(mdx).not.toContain("view-transition-name");
    expect(route).toContain(': "standard"');
    expect(loader).toContain(
      'variant === "nephillin" || variant === "standard"',
    );
    expect(sharedMotion).toContain("groups.slice(3)");
    expect(`${route}\n${loader}\n${sharedMotion}`).not.toMatch(
      /preventDefault|addEventListener\(\s*["']click/,
    );
    await expect(
      access(path.join(root, "src/lib/motion/magma-work.ts")),
    ).rejects.toThrow();
  });

  it("não inventa local, pessoas, DJ ou coordenadas nos metadados públicos", async () => {
    const dataset = await loadContentFromDisk(root);
    const work = dataset.trabalhos.find((entry) => entry.id === workId)!;
    const structured = creativeWorkStructuredData(
      work,
      at,
      normalizeSiteUrl(PRODUCTION_SITE_URL)!,
    ) as Record<string, unknown>;

    expect(structured).toMatchObject({
      "@type": "CreativeWork",
      name: "Magma",
      description: summary,
      identifier: "GP-2025-0002",
      dateCreated: "2025-07-20",
      url: `${PRODUCTION_SITE_URL}/trabalhos/magma/`,
    });
    expect(structured).not.toHaveProperty("contentLocation");
    expect(JSON.stringify(structured)).not.toMatch(
      /Asphalt|Bauru|latitude|longitude|DJ/i,
    );

    const route = await source("src/pages/trabalhos/[slug].astro");
    const layout = await source("src/layouts/WorkLayout.astro");
    const worksIndex = await source("src/pages/trabalhos/index.astro");
    expect(route).toContain("metaDescription={entry.data.seo?.description}");
    expect(layout).toContain("description={metaDescription ?? summary}");
    expect(worksIndex).toContain("work.data.location && (");
  });
});
