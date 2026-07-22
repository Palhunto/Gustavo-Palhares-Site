import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { publicRoutes, type PublicPath } from "../routes/public.ts";
import { absoluteCanonicalUrl, absoluteSiteFileUrl } from "./site-url.ts";

export const PUBLIC_METADATA_ROUTES = [
  publicRoutes.home,
  publicRoutes.trabalhosIndex,
  publicRoutes.trabalho("nephillin-uma-cobertura-sem-credencial"),
  publicRoutes.trabalho("feira-do-rolo"),
  publicRoutes.cadernoIndex,
  publicRoutes.colecoesIndex,
  publicRoutes.edicoesIndex,
  publicRoutes.sobre,
  publicRoutes.contato,
] as const satisfies readonly PublicPath[];

const WORK_ROUTES = [
  publicRoutes.trabalho("nephillin-uma-cobertura-sem-credencial"),
  publicRoutes.trabalho("feira-do-rolo"),
] as const;

const TECHNICAL_ROUTES = [
  "/404",
  "/exploracoes/componentes-editoriais/",
  "/exploracoes/sistema-visual/",
] as const;

const PRIVATE_MARKERS = [
  "docs/phase-5a",
  "src/content",
  "phase-5a/",
  "trabalho-show-pendente",
  "trabalho-rua-pendente",
] as const;

interface EmittedPage {
  file: string;
  route: string;
  html: string;
}

export interface PublicIntegrityOptions {
  root: string;
  base: URL;
}

export interface PublicIntegrityReport {
  errors: string[];
  htmlPages: number;
  publicPages: number;
  socialImages: number;
  structuredDataBlocks: number;
}

function routeForFile(relativeFile: string): string | undefined {
  const normalized = relativeFile.replaceAll("\\", "/");
  if (normalized === "index.html") return "/";
  if (normalized === "404.html") return "/404";
  if (!normalized.endsWith("/index.html")) return undefined;
  return `/${normalized.slice(0, -"index.html".length)}`;
}

async function emittedPages(dist: string): Promise<EmittedPage[]> {
  const files = (await readdir(dist, { recursive: true }))
    .map(String)
    .filter((file) => file.endsWith(".html"));
  return Promise.all(
    files.map(async (file) => ({
      file,
      route: routeForFile(file) ?? `arquivo:${file.replaceAll("\\", "/")}`,
      html: await readFile(path.join(dist, file), "utf8"),
    })),
  );
}

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tagAttribute(
  html: string,
  tag: string,
  selector: "name" | "property" | "rel",
  selectorValue: string,
  result: "content" | "href",
): string[] {
  const tags = html.match(new RegExp(`<${tag}\\b[^>]*>`, "gi")) ?? [];
  return tags.flatMap((candidate) => {
    const selected = candidate.match(
      new RegExp(`\\b${selector}=["']${escapePattern(selectorValue)}["']`, "i"),
    );
    const value = candidate.match(
      new RegExp(`\\b${result}=["']([^"']*)["']`, "i"),
    );
    return selected && value ? [value[1]] : [];
  });
}

function one(
  errors: string[],
  route: string,
  label: string,
  values: readonly string[],
): string | undefined {
  if (values.length !== 1 || !values[0]?.trim()) {
    errors.push(
      `${route}: ${label} deve existir exatamente uma vez e não pode estar vazio.`,
    );
    return undefined;
  }
  return values[0];
}

function titleValues(html: string): string[] {
  return [...html.matchAll(/<title>([^<]*)<\/title>/gi)].map(
    (match) => match[1],
  );
}

function jsonLdValues(html: string): Record<string, unknown>[] {
  return [
    ...html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].flatMap((match) => {
    try {
      const value = JSON.parse(match[1]) as unknown;
      return value && typeof value === "object"
        ? [value as Record<string, unknown>]
        : [];
    } catch {
      return [];
    }
  });
}

