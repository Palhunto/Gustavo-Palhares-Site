import type { ResolvedEditorialMedia } from "./resolver.ts";

export function commonMediaCredit(
  media: readonly ResolvedEditorialMedia[],
): ResolvedEditorialMedia["credit"] | undefined {
  const first = media[0]?.credit;
  if (!first) return undefined;
  return media.every(
    (item) =>
      item.credit.role === first.role && item.credit.name === first.name,
  )
    ? first
    : undefined;
}
