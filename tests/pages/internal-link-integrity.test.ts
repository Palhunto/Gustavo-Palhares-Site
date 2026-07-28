import { execFile } from "node:child_process";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";

import { publicRoutes } from "../../src/lib/routes/public.ts";
import { auditPublicIntegrity } from "../../src/lib/seo/public-integrity.ts";
import { normalizeSiteUrl } from "../../src/lib/seo/site-url.ts";
import { PRODUCTION_SITE_URL } from "../fixtures/production-site.ts";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const dist = path.join(root, "dist");
const astroCli = path.join(root, "node_modules", "astro", "bin", "astro.mjs");

function routeForFile(relativeFile: string): string | undefined {
  const normalized = relativeFile.replaceAll("\\", "/");
  if (normalized === "index.html") return "/";
  if (normalized === "404.html") return "/404";
  if (!normalized.endsWith("/index.html")) return undefined;
  return `/${normalized.slice(0, -"index.html".length)}`;
}

async function emittedHtml() {
  const files = (await readdir(dist, { recursive: true }))
    .map(String)
    .filter((file) => file.endsWith(".html"));
  const entries = await Promise.all(
    files.map(async (file) => ({
      file,
      route: routeForFile(file),
      html: await readFile(path.join(dist, file), "utf8"),
    })),
  );
  return entries.filter(
    (entry): entry is typeof entry & { route: string } =>
      entry.route !== undefined,
  );
}

function anchorHrefs(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map(
    (match) => match[1],
  );
}

function editorialPhotoNumbers(html: string): string[] {
  return [
    ...html.matchAll(
      /class="[^"]*editorial-photo-number[^"]*"[^>]*>\s*(\d{2})\s*</g,
    ),
  ].map((match) => match[1]);
}

function count(html: string, pattern: RegExp): number {
  return [...html.matchAll(pattern)].length;
}

