import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import {
  renderRobotsTxt,
  renderRssXml,
  renderSitemapXml,
  rssItems,
  sitemapRoutes,
} from "../../src/lib/seo/distribution.ts";
import { normalizeSiteUrl } from "../../src/lib/seo/site-url.ts";
import {
  BUILD_INSTANT,
  validDataset,
  withAllValidStates,
} from "../fixtures/content/scenarios.ts";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const base = normalizeSiteUrl("https://publicacao.test")!;

describe("distribuição pública da Fase 5C-A", () => {
  it("gera as nove rotas atuais no sitemap, absolutas e sem duplicação", async () => {
    const dataset = await validDataset();
    const expected = [
      "/",
      "/trabalhos/",
      "/trabalhos/nephillin-uma-cobertura-sem-credencial/",
      "/trabalhos/feira-do-rolo/",
      "/caderno/",
      "/colecoes/",
      "/edicoes/",
      "/sobre/",
      "/contato/",
    ];
    expect(sitemapRoutes(dataset, BUILD_INSTANT)).toEqual(
      expect.arrayContaining(expected),
    );
    expect(sitemapRoutes(dataset, BUILD_INSTANT)).toHaveLength(9);

    const document = renderSitemapXml(dataset, base, BUILD_INSTANT);
    const urls = [...document.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => match[1],
    );
    expect(urls).toHaveLength(9);
    expect(new Set(urls).size).toBe(urls.length);
    expect(
      urls.every((url) => url.startsWith("https://publicacao.test/")),
    ).toBe(true);
    for (const route of expected) {
      expect(urls).toContain(new URL(route, base).href);
    }
    expect(document).not.toMatch(/404|exploracoes|fixture|lastmod/);
  });

  it("inclui archived no sitemap, mas não no RSS", async () => {
    const dataset = withAllValidStates(await validDataset());
    expect(sitemapRoutes(dataset, BUILD_INSTANT)).toContain(
      "/caderno/fixture-arquivado/",
    );
    expect(
      rssItems(dataset, BUILD_INSTANT).map((item) => item.stableId),
    ).not.toContain("caderno:fixture-arquivado");
    expect(sitemapRoutes(dataset, BUILD_INSTANT)).not.toContain(
      "/caderno/fixture-agendado-futuro/",
    );
  });

  it("gera RSS válido e resumido com os dois trabalhos na ordem editorial", async () => {
    const dataset = await validDataset();
    const items = rssItems(dataset, BUILD_INSTANT);
    expect(items.map((item) => item.title)).toEqual([
      "Nephillin — Uma cobertura sem credencial",
      "Feira do Rolo",
    ]);
    expect(items.map((item) => item.stableId)).toEqual([
      "GP-2026-0002",
      "GP-2025-0001",
    ]);
    expect(items.every((item) => item.summary.length > 0)).toBe(true);
    expect(items.every((item) => item.author === "Gustavo Palhares")).toBe(
      true,
    );

    const document = renderRssXml(dataset, base, BUILD_INSTANT);
    expect(document).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(document).toContain('<rss version="2.0"');
    expect(document).toMatch(/<\/rss>$/);
    expect(document.match(/<item>/g)).toHaveLength(2);
    expect(document).toContain(
      "https://publicacao.test/trabalhos/nephillin-uma-cobertura-sem-credencial/",
    );
    expect(document).toContain(
      "https://publicacao.test/trabalhos/feira-do-rolo/",
    );
    expect(document).not.toMatch(/fixture|<content:encoded|<img|<html/);
  });

  it("gera robots legível, sem tratar caminhos privados como segurança", () => {
    expect(renderRobotsTxt(undefined)).toBe("User-agent: *\nAllow: /\n");
    const document = renderRobotsTxt(base);
    expect(document).toContain("User-agent: *\nAllow: /");
    expect(document).toContain("Sitemap: https://publicacao.test/sitemap.xml");
    expect(document).not.toMatch(/Disallow|src\/content|docs\/|phase-5a/i);
  });

  it("faz o comando público falhar antes do build quando SITE_URL está ausente", async () => {
    const environment = { ...process.env };
    delete environment.SITE_URL;
    await expect(
      execFileAsync(
        process.execPath,
        [
          "--experimental-strip-types",
          path.join(root, "scripts", "run-site-command.ts"),
          "public",
          "build",
        ],
        { cwd: root, env: environment, windowsHide: true },
      ),
    ).rejects.toMatchObject({ code: 1 });
  });
});
