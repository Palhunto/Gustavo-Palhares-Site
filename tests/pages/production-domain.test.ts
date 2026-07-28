import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { publicRoutes } from "../../src/lib/routes/public.ts";
import {
  renderRobotsTxt,
  renderSitemapXml,
  sitemapRoutes,
} from "../../src/lib/seo/distribution.ts";
import { createSeoMetadata } from "../../src/lib/seo/metadata.ts";
import {
  normalizeSiteUrl,
  requirePublicSiteUrl,
} from "../../src/lib/seo/site-url.ts";
import {
  personStructuredData,
  websiteStructuredData,
} from "../../src/lib/seo/structured-data.ts";
import { validDataset } from "../fixtures/content/scenarios.ts";
import { PRODUCTION_SITE_URL } from "../fixtures/production-site.ts";

const root = process.cwd();
const productionBase = normalizeSiteUrl(PRODUCTION_SITE_URL)!;
const at = new Date("2026-07-27T12:00:00-03:00");

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("integração final do domínio de produção", () => {
  it("aceita e normaliza exclusivamente a origem canônica sem www", () => {
    expect(requirePublicSiteUrl(`${PRODUCTION_SITE_URL}///`).href).toBe(
      "https://gustavopalhares.com.br/",
    );
    expect(productionBase.protocol).toBe("https:");
    expect(productionBase.hostname).toBe("gustavopalhares.com.br");
    expect(productionBase.hostname.startsWith("www.")).toBe(false);
  });

  it("mantém rotas públicas relativas e os quatro trabalhos canônicos", () => {
    expect([
      publicRoutes.home,
      publicRoutes.trabalhosIndex,
      publicRoutes.sobre,
      publicRoutes.contato,
      publicRoutes.trabalho("kauan-felix-uma-noite-de-k-1"),
      publicRoutes.trabalho("nephillin-uma-cobertura-sem-credencial"),
      publicRoutes.trabalho("magma"),
      publicRoutes.trabalho("feira-do-rolo"),
    ]).toEqual([
      "/",
      "/trabalhos/",
      "/sobre/",
      "/contato/",
      "/trabalhos/kauan-felix-uma-noite-de-k-1/",
      "/trabalhos/nephillin-uma-cobertura-sem-credencial/",
      "/trabalhos/magma/",
      "/trabalhos/feira-do-rolo/",
    ]);
  });

  it("deriva canonical, Open Graph e JSON-LD da mesma base", () => {
    const metadata = createSeoMetadata({
      pathname: publicRoutes.trabalho("magma"),
      siteUrl: PRODUCTION_SITE_URL,
      socialImage: {
        url: "/_astro/magma-social.jpg",
        alt: "Magma",
        width: 1200,
        height: 800,
      },
    });
    expect(metadata.canonical).toBe(
      "https://gustavopalhares.com.br/trabalhos/magma/",
    );
    expect(metadata.socialImage?.url).toBe(
      "https://gustavopalhares.com.br/_astro/magma-social.jpg",
    );

    const structured = JSON.stringify([
      websiteStructuredData(productionBase),
      personStructuredData(productionBase),
    ]);
    expect(structured).toContain("https://gustavopalhares.com.br/");
    expect(structured).toContain("https://gustavopalhares.com.br/sobre/");
    expect(structured).not.toMatch(
      /localhost|127\.0\.0\.1|pages\.dev|preview\.test/i,
    );
  });

  it("gera sitemap e robots somente com o domínio real", async () => {
    const dataset = await validDataset();
    const routes = sitemapRoutes(dataset, at);
    const sitemap = renderSitemapXml(dataset, productionBase, at);
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => match[1],
    );

    expect(routes).toHaveLength(8);
    expect(urls).toHaveLength(8);
    expect(new Set(urls).size).toBe(8);
    expect(
      urls.every(
        (url) =>
          new URL(url).origin === PRODUCTION_SITE_URL &&
          (new URL(url).pathname === "/" ||
            new URL(url).pathname.endsWith("/")),
      ),
    ).toBe(true);
    expect(sitemap).not.toMatch(
      /localhost|127\.0\.0\.1|pages\.dev|preview\.test/i,
    );

    const robots = renderRobotsTxt(productionBase);
    expect(robots).toContain(
      "Sitemap: https://gustavopalhares.com.br/sitemap.xml",
    );
    expect(robots).not.toMatch(/localhost|127\.0\.0\.1|pages\.dev/i);
  });

  it("mantém SITE_URL como único ponto de entrada no runtime", async () => {
    const astroConfig = await source("astro.config.mjs");
    const runtimeFiles = await Promise.all(
      [
        "astro.config.mjs",
        "src/lib/seo/metadata.ts",
        "src/lib/seo/social-image.ts",
        "src/lib/seo/structured-data.ts",
        "src/lib/seo/distribution.ts",
        "src/components/global/SeoHead.astro",
      ].map(source),
    );

    expect(astroConfig).toContain("configuredSiteUrl()");
    expect(astroConfig).toContain("site: siteUrl?.href");
    expect(runtimeFiles.join("\n")).not.toContain(PRODUCTION_SITE_URL);
  });

  it("documenta o contrato completo da Cloudflare e o redirecionamento www", async () => {
    const deploy = await source("docs/DEPLOY.md");

    for (const contract of [
      "SITE_URL=https://gustavopalhares.com.br",
      "npm run build",
      "`dist`",
      "`24.16.0`",
      "`main`",
      'http.host eq "www.gustavopalhares.com.br"',
      "preservar query string: ativado",
      "código: `301`",
    ]) {
      expect(deploy).toContain(contract);
    }
    expect(deploy).toContain(
      'concat("https://gustavopalhares.com.br", http.request.uri.path)',
    );
    expect(deploy).toContain("Não adicionar Wrangler");
  });
});
