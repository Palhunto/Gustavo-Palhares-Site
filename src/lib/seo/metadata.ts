import { siteConfig } from "../../config/site.ts";
import {
  absoluteCanonicalUrl,
  absoluteSiteFileUrl,
  configuredSiteUrl,
  normalizeSiteUrl,
} from "./site-url.ts";

export type RobotsDirective =
  "index, follow" | "noindex, follow" | "noindex, nofollow";

export interface SeoMetadataInput {
  title?: string;
  description?: string;
  pathname: string;
  siteUrl?: string;
  canonical?: boolean;
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

function absoluteUrl(value: string | undefined, base: URL | undefined) {
  if (!value) return undefined;
  try {
    const url =
      value.startsWith("/") && base
        ? new URL(absoluteSiteFileUrl(value, base))
        : new URL(value);
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
  canonical = true,
  robots = "index, follow",
  socialImage,
  type = "website",
}: SeoMetadataInput): SeoMetadata {
  const base =
    siteUrl === undefined ? configuredSiteUrl() : normalizeSiteUrl(siteUrl);
  const pageTitle = title ? `${title} — ${siteConfig.name}` : siteConfig.name;

  return {
    title: pageTitle,
    description,
    robots,
    canonical:
      canonical && base ? absoluteCanonicalUrl(pathname, base) : undefined,
    socialImage: absoluteUrl(socialImage, base),
    type,
  };
}
