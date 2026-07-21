import { siteConfig } from "../../config/site.ts";

export type RobotsDirective =
  "index, follow" | "noindex, follow" | "noindex, nofollow";

export interface SeoMetadataInput {
  title?: string;
  description?: string;
  pathname: string;
  siteUrl?: string;
  robots?: RobotsDirective;
  socialImage?: string;
  type?: "website" | "article";
}

export interface SeoMetadata {
  title: string;
  description: string;
  robots: RobotsDirective;
  canonical?: string;
  socialImage?: string;
  type: "website" | "article";
}

function normalizedBase(value: string | undefined): URL | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

function absoluteUrl(value: string | undefined, base: URL | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value, base);
    return /^https?:$/.test(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function createSeoMetadata({
  title,
  description = siteConfig.description,
  pathname,
  siteUrl,
  robots = "index, follow",
  socialImage,
  type = "website",
}: SeoMetadataInput): SeoMetadata {
  const base = normalizedBase(siteUrl);
  const pageTitle = title ? `${title} — ${siteConfig.name}` : siteConfig.name;

  return {
    title: pageTitle,
    description,
    robots,
    canonical: base ? new URL(pathname, base).href : undefined,
    socialImage: absoluteUrl(socialImage, base),
    type,
  };
}
