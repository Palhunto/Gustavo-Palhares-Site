import { isEffectivelyPublic, isStandardCirculation } from "./eligibility.ts";
import type { IntegrityIssue } from "./issues.ts";
import { normalizeRole } from "./normalization.ts";
import { effectiveAlt } from "./queries.ts";
import {
  ARCHIVE_NUMBER_PATTERN,
  ID_PATTERN,
  normalizeTheme,
  referenceId,
} from "./schemas/shared.ts";
import type {
  CadernoData,
  EdicaoData,
  TrabalhoData,
} from "./schemas/collections.ts";
import type {
  CollectionName,
  AnyContentEntry,
  ContentDataset,
  ContentEntry,
  EntryOf,
} from "./types.ts";

function entryLabel(entry: AnyContentEntry): string {
  const singular: Record<CollectionName, string> = {
    trabalhos: "Trabalho",
    caderno: "Caderno",
    colecoes: "Coleção",
    edicoes: "Edição",
    midia: "Mídia",
    pessoas: "Pessoa",
    paginas: "Página",
  };
  return `${singular[entry.collection]} "${entry.id}"`;
}

function indexDataset(dataset: ContentDataset): Map<string, AnyContentEntry> {
  const index = new Map<string, AnyContentEntry>();
  for (const [collection, entries] of Object.entries(dataset)) {
    for (const entry of entries as AnyContentEntry[])
      index.set(`${collection}:${entry.id}`, entry);
  }
  return index;
}

function findAny(
  dataset: ContentDataset,
  id: string,
): AnyContentEntry | undefined {
  for (const entries of Object.values(dataset)) {
    const found = (entries as AnyContentEntry[]).find(
      (entry) => entry.id === id,
    );
    if (found) return found;
  }
  return undefined;
}

function effectiveRightsStatus(
  rights: { status: string; expiresAt?: string },
  buildInstant: Date,
): string {
  if (
    rights.expiresAt &&
    Date.parse(rights.expiresAt) <= buildInstant.getTime()
  ) {
    return "expired";
  }
  return rights.status;
}

interface ReferenceCheck {
  source: AnyContentEntry;
  path: string;
  expected: CollectionName;
  value: unknown;
  requirePublic?: boolean;
  requireCirculation?: boolean;
  trace?: string[];
}

