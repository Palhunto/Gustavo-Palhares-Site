import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { parse as parseYaml } from "yaml";

import { loadContentFromDisk } from "../content/source-loader.ts";
import { buildInstant, isIndividuallyPublic } from "../content/publication.ts";
import { referenceId } from "../content/schemas/shared.ts";

interface PendingManifest {
  items?: Array<{ id: string; asset: string }>;
}

export interface MediaBuildGateResult {
  emittedMediaIds: string[];
  publicMediaIds: string[];
  privateOnlyIds: string[];
}

function mediaIdFromUse(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || !("asset" in value))
    return undefined;
  return referenceId((value as { asset: unknown }).asset);
}

async function filesIn(
  directory: string,
  extension?: string,
): Promise<string[]> {
  const files = await readdir(directory, { recursive: true }).catch(
    (error: unknown) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    },
  );
  return files
    .map(String)
    .filter((file) => !extension || file.endsWith(extension));
}

export async function inspectMediaBuild(
  root: string,
  at: Date = buildInstant(),
): Promise<MediaBuildGateResult> {
  const dataset = await loadContentFromDisk(root);
  const dist = path.join(root, "dist");
  const htmlFiles = await filesIn(dist, ".html");
  const html = (
    await Promise.all(
      htmlFiles.map((file) => readFile(path.join(dist, file), "utf8")),
    )
  ).join("\n");
  const assetFiles = await filesIn(path.join(dist, "_astro"));

  const publicMedia = new Set<string>();
  const addUse = (value: unknown) => {
    const id = mediaIdFromUse(value);
    if (id) publicMedia.add(id);
  };

  for (const entry of dataset.trabalhos.filter((item) =>
    isIndividuallyPublic(item, at),
  )) {
    addUse(entry.data.cover);
    entry.data.gallery.forEach(addUse);
    addUse(
      entry.data.seo?.socialImage
        ? { asset: entry.data.seo.socialImage }
        : undefined,
    );
  }
  for (const entry of dataset.caderno.filter((item) =>
    isIndividuallyPublic(item, at),
  )) {
    addUse(entry.data.cover);
    addUse(
      entry.data.seo?.socialImage
        ? { asset: entry.data.seo.socialImage }
        : undefined,
    );
  }
  for (const entry of dataset.colecoes.filter((item) =>
    isIndividuallyPublic(item, at),
  )) {
    addUse(entry.data.cover);
    addUse(
      entry.data.seo?.socialImage
        ? { asset: entry.data.seo.socialImage }
        : undefined,
    );
  }
  for (const entry of dataset.edicoes.filter((item) =>
    isIndividuallyPublic(item, at),
  )) {
    addUse(
      entry.data.seo?.socialImage
        ? { asset: entry.data.seo.socialImage }
        : undefined,
    );
    for (const block of entry.data.blocks) {
      if (block.type === "hero") addUse(block.image);
    }
  }

  const canonical = new Map(
    dataset.midia.map((entry) => {
      const source = String(entry.rawData.src ?? "");
      return [entry.id, { entry, stem: path.parse(source).name }] as const;
    }),
  );
  const emitted = new Set<string>();
  const problems: string[] = [];

  for (const [id, { entry, stem }] of canonical) {
    const matchingFiles = assetFiles.filter((file) =>
      path.basename(file).startsWith(`${stem}.`),
    );
    const referencedInHtml =
      html.includes(`data-media-id="${id}"`) || html.includes(stem);
    if (matchingFiles.length === 0) continue;
    emitted.add(id);
    if (entry.data.rights.status !== "cleared") {
      problems.push(
        `${id}: mídia emitida com rights.status=${entry.data.rights.status}`,
      );
    }
    if (!referencedInHtml) {
      problems.push(
        `${id}: derivado emitido sem referência em qualquer documento HTML`,
      );
    }
  }

  for (const id of publicMedia) {
    const media = canonical.get(id);
    if (!media) {
      problems.push(
        `${id}: mídia de conteúdo público ausente do catálogo canônico`,
      );
      continue;
    }
    if (media.entry.data.rights.status !== "cleared") {
      problems.push(`${id}: conteúdo público referencia mídia sem clearance`);
    }
    if (!html.includes(`data-media-id="${id}"`)) {
      problems.push(
        `${id}: mídia pública aprovada não foi associada ao HTML por data-media-id`,
      );
    }
  }

  const manifestPath = path.join(
    root,
    "docs",
    "phase-5a",
    "media-pendente.yaml",
  );
  const manifest = parseYaml(
    await readFile(manifestPath, "utf8"),
  ) as PendingManifest;
  const privateOnly = (manifest.items ?? []).filter(
    (item) => !canonical.has(item.id),
  );
  for (const item of privateOnly) {
    const stem = path.parse(item.asset).name;
    const leaked = assetFiles.filter((file) =>
      path.basename(file).startsWith(`${stem}.`),
    );
    if (leaked.length > 0) {
      problems.push(
        `${item.id}: mídia presente somente no catálogo privado foi emitida (${leaked[0]})`,
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Gate de mídia privada falhou:\n- ${problems.join("\n- ")}`,
    );
  }

  return {
    emittedMediaIds: [...emitted].sort(),
    publicMediaIds: [...publicMedia].sort(),
    privateOnlyIds: privateOnly.map((item) => item.id).sort(),
  };
}
