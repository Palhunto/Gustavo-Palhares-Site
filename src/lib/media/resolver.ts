import type { ImageMetadata } from "astro";

import { referenceId } from "../content/schemas/shared.ts";

export const MEDIA_LAYOUTS = {
  inline: {
    sizes: "(min-width: 64rem) 42rem, calc(100vw - 2rem)",
    widths: [320, 480, 640, 768, 960],
  },
  lead: {
    sizes: "(min-width: 64rem) 72vw, 100vw",
    widths: [480, 768, 960, 1200, 1600, 1920],
  },
  "full-bleed": {
    sizes: "100vw",
    widths: [480, 768, 960, 1200, 1600, 1920],
  },
  sequence: {
    sizes: "(min-width: 64rem) 46vw, (min-width: 48rem) 50vw, 100vw",
    widths: [320, 480, 640, 768, 960, 1200],
  },
  thumbnail: {
    sizes: "(min-width: 64rem) 20vw, (min-width: 48rem) 33vw, 50vw",
    widths: [240, 320, 480, 640, 768],
  },
} as const;

export type MediaLayout = keyof typeof MEDIA_LAYOUTS;
export type MediaLoading = "eager" | "lazy";

export interface MediaUseInput {
  asset: string | { id: string };
  decorative?: boolean;
  altOverride?: string;
  captionOverride?: string;
  crop?: {
    aspectRatio?: string;
    focalPoint?: { x: number; y: number };
  };
  loading?: MediaLoading;
}

export type EditorialMediaInput = string | MediaUseInput;

export interface MediaRecord {
  id: string;
  data: {
    src: ImageMetadata;
    description: string;
    defaultAlt: string;
    defaultCaption?: string;
    credit: { role: string; person?: unknown; name?: string };
    focalPoint?: { x: number; y: number };
    rights: { status: string; holder: string; expiresAt?: string };
  };
}

export interface PersonRecord {
  id: string;
  data: { name: string; public: boolean; url?: string };
}

export interface ResolvedEditorialMedia {
  id: string;
  src: ImageMetadata;
  description: string;
  alt: string;
  decorative: boolean;
  caption?: string;
  credit: { role: string; name: string };
  aspectRatio?: string;
  objectPosition: string;
  loading: MediaLoading;
  priority: boolean;
  sizes: string;
  widths: readonly number[];
}

export interface ResolveMediaOptions {
  layout?: MediaLayout;
  priority?: boolean;
  at?: Date;
}

export interface MediaResolver {
  resolve(
    input: EditorialMediaInput,
    options?: ResolveMediaOptions,
  ): ResolvedEditorialMedia;
  resolveMany(
    inputs: readonly EditorialMediaInput[],
    options?: ResolveMediaOptions,
  ): ResolvedEditorialMedia[];
}

const mediaIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeUse(input: EditorialMediaInput): MediaUseInput {
  return typeof input === "string"
    ? { asset: input, decorative: false }
    : { ...input, decorative: input.decorative ?? false };
}

function validatedMediaId(value: unknown): string {
  const id = referenceId(value);
  if (!id || !mediaIdPattern.test(id)) {
    throw new Error(
      "A mídia deve ser referenciada por um ID kebab-case, nunca por caminho de arquivo.",
    );
  }
  return id;
}

function resolveCredit(
  media: MediaRecord,
  people: ReadonlyMap<string, PersonRecord>,
): { role: string; name: string } {
  if (media.data.credit.name) {
    return { role: media.data.credit.role, name: media.data.credit.name };
  }
  const personId = referenceId(media.data.credit.person);
  const person = personId ? people.get(personId) : undefined;
  if (!person) {
    throw new Error(`Crédito de mídia inexistente: ${media.id}.`);
  }
  return { role: media.data.credit.role, name: person.data.name };
}

function assertCrop(input: MediaUseInput): void {
  const focal = input.crop?.focalPoint;
  if (
    focal &&
    (![focal.x, focal.y].every(Number.isFinite) ||
      focal.x < 0 ||
      focal.x > 100 ||
      focal.y < 0 ||
      focal.y > 100)
  ) {
    throw new Error("O ponto focal deve usar percentuais entre 0 e 100.");
  }
  const ratio = input.crop?.aspectRatio;
  if (ratio && !/^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/.test(ratio)) {
    throw new Error("A proporção de corte deve usar o formato largura:altura.");
  }
}

export function createMediaResolver(
  mediaRecords: readonly MediaRecord[],
  personRecords: readonly PersonRecord[] = [],
): MediaResolver {
  const media = new Map(mediaRecords.map((entry) => [entry.id, entry]));
  const people = new Map(personRecords.map((entry) => [entry.id, entry]));

  function resolve(
    input: EditorialMediaInput,
    options: ResolveMediaOptions = {},
  ): ResolvedEditorialMedia {
    const use = normalizeUse(input);
    const id = validatedMediaId(use.asset);
    const entry = media.get(id);
    if (!entry) throw new Error(`Mídia inexistente: ${id}.`);
    if (entry.data.rights.status !== "cleared") {
      throw new Error(`Mídia sem liberação pública: ${id}.`);
    }
    const expiresAt = entry.data.rights.expiresAt;
    const resolutionInstant = options.at ?? new Date();
    if (expiresAt && Date.parse(expiresAt) <= resolutionInstant.getTime()) {
      throw new Error(`Mídia com direitos expirados em ${expiresAt}: ${id}.`);
    }
    if (use.decorative && use.altOverride) {
      throw new Error("Mídia decorativa não aceita alt contextual.");
    }
    assertCrop(use);
    const alt = use.decorative
      ? ""
      : use.altOverride?.trim() || entry.data.defaultAlt.trim();
    if (!use.decorative && !alt) {
      throw new Error(`Mídia informativa sem texto alternativo: ${id}.`);
    }

    const layout = options.layout ?? "inline";
    const priority = options.priority ?? false;
    if (use.loading === "eager" && !priority) {
      throw new Error(
        `A mídia "${id}" só pode usar loading="eager" quando priority=true.`,
      );
    }
    const focal = use.crop?.focalPoint ?? entry.data.focalPoint;
    return {
      id,
      src: entry.data.src,
      description: entry.data.description,
      alt,
      decorative: use.decorative ?? false,
      caption: use.captionOverride?.trim() || entry.data.defaultCaption?.trim(),
      credit: resolveCredit(entry, people),
      aspectRatio: use.crop?.aspectRatio,
      objectPosition: focal ? `${focal.x}% ${focal.y}%` : "50% 50%",
      loading: priority ? "eager" : "lazy",
      priority,
      sizes: MEDIA_LAYOUTS[layout].sizes,
      widths: MEDIA_LAYOUTS[layout].widths,
    };
  }

  return {
    resolve,
    resolveMany(inputs, options) {
      return inputs.map((input) => resolve(input, options));
    },
  };
}

export function parseMediaList(
  value: string | readonly EditorialMediaInput[],
): EditorialMediaInput[] {
  if (typeof value !== "string") return [...value];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