export function validateIntegrity(
  dataset: ContentDataset,
  buildInstant: Date,
): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const index = indexDataset(dataset);
  const add = (issue: IntegrityIssue) => issues.push(issue);

  const checkReference = ({
    source,
    path,
    expected,
    value,
    requirePublic = false,
    requireCirculation = false,
    trace,
  }: ReferenceCheck): AnyContentEntry | undefined => {
    const id = referenceId(value);
    if (!id) {
      add({
        code: "reference-invalid",
        path: `${entryLabel(source)} → ${path}`,
        message: "referência sem ID",
        trace,
      });
      return undefined;
    }
    const target = index.get(`${expected}:${id}`);
    if (!target) {
      const other = findAny(dataset, id);
      add({
        code: other ? "reference-type" : "reference-missing",
        path: `${entryLabel(source)} → ${path}`,
        message: other
          ? `esperava ${expected}, mas ${id} pertence a ${other.collection}`
          : `${expected} "${id}" não existe`,
        trace,
      });
      return undefined;
    }
    if (
      requirePublic &&
      "status" in target.data &&
      !isEffectivelyPublic(target.data, buildInstant)
    ) {
      add({
        code: "reference-not-public",
        path: `${entryLabel(source)} → ${path}`,
        message: `${entryLabel(target)} não é elegível no instante do build`,
        trace,
      });
    }
    if (
      requireCirculation &&
      "status" in target.data &&
      !isStandardCirculation(target.data, buildInstant)
    ) {
      add({
        code: "reference-not-circulating",
        path: `${entryLabel(source)} → ${path}`,
        message: `${entryLabel(target)} não está em circulação padrão`,
        trace,
      });
    }
    return target;
  };

  for (const entries of Object.values(dataset)) {
    for (const entry of entries) {
      if (!ID_PATTERN.test(entry.id)) {
        add({
          code: "id-invalid",
          path: entry.filePath,
          message: `ID ${entry.id} não usa kebab-case ASCII`,
        });
      }
    }
  }

  const slugNamespaces: Array<
    Array<EntryOf<"trabalhos" | "caderno" | "colecoes" | "paginas">>
  > = [dataset.trabalhos, dataset.caderno, dataset.colecoes, dataset.paginas];
  for (const entries of slugNamespaces) {
    const slugs = new Map<
      string,
      EntryOf<"trabalhos" | "caderno" | "colecoes" | "paginas">
    >();
    for (const entry of entries) {
      const previous = slugs.get(entry.data.slug);
      if (previous) {
        add({
          code: "slug-duplicate",
          path: `${entryLabel(entry)} → slug`,
          message: `${entry.data.slug} também é usado por ${entryLabel(previous)}`,
        });
      } else slugs.set(entry.data.slug, entry);
    }
  }

  const routes = new Map<
    string,
    EntryOf<"trabalhos" | "caderno" | "colecoes" | "edicoes" | "paginas">
  >();
  const routeFor = (
    entry: EntryOf<
      "trabalhos" | "caderno" | "colecoes" | "edicoes" | "paginas"
    >,
  ): string | undefined => {
    if (entry.collection === "trabalhos")
      return `/trabalhos/${entry.data.slug}`;
    if (entry.collection === "caderno") return `/caderno/${entry.data.slug}`;
    if (entry.collection === "colecoes") return `/colecoes/${entry.data.slug}`;
    if (entry.collection === "edicoes")
      return `/edicoes/${String(entry.data.number).padStart(3, "0")}`;
    if (entry.collection === "paginas") return `/${entry.data.slug}`;
    return undefined;
  };
  for (const entry of [
    ...dataset.trabalhos,
    ...dataset.caderno,
    ...dataset.colecoes,
    ...dataset.edicoes,
    ...dataset.paginas,
  ]) {
    const route = routeFor(entry);
    if (!route) continue;
    const previous = routes.get(route);
    if (previous)
      add({
        code: "route-collision",
        path: entryLabel(entry),
        message: `${route} colide com ${entryLabel(previous)}`,
      });
    else routes.set(route, entry);
  }

  const archiveNumbers = new Map<string, ContentEntry<"trabalhos">>();
  for (const work of dataset.trabalhos) {
    const match = ARCHIVE_NUMBER_PATTERN.exec(work.data.archiveNumber);
    if (match) {
      const sequence = Number(match[2]);
      if (match[1] !== work.data.date.slice(0, 4)) {
        add({
          code: "archive-year",
          path: `${entryLabel(work)} → archiveNumber`,
          message: `${match[1]} deve ser igual ao ano de date (${work.data.date.slice(0, 4)})`,
        });
      }
      if (sequence === 0)
        add({
          code: "archive-sequence",
          path: `${entryLabel(work)} → archiveNumber`,
          message: "NNNN deve ser positivo",
        });
    }
    const previous = archiveNumbers.get(work.data.archiveNumber);
    if (previous)
      add({
        code: "archive-duplicate",
        path: `${entryLabel(work)} → archiveNumber`,
        message: `${work.data.archiveNumber} também é usado por ${entryLabel(previous)}`,
      });
    else archiveNumbers.set(work.data.archiveNumber, work);
  }

  const allEditorial = [
    ...dataset.trabalhos,
    ...dataset.caderno,
    ...dataset.colecoes,
    ...dataset.edicoes,
    ...dataset.paginas,
  ];
  for (const entry of allEditorial) {
    const requiresPublishAt = ["scheduled", "published", "archived"].includes(
      entry.data.status,
    );
    if (requiresPublishAt && !entry.data.publishAt) {
      add({
        code: "publish-date",
        path: `${entryLabel(entry)} → publishAt`,
        message: `obrigatório quando status é ${entry.data.status}`,
      });
    }
    if (
      entry.data.updatedAt &&
      entry.data.publishAt &&
      Date.parse(entry.data.updatedAt) < Date.parse(entry.data.publishAt)
    ) {
      add({
        code: "date-order",
        path: `${entryLabel(entry)} → updatedAt`,
        message: "updatedAt não pode preceder publishAt",
      });
    }
  }
  for (const work of dataset.trabalhos) {
    if (work.data.dateEnd && work.data.dateEnd < work.data.date) {
      add({
        code: "date-order",
        path: `${entryLabel(work)} → dateEnd`,
        message: "dateEnd não pode preceder date",
      });
    }
  }
  const publicCurrent = dataset.edicoes.filter(
    (entry) =>
      entry.data.current && isEffectivelyPublic(entry.data, buildInstant),
  );
  if (publicCurrent.length !== 1) {
    add({
      code: "current-edition-count",
      path: "edicoes",
      message: `esperada exatamente uma edição efetivamente pública e current; encontradas ${publicCurrent.length}`,
    });
  }
  for (const edition of dataset.edicoes.filter((entry) => entry.data.current)) {
    if (!isEffectivelyPublic(edition.data, buildInstant)) {
      add({
        code: "current-edition-private",
        path: `${entryLabel(edition)} → current`,
        message:
          "edição current não pode ser draft, review ou agendamento futuro",
      });
    }
    if (edition.data.status === "archived") {
      add({
        code: "current-edition-archived",
        path: `${entryLabel(edition)} → current`,
        message: "edição current não pode ser archived",
      });
    }
  }

  const validateCredit = (
    source: AnyContentEntry,
    credit: { person?: unknown },
    path: string,
  ) => {
    if (credit.person)
      checkReference({
        source,
        path: `${path}.person`,
        expected: "pessoas",
        value: credit.person,
      });
  };
  for (const media of dataset.midia)
    validateCredit(media, media.data.credit, "credit");
  for (const work of dataset.trabalhos)
    work.data.credits.forEach((credit, indexValue) =>
      validateCredit(work, credit, `credits[${indexValue}]`),
    );
  for (const note of dataset.caderno) {
    note.data.authors.forEach((credit, indexValue) =>
      validateCredit(note, credit, `authors[${indexValue}]`),
    );
    note.data.credits.forEach((credit, indexValue) =>
      validateCredit(note, credit, `credits[${indexValue}]`),
    );
  }

  const validateMediaUse = (
    source: AnyContentEntry,
    use: { asset: unknown; decorative: boolean; altOverride?: string },
    path: string,
    publicUse: boolean,
  ) => {
    const media = checkReference({
      source,
      path: `${path}.asset`,
      expected: "midia",
      value: use.asset,
    });
    if (!media || media.collection !== "midia") return;
    if (publicUse) {
      const status = effectiveRightsStatus(media.data.rights, buildInstant);
      if (status !== "cleared") {
        add({
          code: status === "expired" ? "media-expired" : "media-rights",
          path: `${entryLabel(source)} → ${path}`,
          message: `mídia "${media.id}" possui rights.status efetivo "${status}"`,
          trace: [
            entryLabel(source),
            path,
            `mídia "${media.id}"`,
            `rights.status é "${status}"`,
          ],
        });
      }
    }
    if (!use.decorative && !effectiveAlt(use, media.data)) {
      add({
        code: "media-alt",
        path: `${entryLabel(source)} → ${path}`,
        message: `mídia "${media.id}" não produz alt efetivo`,
      });
    }
  };

  for (const work of dataset.trabalhos) {
    const isPublic = isEffectivelyPublic(work.data, buildInstant);
    validateMediaUse(work, work.data.cover, "cover", isPublic);
    work.data.gallery.forEach((use, indexValue) =>
      validateMediaUse(work, use, `gallery[${indexValue}]`, isPublic),
    );
    work.data.collections.forEach((value, indexValue) =>
      checkReference({
        source: work,
        path: `collections[${indexValue}]`,
        expected: "colecoes",
        value,
        requirePublic: isPublic,
      }),
    );
    work.data.relatedWorks.forEach((value, indexValue) =>
      checkReference({
        source: work,
        path: `relatedWorks[${indexValue}]`,
        expected: "trabalhos",
        value,
        requirePublic: isPublic,
      }),
    );
    if (isPublic && work.data.publicationClearance !== "cleared") {
      add({
        code: "work-clearance",
        path: `${entryLabel(work)} → publicationClearance`,
        message: "trabalho público precisa estar cleared",
      });
    }
    if (
      isPublic &&
      !work.data.credits.some(
        (credit) => normalizeRole(credit.role) === "fotografia",
      )
    ) {
      add({
        code: "photo-credit",
        path: `${entryLabel(work)} → credits`,
        message: "crédito de fotografia é obrigatório",
      });
    }
  }

  for (const note of dataset.caderno) {
    const isPublic = isEffectivelyPublic(note.data, buildInstant);
    if (note.data.cover)
      validateMediaUse(note, note.data.cover, "cover", isPublic);
    note.data.collections.forEach((value, indexValue) =>
      checkReference({
        source: note,
        path: `collections[${indexValue}]`,
        expected: "colecoes",
        value,
        requirePublic: isPublic,
      }),
    );
    note.data.relatedWorks.forEach((value, indexValue) =>
      checkReference({
        source: note,
        path: `relatedWorks[${indexValue}]`,
        expected: "trabalhos",
        value,
        requirePublic: isPublic,
      }),
    );
    note.data.relatedNotebook.forEach((value, indexValue) =>
      checkReference({
        source: note,
        path: `relatedNotebook[${indexValue}]`,
        expected: "caderno",
        value,
        requirePublic: isPublic,
      }),
    );
  }

  for (const collection of dataset.colecoes) {
    const isPublic = isEffectivelyPublic(collection.data, buildInstant);
    if (collection.data.cover)
      validateMediaUse(collection, collection.data.cover, "cover", isPublic);
    collection.data.relatedCollections.forEach((value, indexValue) =>
      checkReference({
        source: collection,
        path: `relatedCollections[${indexValue}]`,
        expected: "colecoes",
        value,
        requirePublic: isPublic,
      }),
    );
    collection.data.featured.forEach((featured, indexValue) => {
      const expected = featured.kind === "trabalho" ? "trabalhos" : "caderno";
      const member = checkReference({
        source: collection,
        path: `featured[${indexValue}].id`,
        expected,
        value: featured.id,
        requireCirculation: true,
      });
      if (
        !member ||
        (member.collection !== "trabalhos" && member.collection !== "caderno")
      )
        return;
      if (
        !member.data.collections.some(
          (value) => referenceId(value) === collection.id,
        )
      ) {
        add({
          code: "featured-membership",
          path: `${entryLabel(collection)} → featured[${indexValue}]`,
          message: `${entryLabel(member)} não declara pertencer à coleção`,
        });
      }
    });
  }

  const validateRelatedContent = (
    edition: ContentEntry<"edicoes">,
    item: { kind: "trabalho" | "caderno"; id: unknown },
    path: string,
    current: boolean,
  ) =>
    checkReference({
      source: edition,
      path,
      expected: item.kind === "trabalho" ? "trabalhos" : "caderno",
      value: item.id,
      requirePublic: !current,
      requireCirculation: current,
      trace: [entryLabel(edition), path],
    });
  for (const edition of dataset.edicoes) {
    const publicEdition = isEffectivelyPublic(edition.data, buildInstant);
    edition.data.blocks.forEach((block, indexValue) => {
      const blockPath = `blocks[${indexValue}]`;
      if (block.type === "hero") {
        validateRelatedContent(
          edition,
          block.content,
          `${blockPath}.content`,
          publicEdition && edition.data.current,
        );
        validateMediaUse(
          edition,
          block.image,
          `${blockPath}.image`,
          publicEdition,
        );
      } else if (block.type === "work-grid") {
        block.works.forEach((value, itemIndex) =>
          checkReference({
            source: edition,
            path: `${blockPath}.works[${itemIndex}]`,
            expected: "trabalhos",
            value,
            requirePublic: publicEdition && !edition.data.current,
            requireCirculation: publicEdition && edition.data.current,
          }),
        );
      } else if (block.type === "notebook-list") {
        block.entries.forEach((value, itemIndex) =>
          checkReference({
            source: edition,
            path: `${blockPath}.entries[${itemIndex}]`,
            expected: "caderno",
            value,
            requirePublic: publicEdition && !edition.data.current,
            requireCirculation: publicEdition && edition.data.current,
          }),
        );
      } else if (block.type === "collection-feature") {
        checkReference({
          source: edition,
          path: `${blockPath}.collection`,
          expected: "colecoes",
          value: block.collection,
          requirePublic: publicEdition && !edition.data.current,
          requireCirculation: publicEdition && edition.data.current,
        });
        block.items.forEach((item, itemIndex) =>
          validateRelatedContent(
            edition,
            item,
            `${blockPath}.items[${itemIndex}]`,
            publicEdition && edition.data.current,
          ),
        );
      }
    });
  }

  for (const page of dataset.paginas) {
    const isPublic = isEffectivelyPublic(page.data, buildInstant);
    if (!["sobre", "contato"].includes(page.id))
      add({
        code: "page-id",
        path: entryLabel(page),
        message: "paginas aceita apenas IDs sobre e contato",
      });
    if (page.id === "sobre" && page.data.pageType !== "about")
      add({
        code: "page-type",
        path: `${entryLabel(page)} → pageType`,
        message: "sobre exige pageType about",
      });
    if (page.id === "contato" && page.data.pageType !== "contact")
      add({
        code: "page-type",
        path: `${entryLabel(page)} → pageType`,
        message: "contato exige pageType contact",
      });
    if (page.data.slug !== page.id)
      add({
        code: "page-slug",
        path: `${entryLabel(page)} → slug`,
        message: "slug institucional deve coincidir com o ID",
      });
    if (page.data.portrait)
      validateMediaUse(page, page.data.portrait, "portrait", isPublic);
  }

  for (const entry of allEditorial) {
    if (entry.data.seo?.socialImage) {
      const media = checkReference({
        source: entry,
        path: "seo.socialImage",
        expected: "midia",
        value: entry.data.seo.socialImage,
      });
      if (
        media?.collection === "midia" &&
        isEffectivelyPublic(entry.data, buildInstant) &&
        effectiveRightsStatus(media.data.rights, buildInstant) !== "cleared"
      ) {
        add({
          code: "seo-media-rights",
          path: `${entryLabel(entry)} → seo.socialImage`,
          message: `mídia "${media.id}" não está cleared`,
        });
      }
    }
  }

  const globalThemes = new Map<string, { raw: string; path: string }>();
  for (const entry of [
    ...dataset.trabalhos,
    ...dataset.caderno,
    ...dataset.colecoes,
  ]) {
    const rawThemes = Array.isArray(entry.rawData.themes)
      ? entry.rawData.themes
      : [];
    rawThemes.forEach((raw, indexValue) => {
      if (typeof raw !== "string") return;
      const normalized = normalizeTheme(raw);
      const previous = globalThemes.get(normalized);
      const pathValue = `${entryLabel(entry)} → themes[${indexValue}]`;
      if (previous && previous.raw !== raw) {
        add({
          code: "theme-collision",
          path: pathValue,
          message: `"${raw}" colide após normalização com "${previous.raw}" em ${previous.path}`,
        });
      } else if (!previous)
        globalThemes.set(normalized, { raw, path: pathValue });
    });
  }

  return issues;
}

export type IntegrityTrabalho = TrabalhoData;
export type IntegrityCaderno = CadernoData;
export type IntegrityEdicao = EdicaoData;
