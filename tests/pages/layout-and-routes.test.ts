import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("layout e rotas globais da Fase 5A", () => {
  it("mantém documento, skip link e landmarks em um BaseLayout único", async () => {
    const layout = await source("src/layouts/BaseLayout.astro");
    expect(layout).toContain('<html lang="pt-BR">');
    expect(layout).toContain('href="#conteudo-principal"');
    expect(layout).toContain("<SiteHeader");
    expect(layout).toContain("<SiteFooter");
    expect(layout.match(/<main\b/g)).toHaveLength(1);
    expect(layout).toContain("<SeoHead");
    await expect(
      transform(layout, { filename: "BaseLayout.astro" }),
    ).resolves.toHaveProperty("code");
  });

  it("oferece apenas hrefs públicos existentes e sem placeholders", async () => {
    const header = await source("src/components/global/SiteHeader.astro");
    const footer = await source("src/components/global/SiteFooter.astro");
    const config = await source("src/config/site.ts");
    const routes = await source("src/lib/routes/public.ts");
    const combined = `${header}\n${footer}\n${config}\n${routes}`;
    expect(combined).not.toMatch(/href=(?:""|"#")/);
    for (const routeName of [
      "publicRoutes.trabalhosIndex",
      "publicRoutes.cadernoIndex",
      "publicRoutes.colecoesIndex",
      "publicRoutes.edicoesIndex",
    ]) {
      expect(combined).toContain(routeName);
    }
    expect(combined).not.toMatch(/\/(?:arquivo|busca)/);
    expect(combined).not.toMatch(/exploracoes/);
    expect(header).toContain("aria-current={");
    expect(header).toContain("normalizedPath.startsWith");
  });

  it("mantém separados os cinco layouts editoriais da Fase 5B", async () => {
    for (const name of [
      "IndexLayout",
      "WorkLayout",
      "ArticleLayout",
      "CollectionLayout",
      "EditionLayout",
    ]) {
      const layout = await source(`src/layouts/${name}.astro`);
      expect(layout).toContain("<BaseLayout");
      await expect(
        transform(layout, { filename: `${name}.astro` }),
      ).resolves.toHaveProperty("code");
    }
  });

  it("mantém homepage provisória e metadata coerente nas páginas permitidas", async () => {
    const pages = {
      home: await source("src/pages/index.astro"),
      about: await source("src/pages/sobre.astro"),
      contact: await source("src/pages/contato.astro"),
      notFound: await source("src/pages/404.astro"),
    };
    expect(pages.home).toContain("Esta publicação está em construção.");
    expect(pages.home).not.toMatch(/(?:LeadImage|edicoes|trabalhos)/i);
    expect(pages.about).toContain('title="Sobre"');
    expect(pages.contact).toContain('robots="noindex, nofollow"');
    expect(pages.contact).toContain("https://wa.me/5514997173521");
    expect(pages.contact).toContain(
      "https://www.instagram.com/gustavopalharess/",
    );
    expect(pages.contact).toContain("mailto:gustavo.palhares49@gmail.com");
    expect(pages.contact).not.toMatch(
      /ainda estão sendo definidos|não possui formulário/i,
    );
    expect(pages.notFound).toContain('robots="noindex, nofollow"');
    expect(pages.notFound).not.toMatch(/\/arquivo|\/busca/);

    for (const [name, page] of Object.entries(pages)) {
      await expect(
        transform(page, { filename: `${name}.astro` }),
      ).resolves.toHaveProperty("code");
    }
  });
});