async function emittedAssetExists(href: string): Promise<boolean> {
  const pathname = decodeURIComponent(href.split(/[?#]/, 1)[0]).replace(
    /^\/+/,
    "",
  );
  if (!path.posix.extname(pathname)) return false;
  try {
    await access(path.join(dist, pathname));
    return true;
  } catch {
    return false;
  }
}

beforeAll(async () => {
  await execFileAsync(process.execPath, [astroCli, "build"], {
    cwd: root,
    env: {
      ...process.env,
      BUILD_INSTANT: "2026-07-27T12:00:00-03:00",
      SITE_URL: PRODUCTION_SITE_URL,
    },
    maxBuffer: 50 * 1024 * 1024,
    windowsHide: true,
  });
}, 120_000);

describe("integridade dos links internos gerados", () => {
  it("aprova metadata, distribuição, assets e isolamento público em dist", async () => {
    const report = await auditPublicIntegrity({
      root,
      base: normalizeSiteUrl(PRODUCTION_SITE_URL)!,
    });
    expect(report.errors).toEqual([]);
    expect(report).toMatchObject({
      htmlPages: 12,
      publicPages: 8,
      socialImages: 4,
      structuredDataBlocks: 7,
    });
  });

  it("não emite EXIF, IPTC ou XMP nos arquivos públicos de Magma", async () => {
    const files = (await readdir(path.join(dist, "_astro")))
      .map(String)
      .filter(
        (file) =>
          file.startsWith("magma-") && /\.(?:avif|webp|jpe?g)$/i.test(file),
      );
    expect(files.length).toBeGreaterThan(0);

    const metadata = await Promise.all(
      files.map((file) => sharp(path.join(dist, "_astro", file)).metadata()),
    );
    for (const entry of metadata) {
      expect(entry.exif).toBeUndefined();
      expect(entry.iptc).toBeUndefined();
      expect(entry.xmp).toBeUndefined();
    }
  });

  it("faz todo link interno apontar para uma rota HTML ou asset emitido", async () => {
    const pages = await emittedHtml();
    const routes = new Set(pages.map((page) => page.route));

    for (const page of pages) {
      for (const href of anchorHrefs(page.html)) {
        expect(href, `${page.route}: href vazio`).not.toBe("");
        expect(href, `${page.route}: fragmento vazio`).not.toBe("#");

        if (href.startsWith("#")) {
          const target = href.slice(1);
          expect(
            page.html,
            `${page.route}: fragmento sem destino ${href}`,
          ).toContain(`id="${target}"`);
          continue;
        }
        if (/^(?:https?:|mailto:|tel:)/.test(href)) continue;

        expect(href, `${page.route}: caminho relativo`).toMatch(/^\/(?!\/)/);
        const destination = href.split("#", 1)[0];
        if (await emittedAssetExists(destination)) continue;
        expect(
          destination === "/" || destination.endsWith("/"),
          `${page.route}: falta barra final em ${href}`,
        ).toBe(true);
        expect(
          routes.has(destination),
          `${page.route}: destino não emitido ${href}`,
        ).toBe(true);
      }
    }
  });

  it("cobre as superfícies públicas e os quatro links do índice", async () => {
    const pages = await emittedHtml();
    const byRoute = new Map(pages.map((page) => [page.route, page.html]));
    const requiredRoutes = [
      publicRoutes.home,
      publicRoutes.trabalhosIndex,
      publicRoutes.trabalho("nephillin-uma-cobertura-sem-credencial"),
      publicRoutes.trabalho("feira-do-rolo"),
      publicRoutes.trabalho("kauan-felix-uma-noite-de-k-1"),
      publicRoutes.trabalho("magma"),
      publicRoutes.sobre,
      publicRoutes.contato,
    ];
    for (const route of requiredRoutes) expect(byRoute.has(route)).toBe(true);

    const indexHrefs = anchorHrefs(byRoute.get(publicRoutes.trabalhosIndex)!);
    for (const route of [
      publicRoutes.trabalho("nephillin-uma-cobertura-sem-credencial"),
      publicRoutes.trabalho("feira-do-rolo"),
      publicRoutes.trabalho("kauan-felix-uma-noite-de-k-1"),
      publicRoutes.trabalho("magma"),
    ]) {
      expect(indexHrefs.filter((href) => href === route)).toHaveLength(3);
    }
  });

  it("remove relacionados e encerra cada trabalho com um único retorno ao índice", async () => {
    const pages = await emittedHtml();
    const byRoute = new Map(pages.map((page) => [page.route, page.html]));

    for (const route of [
      publicRoutes.trabalho("nephillin-uma-cobertura-sem-credencial"),
      publicRoutes.trabalho("feira-do-rolo"),
      publicRoutes.trabalho("kauan-felix-uma-noite-de-k-1"),
      publicRoutes.trabalho("magma"),
    ]) {
      const html = byRoute.get(route)!;
      const continuity = html
        .split('<nav class="work-continuity"', 2)[1]
        .split("</nav>", 1)[0];

      expect(html, route).not.toContain("Trabalhos relacionados");
      expect(html, route).not.toMatch(/data-work-related|related-works__/);
      expect(anchorHrefs(continuity), route).toEqual([
        publicRoutes.trabalhosIndex,
      ]);
      expect(continuity, route).toContain("VER TODOS OS TRABALHOS");
      expect(continuity, route).not.toMatch(
        /<article|<picture|<img|type-caption|type-meta/,
      );
    }
  });

  it("mantém a composição semântica e escopada do índice de trabalhos", async () => {
    const pages = await emittedHtml();
    const html = pages.find(
      (page) => page.route === publicRoutes.trabalhosIndex,
    )!.html;

    expect(html).toContain('class="public-page public-page--works-index"');
    expect(count(html, /<article\b/g)).toBe(4);
    expect(
      count(html, /<h2\b[^>]*class="works-index__title type-project"/g),
    ).toBe(4);
    expect(
      count(html, /<dl\b[^>]*class="works-index__metadata type-meta"/g),
    ).toBe(4);
    expect(
      count(html, /<a\b[^>]*class="works-index__cta link-editorial"/g),
    ).toBe(4);
  });

  it("mantém numeração fotográfica global, única e distinta do arquivo", async () => {
    const pages = await emittedHtml();
    const byRoute = new Map(pages.map((page) => [page.route, page.html]));
    const contracts = [
      {
        route: publicRoutes.trabalho("nephillin-uma-cobertura-sem-credencial"),
        archiveNumber: "GP-2026-0002",
        numbers: ["01", "02", "03", "04", "05", "06", "07", "08"],
      },
      {
        route: publicRoutes.trabalho("feira-do-rolo"),
        archiveNumber: "GP-2025-0001",
        numbers: ["01", "02", "03", "04", "05", "06", "07", "08", "09"],
      },
      {
        route: publicRoutes.trabalho("kauan-felix-uma-noite-de-k-1"),
        archiveNumber: "GP-2026-0003",
        numbers: [
          "01",
          "02",
          "03",
          "04",
          "05",
          "06",
          "07",
          "08",
          "09",
          "10",
          "11",
          "12",
        ],
      },
      {
        route: publicRoutes.trabalho("magma"),
        archiveNumber: "GP-2025-0002",
        numbers: [
          "01",
          "02",
          "03",
          "04",
          "05",
          "06",
          "07",
          "08",
          "09",
          "10",
          "11",
        ],
      },
    ];

    for (const contract of contracts) {
      const html = byRoute.get(contract.route)!;
      const numbers = editorialPhotoNumbers(html);
      expect(numbers, contract.route).toEqual(contract.numbers);
      expect(new Set(numbers).size, contract.route).toBe(numbers.length);
      expect(count(html, /\bdata-media-id=/g), contract.route).toBe(
        contract.numbers.length,
      );
      expect(
        count(
          html,
          new RegExp(
            `<p class="type-meta number-stable">${contract.archiveNumber}<\\/p>`,
            "g",
          ),
        ),
      ).toBe(1);
      expect(html).not.toMatch(/(?:1\.\s*01|2\.\s*02)/);
    }
  });

  it("fecha cabeçalho, crédito, continuidade e escopo da Leva 1", async () => {
    const pages = await emittedHtml();
    const byRoute = new Map(pages.map((page) => [page.route, page.html]));
    const nephillinRoute = publicRoutes.trabalho(
      "nephillin-uma-cobertura-sem-credencial",
    );
    const feiraRoute = publicRoutes.trabalho("feira-do-rolo");
    const kauanRoute = publicRoutes.trabalho("kauan-felix-uma-noite-de-k-1");
    const magmaRoute = publicRoutes.trabalho("magma");
    const contracts = [
      {
        route: nephillinRoute,
        title: "Nephillin — Uma cobertura sem credencial",
        labels: ["Data", "Cidade", "Formato", "Contexto"],
        metadata: ["19 de julho de 2026", "Bauru, SP", "Cobertura", "Autoral"],
        lightboxLinks: 8,
      },
      {
        route: feiraRoute,
        title: "Feira do Rolo",
        labels: ["Data", "Cidade", "Formato", "Contexto"],
        metadata: [
          "20–21 de julho de 2025",
          "Bauru, SP",
          "Documental",
          "Feira do Rolo",
        ],
        lightboxLinks: 9,
      },
      {
        route: kauanRoute,
        title: "Kauan Felix — Uma noite de K-1",
        labels: ["Data", "Cidade", "Formato", "Contexto"],
        metadata: [
          "25 de julho de 2026",
          "Bauru, SP",
          "Cobertura",
          "Demolidor Fight",
        ],
        lightboxLinks: 12,
      },
      {
        route: magmaRoute,
        title: "Magma",
        labels: ["Data", "Formato", "Contexto"],
        metadata: ["20 de julho de 2025", "Documental", "Evento cultural"],
        lightboxLinks: 11,
      },
    ];

    for (const contract of contracts) {
      const html = byRoute.get(contract.route)!;
      expect(count(html, /<h1\b/g), contract.route).toBe(1);
      expect(html).toContain(contract.title);
      for (const label of contract.labels)
        expect(html).toContain(`<dt>${label}</dt>`);
      for (const value of contract.metadata) expect(html).toContain(value);

      const credits = html
        .split('<div class="work-credits"', 2)[1]
        .split('<nav class="work-continuity"', 1)[0];
      expect(count(credits, />Fotografia</g)).toBe(1);
      expect(count(credits, />Gustavo Palhares</g)).toBe(1);
      expect(credits).toContain("credits--colophon");

      expect(count(html, /\bdata-work-lightbox-link\b/g)).toBe(
        contract.lightboxLinks,
      );
      expect(count(html, /\bdata-work-lightbox-dialog\b/g)).toBe(1);
    }

    expect(byRoute.get(magmaRoute)).not.toContain("<dt>Cidade</dt>");
    expect(byRoute.get(magmaRoute)).not.toMatch(/Asphalt|Bauru/i);

    expect(
      [...byRoute.keys()].some((route) => /arquivo|busca/.test(route)),
    ).toBe(false);
  });
});
