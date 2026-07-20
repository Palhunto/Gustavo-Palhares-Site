import {
  isArchived,
  isEffectivelyPublic,
  isHomepageEligible,
  isRssEligible,
  isSearchEligible,
  isSitemapEligible,
  isStandardCirculation,
} from "./eligibility.ts";
import { referenceId } from "./schemas/shared.ts";
import type {
  CadernoData,
  ColecaoData,
  EdicaoData,
  MidiaData,
  PessoaData,
  TrabalhoData,
} from "./schemas/collections.ts";
import type { CollectionName, ContentDataset, ContentEntry } from "./types.ts";

type EditorialEntry = ContentEntry<
  "trabalhos" | "caderno" | "colecoes" | "edicoes" | "paginas"
>;

function editorialEntries(dataset: ContentDataset): EditorialEntry[] {
  return [
    ...dataset.trabalhos,
    ...dataset.caderno,
    ...dataset.colecoes,
    ...dataset.edicoes,
    ...dataset.paginas,
  ];
}

export function getEffectivelyPublic(
  dataset: ContentDataset,
  buildInstant: Date,
): EditorialEntry[] {
  return editorialEntries(dataset).filter((entry) =>
    isEffectivelyPublic(entry.data, buildInstant),
  );
}

export function getStandardCirculation(
  dataset: ContentDataset,
  buildInstant: Date,
): EditorialEntry[] {
  return editorialEntries(dataset).filter((entry) =>
    isStandardCirculation(entry.data, buildInstant),
  );
}

export function getHomepageEntries(
  dataset: ContentDataset,
  buildInstant: Date,
): EditorialEntry[] {
  return editorialEntries(dataset).filter((entry) =>
    isHomepageEligible(entry.data, buildInstant),
  );
}

export function getSitemapEntries(
  dataset: ContentDataset,
  buildInstant: Date,
): EditorialEntry[] {
  return editorialEntries(dataset).filter((entry) =>
    isSitemapEligible(entry.data, buildInstant),
  );
}

export function getSearchEntries(
  dataset: ContentDataset,
  buildInstant: Date,
): EditorialEntry[] {
  return editorialEntries(dataset).filter((entry) =>
    isSearchEligible(entry.data, buildInstant),
  );
}

export function getArchived(dataset: ContentDataset): EditorialEntry[] {
  return editorialEntries(dataset).filter((entry) => isArchived(entry.data));
}

export function getCurrentEdition(
  dataset: ContentDataset,
  buildInstant: Date,
): ContentEntry<"edicoes"> | undefined {
  return dataset.edicoes.find(
    (entry) =>
      entry.data.current && isHomepageEligible(entry.data, buildInstant),
  );
}

export function getCollectionMembers(
  dataset: ContentDataset,
  collectionId: string,
): Array<ContentEntry<"trabalhos"> | ContentEntry<"caderno">> {
  return [...dataset.trabalhos, ...dataset.caderno].filter((entry) =>
    entry.data.collections.some((value) => referenceId(value) === collectionId),
  );
}

export function getValidatedHighlights(
  dataset: ContentDataset,
  collection: ContentEntry<"colecoes">,
  buildInstant: Date,
): Array<ContentEntry<"trabalhos"> | ContentEntry<"caderno">> {
  const members = getCollectionMembers(dataset, collection.id);
  const byKey = new Map(
    members.map((entry) => [`${entry.collection}:${entry.id}`, entry]),
  );
  return collection.data.featured.flatMap((featured) => {
    const id = referenceId(featured.id);
    if (!id) return [];
    const entry = byKey.get(
      `${featured.kind === "trabalho" ? "trabalhos" : "caderno"}:${id}`,
    );
    return entry && isStandardCirculation(entry.data, buildInstant)
      ? [entry]
      : [];
  });
}

export function getRelatedContent(
  dataset: ContentDataset,
  entry: ContentEntry<"trabalhos"> | ContentEntry<"caderno">,
): Array<ContentEntry<"trabalhos"> | ContentEntry<"caderno">> {
  const results: Array<ContentEntry<"trabalhos"> | ContentEntry<"caderno">> =
    [];
  const works = entry.data.relatedWorks;
  for (const value of works) {
    const id = referenceId(value);
    const related = dataset.trabalhos.find((candidate) => candidate.id === id);
    if (related) results.push(related);
  }
  if (entry.collection === "caderno") {
    for (const value of entry.data.relatedNotebook) {
      const id = referenceId(value);
      const related = dataset.caderno.find((candidate) => candidate.id === id);
      if (related) results.push(related);
    }
  }
  return results;
}

export function getRssEntries(
  dataset: ContentDataset,
  buildInstant: Date,
): Array<ContentEntry<"trabalhos"> | ContentEntry<"caderno">> {
  return [...dataset.trabalhos, ...dataset.caderno].filter((entry) =>
    isRssEligible(entry.data, buildInstant),
  );
}

export function resolveMedia(
  dataset: ContentDataset,
  value: unknown,
): ContentEntry<"midia"> | undefined {
  const id = referenceId(value);
  return dataset.midia.find((entry) => entry.id === id);
}

export function resolvePerson(
  dataset: ContentDataset,
  value: unknown,
): ContentEntry<"pessoas"> | undefined {
  const id = referenceId(value);
  return dataset.pessoas.find((entry) => entry.id === id);
}

export function resolveCredit(
  dataset: ContentDataset,
  credit: { person?: unknown; name?: string; role: string },
):
  { role: string; name: string; person?: ContentEntry<"pessoas"> } | undefined {
  if (credit.name) return { role: credit.role, name: credit.name };
  const person = resolvePerson(dataset, credit.person);
  return person
    ? { role: credit.role, name: person.data.name, person }
    : undefined;
}

export function effectiveAlt(
  use: { decorative: boolean; altOverride?: string; asset: unknown },
  media: MidiaData | undefined,
): string {
  if (use.decorative) return "";
  return use.altOverride?.trim() || media?.defaultAlt.trim() || "";
}

export type ResolvableData =
  | TrabalhoData
  | CadernoData
  | ColecaoData
  | EdicaoData
  | MidiaData
  | PessoaData;

export function findEntry<C extends CollectionName>(
  dataset: ContentDataset,
  collection: C,
  id: string,
): ContentEntry<C> | undefined {
  return dataset[collection].find((entry) => entry.id === id);
}