function internalPathFromUrl(value: string, base: URL): string | undefined {
  if (/^(?:mailto:|tel:|data:|javascript:)/i.test(value)) return undefined;
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return undefined;
  }
  if (url.origin !== base.origin) return undefined;

  const basePath =
    base.pathname === "/" ? "" : base.pathname.replace(/\/$/, "");
  if (
    basePath &&
    !url.pathname.startsWith(`${basePath}/`) &&
    url.pathname !== basePath
  ) {
    return undefined;
  }
  const pathname = basePath
    ? url.pathname.slice(basePath.length) || "/"
    : url.pathname;
  return `${pathname}${url.hash}`;
}

function fileForPublicPath(dist: string, pathname: string): string {
  const clean = decodeURIComponent(pathname.split(/[?#]/, 1)[0]).replace(
    /^\/+/,
    "",
  );
  if (!clean) return path.join(dist, "index.html");
  if (clean.endsWith("/")) return path.join(dist, clean, "index.html");
  return path.join(dist, clean);
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function anchorHrefs(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']*)["']/gi)].map(
    (match) => match[1],
  );
}

function resourceUrls(html: string): string[] {
  const direct = [
    ...html.matchAll(
      /<(?:img|source|script|link)\b[^>]*\b(?:src|href)=["']([^"']*)["']/gi,
    ),
  ].map((match) => match[1]);
  const responsive = [
    ...html.matchAll(/<(?:img|source)\b[^>]*\bsrcset=["']([^"']*)["']/gi),
  ].flatMap((match) =>
    match[1].split(",").map((candidate) => candidate.trim().split(/\s+/, 1)[0]),
  );
  return [...direct, ...responsive];
}

function ids(html: string): Set<string> {
  return new Set(
    [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]),
  );
}

function schemaTypes(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(schemaTypes);
  const record = value as Record<string, unknown>;
  return [
    ...(typeof record["@type"] === "string" ? [record["@type"]] : []),
    ...Object.values(record).flatMap(schemaTypes),
  ];
}

