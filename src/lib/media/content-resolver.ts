import { getCollection } from "astro:content";

import {
  createMediaResolver,
  type MediaRecord,
  type MediaResolver,
  type PersonRecord,
} from "./resolver.ts";

let contentResolver: Promise<MediaResolver> | undefined;

export function getContentMediaResolver(): Promise<MediaResolver> {
  contentResolver ??= Promise.all([
    getCollection("midia"),
    getCollection("pessoas"),
  ]).then(([media, people]) =>
    createMediaResolver(media as MediaRecord[], people as PersonRecord[]),
  );
  return contentResolver;
}
