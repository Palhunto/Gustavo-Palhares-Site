import {
  isEffectivelyPublic,
  isRssEligible,
  isSitemapEligible,
  isStandardCirculation,
  type EligibilityInput,
} from "./eligibility.ts";
import { isEditorialDatePending, isEditorialYear } from "./schemas/shared.ts";

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
  "kauan-felix-uma-noite-de-k-1": {
    formatLabel: "Cobertura",
    contextLabel: "Demolidor Fight",
    subject: "Esporte",
  },
  magma: {
    formatLabel: "Documental",
    contextLabel: "Evento cultural",
    subject: "Evento cultural",
    peopleRelease: "not-confirmed",
  },
  "ate-a-luz-mudar": {
    formatLabel: "Ensaio documental",
    contextLabel: "Autoral",
    subject: "Vida universitária",
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

export function sortWorksByDate<
  T extends { data: { date: string; dateEnd?: string; archiveNumber: string } },
>(works: readonly T[]): T[] {
  return [...works].sort((a, b) => {
    const aPending = isEditorialDatePending(a.data.date);
    const bPending = isEditorialDatePending(b.data.date);
    if (aPending !== bPending) return aPending ? 1 : -1;
    return (
      (b.data.dateEnd ?? b.data.date).localeCompare(
        a.data.dateEnd ?? a.data.date,
      ) || b.data.archiveNumber.localeCompare(a.data.archiveNumber)
    );
  });
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const monthAndYearFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function editorialDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

export function formatEditorialDate(start: string, end?: string): string {
  if (isEditorialDatePending(start)) return "Período a confirmar";
  if (isEditorialYear(start)) return end ? `${start}–${end}` : start;
  if (!end) return dateFormatter.format(editorialDate(start));

  if (start.slice(0, 7) === end.slice(0, 7)) {
    const startDay = Number.parseInt(start.slice(8, 10), 10);
    const endDay = Number.parseInt(end.slice(8, 10), 10);
    const monthAndYear = monthAndYearFormatter.format(editorialDate(start));
    return `${startDay}–${endDay} de ${monthAndYear}`;
  }

  return `${dateFormatter.format(editorialDate(start))} a ${dateFormatter.format(
    editorialDate(end),
  )}`;
}

export function formatCompactEditorialDate(
  start: string,
  end?: string,
): string {
  return formatEditorialDate(start, end);
}

export function formatLocation(location?: {
  city: string;
  subdivision?: string;
  country: string;
}): string | undefined {
  if (!location) return undefined;
  return [location.city, location.subdivision].filter(Boolean).join(", ");
}
