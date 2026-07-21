import type { CollectionEntry } from "astro:content";

import {
  isEffectivelyPublic,
  isRssEligible,
  isSitemapEligible,
  isStandardCirculation,
  type EligibilityInput,
} from "./eligibility.ts";
import { referenceId } from "./schemas/shared.ts";

export type PublicEditorialCollection =
  "trabalhos" | "caderno" | "colecoes" | "edicoes" | "paginas";

const TECHNICAL_FIXTURES: Readonly<
  Record<PublicEditorialCollection, ReadonlySet<string>>
> = {
  trabalhos: new Set(["fixture-trabalho"]),
  caderno: new Set(["fixture-texto"]),
  colecoes: new Set(["fixture-colecao"]),
  edicoes: new Set(["001"]),
  paginas: new Set(["sobre", "contato"]),
};

export const APPROVED_WORK_PRESENTATION = {
  "nephillin-uma-cobertura-sem-credencial": {
    formatLabel: "Cobertura",
    contextLabel: "Autoral",
    subject: "Banda Nephillin",
    peopleRelease: "not-confirmed",
  },
  "feira-do-rolo": {
    formatLabel: "Documental",
    contextLabel: "Feira do Rolo",
    subject: "Feira do Rolo",
    peopleRelease: "not-confirmed",
  },
} as const;

export type ApprovedWorkId = keyof typeof APPROVED_WORK_PRESENTATION;

export interface WorkPresentation {
  formatLabel: string;
  contextLabel: string;
  subject?: string;
  peopleRelease?: "not-confirmed";
}

interface PublicEntryLike {
  collection: PublicEditorialCollection;
  id: string;
  data: EligibilityInput;
}

export function buildInstant(): Date {
  const configured = process.env.BUILD_INSTANT;
  return configured ? new Date(configured) : new Date();
}

export function isTechnicalFixture(
  collection: PublicEditorialCollection,
  id: string,
): boolean {
  return TECHNICAL_FIXTURES[collection].has(id);
}

export function isIndividuallyPublic(
  entry: PublicEntryLike,
  at: Date,
): boolean {
  return (
    !isTechnicalFixture(entry.collection, entry.id) &&
    isEffectivelyPublic(entry.data, at)
  );
}

export function isInPublicCirculation(
  entry: PublicEntryLike,
  at: Date,
): boolean {
  return (
    !isTechnicalFixture(entry.collection, entry.id) &&
    isStandardCirculation(entry.data, at)
  );
}

export function isPublicInSitemap(entry: PublicEntryLike, at: Date): boolean {
  return (
    !isTechnicalFixture(entry.collection, entry.id) &&
    isSitemapEligible(entry.data, at)
  );
}

export function isPublicInRss(entry: PublicEntryLike, at: Date): boolean {
  return (
    !isTechnicalFixture(entry.collection, entry.id) &&
    isRssEligible(entry.data, at)
  );
}

function enumLabel(value: string): string {
  return value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);
}

export function workPresentation(
  id: string,
  structural?: { formato: string; contexto: string },
): WorkPresentation {
  const presentation = APPROVED_WORK_PRESENTATION[id as ApprovedWorkId];
  return (
    presentation ?? {
      formatLabel: enumLabel(structural?.formato ?? "trabalho"),
      contextLabel: enumLabel(structural?.contexto ?? "editorial"),
    }
  );
}

interface RelatedWorkEntryLike {
  collection: "trabalhos";
  id: string;
  data: EligibilityInput & { relatedWorks: readonly unknown[] };
}

export function publicRelatedWorks<TEntry extends RelatedWorkEntryLike>(
  entry: TEntry,
  candidates: readonly TEntry[],
  at: Date,
): TEntry[] {
  const relatedIds = new Set(entry.data.relatedWorks.map(referenceId));
  return candidates.filter(
    (candidate) =>
      relatedIds.has(candidate.id) && isInPublicCirculation(candidate, at),
  );
}

export function sortWorksByDate<
  T extends { data: { date: string; archiveNumber: string } },
>(works: readonly T[]): T[] {
  return [...works].sort(
    (a, b) =>
      b.data.date.localeCompare(a.data.date) ||
      b.data.archiveNumber.localeCompare(a.data.archiveNumber),
  );
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatEditorialDate(start: string, end?: string): string {
  const format = (value: string) =>
    dateFormatter.format(new Date(`${value}T00:00:00Z`));
  return end ? `${format(start)} a ${format(end)}` : format(start);
}

export function formatLocation(location?: {
  city: string;
  subdivision?: string;
  country: string;
}): string | undefined {
  if (!location) return undefined;
  return [location.city, location.subdivision].filter(Boolean).join(", ");
}

export function publicWorkContinuity(
  works: readonly CollectionEntry<"trabalhos">[],
  currentId: string,
) {
  const ordered = sortWorksByDate(works);
  const index = ordered.findIndex((entry) => entry.id === currentId);
  return {
    previous: index >= 0 ? ordered[index + 1] : undefined,
    next: index > 0 ? ordered[index - 1] : undefined,
  };
}
