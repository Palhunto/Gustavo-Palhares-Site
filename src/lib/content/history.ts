import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

import { isEffectivelyPublic } from "./eligibility.ts";
import type { IntegrityIssue } from "./issues.ts";
import { parseContentSource } from "./source-loader.ts";
import { domainSchemas } from "./schemas/collections.ts";
import { referenceId } from "./schemas/shared.ts";
import {
  emptyDataset,
  type AnyContentEntry,
  type CollectionName,
  type ContentDataset,
  type ContentEntry,
} from "./types.ts";

const execFile = promisify(execFileCallback);

function compositionFingerprint(data: ContentEntry<"edicoes">["data"]): string {
  return JSON.stringify(
    data.blocks.map((block) => {
      if (block.type === "hero")
        return {
          type: block.type,
          content: {
            kind: block.content.kind,
            id: referenceId(block.content.id),
          },
          asset: referenceId(block.image.asset),
          treatment: block.treatment,
        };
      if (block.type === "work-grid")
        return {
          type: block.type,
          works: block.works.map(referenceId),
          treatment: block.treatment,
        };
      if (block.type === "notebook-list")
        return {
          type: block.type,
          entries: block.entries.map(referenceId),
          treatment: block.treatment,
        };
      if (block.type === "collection-feature")
        return {
          type: block.type,
          collection: referenceId(block.collection),
          items: block.items.map((item) => ({
            kind: item.kind,
            id: referenceId(item.id),
          })),
          treatment: block.treatment,
        };
      return { type: block.type, treatment: block.treatment };
    }),
  );
}

function corrigendaExists(
  decisions: string,
  reference: string | undefined,
): boolean {
  if (!reference) return false;
  const marker = `## ${reference}`;
  const start = decisions.indexOf(marker);
  if (start < 0) return false;
  const next = decisions.indexOf("\n## ", start + marker.length);
  const section = decisions.slice(start, next < 0 ? undefined : next);
  return /corrigenda/i.test(section);
}

export function compareHistoricalContent(
  current: ContentDataset,
  base: ContentDataset | undefined,
  decisions: string,
  buildInstant: Date,
): IntegrityIssue[] {
  if (!base) return [];
  const issues: IntegrityIssue[] = [];
  for (const baseWork of base.trabalhos) {
    const currentWork = current.trabalhos.find(
      (entry) => entry.id === baseWork.id,
    );
    if (
      currentWork &&
      currentWork.data.archiveNumber !== baseWork.data.archiveNumber
    ) {
      issues.push({
        code: "archive-immutable",
        path: `Trabalho "${baseWork.id}" → archiveNumber`,
        message: `${baseWork.data.archiveNumber} não pode mudar para ${currentWork.data.archiveNumber}`,
      });
    }
    const reused = current.trabalhos.find(
      (entry) =>
        entry.id !== baseWork.id &&
        entry.data.archiveNumber === baseWork.data.archiveNumber,
    );
    if (reused)
      issues.push({
        code: "archive-reused",
        path: `Trabalho "${reused.id}" → archiveNumber`,
        message: `${baseWork.data.archiveNumber} já pertenceu a "${baseWork.id}" e não pode ser reutilizado`,
      });
  }
  for (const collection of [
    "trabalhos",
    "caderno",
    "colecoes",
    "paginas",
  ] as const) {
    for (const baseEntry of base[collection]) {
      if (!isEffectivelyPublic(baseEntry.data, buildInstant)) continue;
      const currentEntry = current[collection].find(
        (entry) => entry.id === baseEntry.id,
      );
      if (currentEntry && currentEntry.data.slug !== baseEntry.data.slug) {
        issues.push({
          code: "slug-immutable",
          path: `${collection} "${baseEntry.id}" → slug`,
          message: `slug publicado ${baseEntry.data.slug} não pode mudar sem política de redirect`,
        });
      }
    }
  }
  for (const baseEdition of base.edicoes) {
    if (!isEffectivelyPublic(baseEdition.data, buildInstant)) continue;
    const currentEdition = current.edicoes.find(
      (entry) => entry.id === baseEdition.id,
    );
    if (!currentEdition) {
      issues.push({
        code: "edition-removed",
        path: `Edição ${baseEdition.id}`,
        message: "edição publicada não pode ser removida",
      });
      continue;
    }
    const changed =
      compositionFingerprint(currentEdition.data) !==
      compositionFingerprint(baseEdition.data);
    if (
      !changed &&
      currentEdition.data.compositionRevision !==
        baseEdition.data.compositionRevision
    ) {
      issues.push({
        code: "edition-revision-unnecessary",
        path: `Edição ${baseEdition.id} → compositionRevision`,
        message: "revision só muda quando a composição muda por corrigenda",
      });
    }
    if (changed) {
      if (
        currentEdition.data.compositionRevision <=
        baseEdition.data.compositionRevision
      ) {
        issues.push({
          code: "edition-revision",
          path: `Edição ${baseEdition.id} → compositionRevision`,
          message: "alteração de composição exige incremento de revision",
        });
      }
      if (
        !corrigendaExists(decisions, currentEdition.data.corrigendaDecision)
      ) {
        issues.push({
          code: "edition-corrigenda",
          path: `Edição ${baseEdition.id} → corrigendaDecision`,
          message:
            "alteração de composição exige decisão de corrigenda existente em DECISIONS.md",
        });
      }
    }
  }
  return issues;
}

export async function loadBaseContentFromGit(
  root: string,
  baseRef: string | undefined,
): Promise<ContentDataset | undefined> {
  if (!baseRef) return undefined;
  try {
    await execFile("git", ["rev-parse", "--verify", `${baseRef}^{commit}`], {
      cwd: root,
    });
  } catch {
    return undefined;
  }
  const { stdout } = await execFile(
    "git",
    ["ls-tree", "-r", "--name-only", baseRef, "--", "src/content"],
    { cwd: root, maxBuffer: 10 * 1024 * 1024 },
  );
  const dataset = emptyDataset();
  const paths = stdout.split(/\r?\n/).filter(Boolean).sort();
  for (const gitPath of paths) {
    const parts = gitPath.split("/");
    const collection = parts[2] as CollectionName | undefined;
    if (!collection || !(collection in dataset)) continue;
    const extension = path.extname(gitPath).toLowerCase();
    if (![".md", ".mdx", ".yaml", ".yml"].includes(extension)) continue;
    const { stdout: source } = await execFile(
      "git",
      ["show", `${baseRef}:${gitPath}`],
      { cwd: root, maxBuffer: 10 * 1024 * 1024 },
    );
    const parsed = parseContentSource(source, extension);
    const result = domainSchemas[collection].safeParse(parsed.data);
    if (!result.success)
      throw new Error(
        `Conteúdo-base inválido em ${gitPath}: ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
      );
    const id = path.basename(gitPath, extension);
    (dataset[collection] as AnyContentEntry[]).push({
      collection,
      id,
      filePath: gitPath,
      data: result.data,
      rawData: parsed.data,
      body: parsed.body,
    } as AnyContentEntry);
  }
  return dataset;
}