export async function auditPublicIntegrity({
  root,
  base,
}: PublicIntegrityOptions): Promise<PublicIntegrityReport> {
  const dist = path.join(root, "dist");
  const pages = await emittedPages(dist);
  const byRoute = new Map(pages.map((page) => [page.route, page]));
  const errors: string[] = [];
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  let socialImages = 0;
  let structuredDataBlocks = 0;

  for (const route of PUBLIC_METADATA_ROUTES) {
    const page = byRoute.get(route);
    if (!page) {
      errors.push(`${route}: rota pública não foi emitida.`);
      continue;
    }

    const title = one(errors, route, "title", titleValues(page.html));
    const description = one(
      errors,
      route,
      "meta description",
      tagAttribute(page.html, "meta", "name", "description", "content"),
    );
    const robots = one(
      errors,
      route,
      "meta robots",
      tagAttribute(page.html, "meta", "name", "robots", "content"),
    );
    const canonical = one(
      errors,
      route,
      "canonical",
      tagAttribute(page.html, "link", "rel", "canonical", "href"),
    );
    const ogUrl = one(
      errors,
      route,
      "og:url",
      tagAttribute(page.html, "meta", "property", "og:url", "content"),
    );
    const expectedCanonical = absoluteCanonicalUrl(route, base);
    if (robots !== "index, follow")
      errors.push(`${route}: robots deve ser index, follow.`);
    if (canonical !== expectedCanonical)
      errors.push(`${route}: canonical diverge da rota pública.`);
    if (ogUrl !== expectedCanonical)
      errors.push(`${route}: og:url diverge do canonical.`);

    for (const [selector, value] of [
      ["property", "og:title"],
      ["property", "og:description"],
      ["property", "og:type"],
      ["property", "og:site_name"],
      ["property", "og:locale"],
      ["name", "twitter:card"],
      ["name", "twitter:title"],
      ["name", "twitter:description"],
    ] as const) {
      one(
        errors,
        route,
        value,
        tagAttribute(page.html, "meta", selector, value, "content"),
      );
    }

    if (title) {
      const duplicate = titles.get(title);
      if (duplicate) errors.push(`${route}: title duplica ${duplicate}.`);
      titles.set(title, route);
    }
    if (description) {
      const duplicate = descriptions.get(description);
      if (duplicate) errors.push(`${route}: description duplica ${duplicate}.`);
      descriptions.set(description, route);
    }

    const ogImages = tagAttribute(
      page.html,
      "meta",
      "property",
      "og:image",
      "content",
    );
    const twitterImages = tagAttribute(
      page.html,
      "meta",
      "name",
      "twitter:image",
      "content",
    );
    const isWork = WORK_ROUTES.includes(route as (typeof WORK_ROUTES)[number]);
    if (isWork) {
      const image = one(errors, route, "og:image", ogImages);
      const twitterImage = one(errors, route, "twitter:image", twitterImages);
      one(
        errors,
        route,
        "og:image:alt",
        tagAttribute(page.html, "meta", "property", "og:image:alt", "content"),
      );
      one(
        errors,
        route,
        "og:image:width",
        tagAttribute(
          page.html,
          "meta",
          "property",
          "og:image:width",
          "content",
        ),
      );
      one(
        errors,
        route,
        "og:image:height",
        tagAttribute(
          page.html,
          "meta",
          "property",
          "og:image:height",
          "content",
        ),
      );
      one(
        errors,
        route,
        "twitter:image:alt",
        tagAttribute(page.html, "meta", "name", "twitter:image:alt", "content"),
      );
      if (image !== twitterImage)
        errors.push(`${route}: imagens OG e Twitter divergem.`);
      if (image) {
        socialImages += 1;
        const imagePath = internalPathFromUrl(image, base);
        if (!imagePath || !(await exists(fileForPublicPath(dist, imagePath)))) {
          errors.push(`${route}: imagem social não existe em dist/.`);
        }
      }
    } else if (ogImages.length > 0 || twitterImages.length > 0) {
      errors.push(
        `${route}: página institucional não deve inventar imagem social global.`,
      );
    }

    if (
      tagAttribute(page.html, "meta", "name", "twitter:site", "content")
        .length > 0 ||
      tagAttribute(page.html, "meta", "name", "twitter:creator", "content")
        .length > 0
    ) {
      errors.push(`${route}: handle Twitter/X não confirmado foi emitido.`);
    }

    const blocks = jsonLdValues(page.html);
    structuredDataBlocks += blocks.length;
    const types = blocks.flatMap(schemaTypes);
    const expectedTypes =
      route === publicRoutes.home
        ? ["WebSite"]
        : route === publicRoutes.sobre
          ? ["Person"]
          : route === publicRoutes.trabalhosIndex
            ? ["CollectionPage", "ItemList"]
            : isWork
              ? ["CreativeWork"]
              : route === publicRoutes.contato
                ? []
                : ["CollectionPage"];
    for (const type of expectedTypes) {
      if (!types.includes(type))
        errors.push(`${route}: JSON-LD ${type} ausente.`);
    }
    if (route === publicRoutes.contato && blocks.length > 0) {
      errors.push(`${route}: contato não deve declarar entidade comercial.`);
    }
    if (
      [
        publicRoutes.cadernoIndex,
        publicRoutes.colecoesIndex,
        publicRoutes.edicoesIndex,
      ].includes(route as never) &&
      types.includes("ItemList")
    ) {
      errors.push(`${route}: família vazia não deve declarar ItemList vazio.`);
    }
  }

  for (const route of TECHNICAL_ROUTES) {
    const page = byRoute.get(route);
    if (!page) {
      errors.push(`${route}: superfície técnica esperada não foi emitida.`);
      continue;
    }
    const robots = tagAttribute(page.html, "meta", "name", "robots", "content");
    if (robots.length !== 1 || robots[0] !== "noindex, nofollow") {
      errors.push(`${route}: superfície técnica deve usar noindex, nofollow.`);
    }
    if (
      tagAttribute(page.html, "link", "rel", "canonical", "href").length > 0
    ) {
      errors.push(`${route}: superfície técnica não pode emitir canonical.`);
    }
    if (jsonLdValues(page.html).length > 0) {
      errors.push(`${route}: superfície técnica não pode emitir JSON-LD.`);
    }
  }

  const publicSet = new Set<string>(PUBLIC_METADATA_ROUTES);
  for (const route of PUBLIC_METADATA_ROUTES) {
    const page = byRoute.get(route);
    if (!page) continue;
    const pageIds = ids(page.html);
    for (const href of anchorHrefs(page.html)) {
      if (!href) {
        errors.push(`${route}: link vazio.`);
        continue;
      }
      if (href.startsWith("#")) {
        if (!pageIds.has(href.slice(1)))
          errors.push(`${route}: fragmento sem destino ${href}.`);
        continue;
      }
      const internal = internalPathFromUrl(href, base);
      if (!internal) continue;
      const [destination, fragment] = internal.split("#", 2);
      if (destination !== "/" && !destination.endsWith("/")) {
        errors.push(`${route}: link interno sem barra final ${href}.`);
      }
      if (!publicSet.has(destination)) {
        errors.push(`${route}: link interno expõe rota não pública ${href}.`);
        continue;
      }
      if (fragment) {
        const target = byRoute.get(destination);
        if (!target || !ids(target.html).has(fragment)) {
          errors.push(`${route}: fragmento sem destino ${href}.`);
        }
      }
    }

    for (const resource of resourceUrls(page.html)) {
      const internal = internalPathFromUrl(resource, base);
      if (internal && !(await exists(fileForPublicPath(dist, internal)))) {
        errors.push(`${route}: recurso interno ausente ${resource}.`);
      }
    }
  }

  const sitemap = await readFile(path.join(dist, "sitemap.xml"), "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );
  const expectedUrls = PUBLIC_METADATA_ROUTES.map((route) =>
    absoluteCanonicalUrl(route, base),
  );
  if (new Set(sitemapUrls).size !== sitemapUrls.length)
    errors.push("sitemap.xml: URLs duplicadas.");
  if (
    sitemapUrls.length !== expectedUrls.length ||
    expectedUrls.some((url) => !sitemapUrls.includes(url))
  ) {
    errors.push(
      "sitemap.xml: conjunto diverge das nove rotas públicas indexáveis.",
    );
  }

  const rss = await readFile(path.join(dist, "rss.xml"), "utf8");
  const rssLinks = [
    ...rss.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g),
  ].map((match) => match[1]);
  const expectedRss = WORK_ROUTES.map((route) =>
    absoluteCanonicalUrl(route, base),
  );
  if (
    rssLinks.length !== 2 ||
    expectedRss.some((url) => !rssLinks.includes(url))
  ) {
    errors.push("rss.xml: deve conter exatamente os dois trabalhos públicos.");
  }

  const robots = await readFile(path.join(dist, "robots.txt"), "utf8");
  const expectedSitemap = absoluteSiteFileUrl("/sitemap.xml", base);
  if (!robots.includes(`Sitemap: ${expectedSitemap}`)) {
    errors.push(
      "robots.txt: referência absoluta ao sitemap ausente ou divergente.",
    );
  }

  const publicArtifacts = [
    ...PUBLIC_METADATA_ROUTES.flatMap(
      (route) => byRoute.get(route)?.html ?? [],
    ),
    sitemap,
    rss,
    robots,
  ]
    .join("\n")
    .toLowerCase();
  for (const marker of PRIVATE_MARKERS) {
    if (publicArtifacts.includes(marker))
      errors.push(`artefatos públicos expõem marcador privado: ${marker}.`);
  }

  return {
    errors,
    htmlPages: pages.length,
    publicPages: PUBLIC_METADATA_ROUTES.length,
    socialImages,
    structuredDataBlocks,
  };
}

export async function assertPublicIntegrity(
  options: PublicIntegrityOptions,
): Promise<PublicIntegrityReport> {
  const report = await auditPublicIntegrity(options);
  if (report.errors.length > 0) {
    throw new Error(
      `Integridade pública inválida:\n- ${report.errors.join("\n- ")}`,
    );
  }
  return report;
}
