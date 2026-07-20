import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { parse as parseYaml } from "yaml";

import { validateMdxPolicy } from "./mdx-policy.ts";
import { domainSchemas } from "./schemas/collections.ts";
import { editorialIdSchema } from "./schemas/shared.ts";
import {
  COLLECTION_NAMES,
  emptyDataset,
  type AnyContentEntry,
  type CollectionName,
  type ContentDataset,
  type ContentEntry,
} from "./types.ts";

export interface SourceIssue {
  path: string;
  message: string;
}

export class ContentSourceError extends Error {
  readonly issues: SourceIssue[];

  constructor(issues: SourceIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
    this.name = "ContentSourceError";
    this.issues = issues;
  }
}

const extensions: Record<CollectionName, Set<string>> = {
  trabalhos: new Set([".md", ".mdx"]),
  caderno: new Set([".md", ".mdx"]),
  colecoes: new Set([".md"]),
  edicoes: new Set([".yaml", ".yml"]),
  midia: new Set([".yaml", ".yml"]),
  pessoas: new Set([".yaml", ".yml"]),
  paginas: new Set([".md"]),
};

export function idFromContentPath(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

export function parseContentSource(
  source: string,
  extension: string,
): { data: Record<string, unknown>; body?: string } {
  if (extension === ".yaml" || extension === ".yml") {
    const data: unknown = parseYaml(source);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("YAML precisa conter um objeto na raiz");
    }
    return { data: data as Record<string, unknown> };
  }
  const normalized = source.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error("Markdown/MDX precisa começar com frontmatter YAML");
  }
  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0) throw new Error("frontmatter YAML não foi encerrado");
  const parsed: unknown = parseYaml(normalized.slice(4, end));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("frontmatter precisa conter um objeto");
  }
  return {
    data: parsed as Record<string, unknown>,
    body: normalized.slice(end + 5),
  };
}

async function filesIn(
  directory: string,
  allowed: Set<string>,
): Promise<string[]> {
  const entries = await readdir(directory, {
    recursive: true,
    withFileTypes: true,
  }).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  });
  return entries
    .filter(
      (entry) =>
        entry.isFile() && allowed.has(path.extname(entry.name).toLowerCase()),
    )
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort();
}

export async function loadContentFromDisk(
  root: string,
): Promise<ContentDataset> {
  const dataset = emptyDataset();
  const issues: SourceIssue[] = [];
  for (const collection of COLLECTION_NAMES) {
    const base = path.join(root, "src", "content", collection);
    const files = await filesIn(base, extensions[collection]);
    const seenIds = new Map<string, string>();
    for (const filePath of files) {
      const relativePath = path.relative(root, filePath).replaceAll("\\", "/");
      const id = idFromContentPath(filePath);
      const idResult = editorialIdSchema.safeParse(id);
      if (!idResult.success) {
        issues.push({
          path: `${collection}/${relativePath}`,
          message: `ID ${id}: ${idResult.error.issues[0]?.message}`,
        });
        continue;
      }
      const previous = seenIds.get(id);
      if (previous) {
        issues.push({
          path: `${collection}/${relativePath}`,
          message: `ID duplicado ${id}; também usado por ${previous}`,
        });
        continue;
      }
      seenIds.set(id, relativePath);
      try {
        const extension = path.extname(filePath).toLowerCase();
        const source = await readFile(filePath, "utf8");
        const parsed = parseContentSource(source, extension);
        if (extension === ".mdx" && parsed.body !== undefined) {
          for (const issue of validateMdxPolicy(parsed.body)) {
            issues.push({
              path: `${relativePath}${issue.line ? `:${issue.line}` : ""}`,
              message: issue.message,
            });
          }
        }
        const result = domainSchemas[collection].safeParse(parsed.data);
        if (!result.success) {
          for (const issue of result.error.issues) {
            issues.push({
              path: `${relativePath} → ${issue.path.join(".") || "frontmatter"}`,
              message: issue.message,
            });
          }
          continue;
        }
        const entry = {
          collection,
          id,
          filePath: relativePath,
          data: result.data,
          rawData: parsed.data,
          body: parsed.body,
        } as ContentEntry<typeof collection>;
        (dataset[collection] as AnyContentEntry[]).push(
          entry as AnyContentEntry,
        );
      } catch (error) {
        issues.push({
          path: relativePath,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
  if (issues.length > 0) throw new ContentSourceError(issues);
  return dataset;
}
