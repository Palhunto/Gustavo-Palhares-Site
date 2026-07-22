import { getImage } from "astro:assets";

import {
  getContentMediaResolver,
  type EditorialMediaInput,
} from "../media/index.ts";
import type { SocialImageMetadata } from "./metadata.ts";
import { absoluteSiteFileUrl, configuredSiteUrl } from "./site-url.ts";

export async function resolveSocialImage(
  input: EditorialMediaInput,
  at: Date,
  base = configuredSiteUrl(),
): Promise<SocialImageMetadata | undefined> {
  if (!base) return undefined;

  const resolver = await getContentMediaResolver();
  const media = resolver.resolve(input, { layout: "lead", at });
  const result = await getImage({
    src: media.src,
    width: Math.min(media.src.width, 1200),
    format: "jpeg",
  });
  const width = Number(result.attributes.width);
  const height = Number(result.attributes.height);

  return {
    url: absoluteSiteFileUrl(result.src, base),
    alt: media.alt || media.description,
    ...(Number.isInteger(width) && Number.isInteger(height)
      ? { width, height }
      : {}),
  };
}
