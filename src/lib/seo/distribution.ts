import {
  buildInstant,
  getRssEntries,
  getSitemapEntries,
  resolveCredit,
} from "../content/index.ts";
import type { ContentDataset, ContentEntry } from "../content/types.ts";
import { publicRoutes, type PublicPath } from "../routes/public.ts";
import { absoluteCanonicalUrl, absoluteSiteFileUrl } from "./site-url.ts";

export const DISTRIBUTION_PATHS = {
  sitemap: "/sitemap.xml",
  rss: "/rss.xml",
  robots: "/robots.txt",
} as const;

export const STATIC_SITEMAP_ROUTES = [
  publicRoutes.home,
  publicRoutes.trabalhosIndex,
  publicRoutes.cadernoIndex,
  publicRoutes.colecoesIndex,
  publicRoutes.edicoesIndex,
  publicRoutes.sobre,
  publicRoutes.contato,
] as const;

export interface RssItem {
  title: string;
  summary: string;
  date: string;
  path: PublicPath;
  stableId: string;
  author?: string;
}

function xml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function routeForEntry(
  entry: ReturnType<typeof getSitemapEntries>[number],
): PublicPath | undefined {
  switch (entry.collection) {
    case "trabalhos":
      return publicRoutes.trabalho(entry.data.slug);
    case "caderno":
      return publicRoutes.caderno(entry.data.slug);
    case "colecoes":
      return publicRoutes.colecao(entry.data.slug);
    case "edicoes":
      return publicRoutes.edicao(entry.data.number);
    default:
      return undefined;
  }
}

export function sitemapRoutes(
  dataset: ContentDataset,
  at = buildInstant(),
): PublicPath[] {
  const routes = getSitemapEntries(dataset, at).flatMap((entry) => {
    const route = routeForEntry(entry);
    return route ? [route] : [];
  });
  return [...new Set([...STATIC_SITEMAP_ROUTES, ...routes])];
}

function itemAuthor(
  dataset: ContentDataset,
  entry: ContentEntry<"trabalhos"> | ContentEntry<"caderno">,
): string | undefined {
  const credits =
    entry.collection === "trabalhos" ? entry.data.credits : entry.data.authors;
  const credit = credits[0];
  return credit ? resolveCredit(dataset, credit)?.name : undefined;
}

export function rssItems(
  dataset: ContentDataset,
  at = buildInstant(),
): RssItem[] {
  return getRssEntries(dataset, at)
    .map((entry) => ({
      title: entry.data.title,
      summary: entry.data.summary,
      date: entry.data.date,
      path:
        entry.collection === "trabalhos"
          ? publicRoutes.trabalho(entry.data.slug)
          : publicRoutes.caderno(entry.data.slug),
      stableId:
        entry.collection === "trabalhos"
          ? entry.data.archiveNumber
          : `caderno:${entry.id}`,
      author: itemAuthor(dataset, entry),
    }))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.stableId.localeCompare(a.stableId),
    );
}

export function renderSitemapXml(
  dataset: ContentDataset,
  base: URL | undefined,
  at = buildInstant(),
): string {
  const entries = base
    ? sitemapRoutes(dataset, at)
        .map(
          (route) =>
            `  <url><loc>${xml(absoluteCanonicalUrl(route, base))}</loc></url>`,
        )
        .join("\n")
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries ? `\n${entries}\n` : ""}</urlset>\n`;
}

export function renderRssXml(
  dataset: ContentDataset,
  base: URL | undefined,
  at = buildInstant(),
): string {
  const channelUrl = base ? absoluteCanonicalUrl(publicRoutes.home, base) : "";
  const items = base
    ? rssItems(dataset, at)
        .map((item) => {
          const url = absoluteCanonicalUrl(item.path, base);
          return [
            "    <item>",
            `      <title>${xml(item.title)}</title>`,
            `      <description>${xml(item.summary)}</description>`,
            `      <link>${xml(url)}</link>`,
            `      <guid isPermaLink="false">${xml(item.stableId)}</guid>`,
            `      <pubDate>${new Date(`${item.date}T00:00:00Z`).toUTCString()}</pubDate>`,
            item.author
              ? `      <dc:creator>${xml(item.author)}</dc:creator>`
              : "",
            "    </item>",
          ]
            .filter(Boolean)
            .join("\n");
        })
        .join("\n")
    : "";

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    "    <title>Gustavo Palhares</title>",
    "    <description>Trabalhos fotográficos e textos da publicação digital pessoal de Gustavo Palhares.</description>",
    channelUrl ? `    <link>${xml(channelUrl)}</link>` : "",
    items,
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function renderRobotsTxt(base: URL | undefined): string {
  const lines = ["User-agent: *", "Allow: /"];
  if (base) {
    lines.push(
      `Sitemap: ${absoluteSiteFileUrl(DISTRIBUTION_PATHS.sitemap, base)}`,
    );
  }
  return `${lines.join("\n")}\n`;
}
