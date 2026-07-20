import { readFile } from "node:fs/promises";
import path from "node:path";

import { loadBaseContentFromGit, compareHistoricalContent } from "./history.ts";
import { validateIntegrity } from "./integrity.ts";
import { ContentIntegrityError } from "./issues.ts";
import { loadContentFromDisk } from "./source-loader.ts";

export * from "./eligibility.ts";
export * from "./history.ts";
export * from "./integrity.ts";
export * from "./issues.ts";
export * from "./mdx-policy.ts";
export * from "./normalization.ts";
export * from "./queries.ts";
export * from "./schemas/collections.ts";
export * from "./schemas/media.ts";
export * from "./schemas/shared.ts";
export * from "./source-loader.ts";
export * from "./types.ts";

export interface ContentGateOptions {
  root: string;
  buildInstant: Date;
  baseRef?: string;
}

export async function runContentGate({
  root,
  buildInstant,
  baseRef,
}: ContentGateOptions) {
  const current = await loadContentFromDisk(root);
  const base = await loadBaseContentFromGit(root, baseRef);
  const decisions = await readFile(
    path.join(root, "docs", "DECISIONS.md"),
    "utf8",
  );
  const issues = [
    ...validateIntegrity(current, buildInstant),
    ...compareHistoricalContent(current, base, decisions, buildInstant),
  ];
  if (issues.length > 0) throw new ContentIntegrityError(issues);
  return current;
}
