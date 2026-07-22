import { siteConfig } from "../../config/site.ts";
import {
  absoluteCanonicalUrl,
  absoluteSiteFileUrl,
  configuredSiteUrl,
  normalizeSiteUrl,
} from "./site-url.ts";

export type RobotsDirective =
  "index, follow" | "noindex, follow" | "noindex, nofollow";

export interface SocialImageMetadata {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export type StructuredData =
  Record<string, unknown> | readonly Record<string, unknown>[];

export interface SeoMetadataInput {
  title?: string;
  description?: string;
  pathname: string;
  siteUrl?: string;
  canonical?: boolean;
  robots?: RobotsDirective;
  socialImage?: SocialImageMetadata;
  type?: "website" | "article";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: StructuredData;
}

export interface SeoMetadata {
  title: string;
  description: string;
  robots: RobotsDirective;
  canonical?: string;
  socialImage?: SocialImageMetadata;
  type: "website" | "article";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: StructuredData;
}

function nonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} não pode ficar vazio.`);
  return normalized;
}

function resolveSocialImage(
  value: SocialImageMetadata | undefined,
  base: URL | undefined,
): SocialImageMetadata | undefined {
  if (!value) return undefined;
  if (!value.url.startsWith("/") && !/^https?:\/\//.test(value.url)) {
    throw new Error(
      "Imagem social deve usar uma URL HTTP(S) ou caminho absoluto.",
    );
  }
  if (value.url.startsWith("/") && !base) return undefined;

  let url: URL;
  try {
    url = value.url.startsWith("/")
      ? new URL(absoluteSiteFileUrl(value.url, base!))
      : new URL(value.url);
  } catch {
    throw new Error("Imagem social possui URL inválida.");
  }
  if (!/^https?:$/.test(url.protocol)) {
    throw new Error("Imagem social deve usar HTTP ou HTTPS.");
  }
  if (
    (value.width === undefined) !== (value.height === undefined) ||
    (value.width !== undefined &&
      (!Number.isInteger(value.width) ||
        !Number.isInteger(value.height) ||
        value.width <= 0 ||
        value.height! <= 0))
  ) {
    throw new Error(
      "Dimensões sociais devem ser inteiros positivos completos.",
    );
  }

  return {
    ...value,
    url: url.href,
    alt: nonEmpty(value.alt, "Texto alternativo da imagem social"),
  };
}

export function createSeoMetadata({
  title,
  description = siteConfig.description,
  pathname,
  siteUrl,
  canonical = true,
  robots = "index, follow",
  socialImage,
  type = "website",
  author,
  publishedTime,
  modifiedTime,
  structuredData,
}: SeoMetadataInput): SeoMetadata {
  const base =
    siteUrl === undefined ? configuredSiteUrl() : normalizeSiteUrl(siteUrl);
  const pageTitle = title
    ? `${nonEmpty(title, "Título")} — ${siteConfig.name}`
    : siteConfig.name;

  return {
    title: pageTitle,
    description: nonEmpty(description, "Descrição"),
    robots,
    canonical:
      canonical && base ? absoluteCanonicalUrl(pathname, base) : undefined,
    socialImage: resolveSocialImage(socialImage, base),
    type,
    author: author?.trim() || undefined,
    publishedTime,
    modifiedTime,
    structuredData,
  };
}

export function serializeStructuredData(value: StructuredData): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}
