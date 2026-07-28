import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { siteConfig } from "../../src/config/site.ts";
import { homepageEditorialCopy } from "../../src/config/homepage.ts";
import { loadContentFromDisk } from "../../src/lib/content/source-loader.ts";
import { buildHomepageModel } from "../../src/lib/homepage/model.ts";
import { publicRoutes } from "../../src/lib/routes/public.ts";
import { PUBLIC_METADATA_ROUTES } from "../../src/lib/seo/public-integrity.ts";
import { sitemapRoutes } from "../../src/lib/seo/distribution.ts";

const root = process.cwd();
const at = new Date("2026-07-27T12:00:00-03:00");
const removedFamilies = ["caderno", "colecoes", "edicoes"] as const;

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Fase 9A — consolidação da superfície pública", () => {
  it("mantém exatamente os quatro trabalhos congelados", async () => {
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
  });

  it("limita header e footer a Trabalhos, Sobre e Contato", async () => {
    expect(siteConfig.navigation).toEqual([
      { href: publicRoutes.trabalhosIndex, label: "Trabalhos" },
      { href: publicRoutes.sobre, label: "Sobre" },
      { href: publicRoutes.contato, label: "Contato" },
    ]);
    expect(siteConfig.footerNavigation).toEqual([]);

    const publicChrome = [
      await source("src/components/global/SiteHeader.astro"),
      await source("src/components/global/SiteFooter.astro"),
      await source("src/components/home/HomeFooter.astro"),
      await source("src/config/site.ts"),
    ].join("\n");
    expect(publicChrome).not.toMatch(/Caderno|Coleções|Edições/);
  });

  it("mantém somente Sobre e Contato na seção 03 e no fechamento do índice", async () => {
    expect(homepageEditorialCopy.presence).toEqual([
      expect.objectContaining({
        key: "sobre",
        title: "Sobre",
        href: publicRoutes.sobre,
        action: "Conhecer",
      }),
      expect.objectContaining({
        key: "contato",
        title: "Contato",
        href: publicRoutes.contato,
        action: "Entrar em contato",
      }),
    ]);

    const presence = await source("src/components/home/HomePresence.astro");
    const index = await source("src/components/home/HomeIndex.astro");
    const publicHomepage = `${presence}\n${index}`;
    expect(presence).toContain('title="Presença"');
    expect(presence).toContain('data-home-presence-item="contato"');
    expect(index).toContain("indexGroups.map");
    expect(index).toContain("{work.data.title}");
    expect(presence).toContain("contactChannels.map");
    expect(index).toContain("homepageEditorialCopy.indexGroups");
    expect(publicHomepage).not.toMatch(
      /Caderno|Coleções|Edições|Em desenvolvimento|data-home-index-item-state/,
    );
  });

  it("não possui entradas públicas para as três famílias, mas preserva a arquitetura", async () => {
    for (const family of removedFamilies) {
      await expect(
        access(path.join(root, "src", "pages", family, "index.astro")),
      ).rejects.toThrow();
    }

    for (const preserved of [
      "src/layouts/ArticleLayout.astro",
      "src/layouts/CollectionLayout.astro",
      "src/layouts/EditionLayout.astro",
      "src/lib/content/schemas/collections.ts",
      "src/lib/content/types.ts",
      "src/lib/content/integrity.ts",
    ]) {
      await expect(access(path.join(root, preserved))).resolves.toBeUndefined();
    }
  });

  it("distribui somente oito rotas indexáveis e nenhum caminho retirado", async () => {
    const dataset = await loadContentFromDisk(root);
    const routes = sitemapRoutes(dataset, at);
    const expectedRoutes = [
      publicRoutes.home,
      publicRoutes.trabalhosIndex,
      publicRoutes.sobre,
      publicRoutes.contato,
      publicRoutes.trabalho("kauan-felix-uma-noite-de-k-1"),
      publicRoutes.trabalho("nephillin-uma-cobertura-sem-credencial"),
      publicRoutes.trabalho("magma"),
      publicRoutes.trabalho("feira-do-rolo"),
    ];
    expect(routes).toHaveLength(expectedRoutes.length);
    expect(new Set(routes)).toEqual(new Set(expectedRoutes));
    expect(PUBLIC_METADATA_ROUTES).toHaveLength(8);
    expect([...routes, ...PUBLIC_METADATA_ROUTES].join("\n")).not.toMatch(
      /\/(?:caderno|colecoes|edicoes)\//,
    );
  });

  it("remove hooks órfãos da seção 03 e preserva fallback e redução", async () => {
    const presence = await source("src/components/home/HomePresence.astro");
    const motion = await source("src/lib/motion/home-presence.ts");
    const lifecycle = await source("src/lib/motion/lifecycle.ts");
    const styles = await source("src/styles/site.css");

    expect(motion).not.toMatch(
      /feature-state|grid-vertical|grid-horizontal|presence-caderno|presence-colecoes|presence-edicoes/,
    );
    expect(presence).not.toMatch(/<script|style=|opacity:\s*0/);
    expect(motion).toContain('removeAttribute("style")');
    expect(lifecycle).toContain('root.dataset.motionState = "reduced"');
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("não emite linha de cidade sem valor e preserva valores públicos", async () => {
    const index = await source("src/pages/trabalhos/index.astro");
    const workLayout = await source("src/layouts/WorkLayout.astro");
    const metadataBlock = await source(
      "src/components/editorial/MetadataBlock.astro",
    );

    expect(index).toContain("work.data.location &&");
    expect(workLayout).toContain("location &&");
    expect(metadataBlock).toContain("item.value.trim()");
    expect(metadataBlock).toContain("visibleItems.map");
  });
});
