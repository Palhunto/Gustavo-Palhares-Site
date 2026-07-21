import { loadContentFromDisk } from "../../../src/lib/content/source-loader.ts";
import type {
  ContentDataset,
  ContentEntry,
} from "../../../src/lib/content/types.ts";

export const BUILD_INSTANT = new Date("2026-07-20T13:00:00-03:00");

let validDatasetPromise: Promise<ContentDataset> | undefined;

export async function validDataset(): Promise<ContentDataset> {
  validDatasetPromise ??= loadContentFromDisk(process.cwd());
  return structuredClone(await validDatasetPromise);
}

export function cloneDataset(dataset: ContentDataset): ContentDataset {
  return structuredClone(dataset);
}

function fixtureMedia(dataset: ContentDataset): ContentEntry<"midia"> {
  const entry = dataset.midia.find(
    (candidate) => candidate.id === "fixture-imagem",
  );
  if (!entry)
    throw new Error("fixture-imagem não encontrada no dataset de teste");
  return entry;
}

function noteVariant(
  source: ContentEntry<"caderno">,
  id: string,
  status: ContentEntry<"caderno">["data"]["status"],
  publishAt?: string,
): ContentEntry<"caderno"> {
  const entry = structuredClone(source);
  entry.id = id;
  entry.filePath = `tests/fixtures/content/${id}.md`;
  entry.data.slug = id;
  entry.data.title = `Fixture ${id}`;
  entry.data.translationKey = id;
  entry.data.status = status;
  entry.data.publishAt = publishAt;
  entry.rawData = {
    ...entry.rawData,
    slug: id,
    translationKey: id,
    status,
    publishAt,
  };
  return entry;
}

export function withAllValidStates(dataset: ContentDataset): ContentDataset {
  const result = cloneDataset(dataset);
  const source = result.caderno[0];
  result.caderno.push(
    noteVariant(source, "fixture-draft", "draft"),
    noteVariant(source, "fixture-review", "review"),
    noteVariant(
      source,
      "fixture-agendado-futuro",
      "scheduled",
      "2026-07-21T09:00:00-03:00",
    ),
    noteVariant(
      source,
      "fixture-agendado-vencido",
      "scheduled",
      "2026-07-20T09:30:00-03:00",
    ),
    noteVariant(
      source,
      "fixture-arquivado",
      "archived",
      "2026-07-19T09:00:00-03:00",
    ),
  );
  return result;
}

export interface InvalidScenario {
  name: string;
  expectedCode: string;
  mutate(dataset: ContentDataset): void;
}

export const invalidScenarios: InvalidScenario[] = [
  {
    name: "slug duplicado",
    expectedCode: "slug-duplicate",
    mutate: (dataset) => {
      const duplicate = structuredClone(dataset.trabalhos[0]);
      duplicate.id = "fixture-trabalho-dois";
      duplicate.filePath = "tests/fixtures/content/fixture-trabalho-dois.md";
      duplicate.data.translationKey = "fixture-trabalho-dois";
      duplicate.data.archiveNumber = "GP-2026-0002";
      dataset.trabalhos.push(duplicate);
    },
  },
  {
    name: "referência inexistente",
    expectedCode: "reference-missing",
    mutate: (dataset) =>
      dataset.trabalhos[0].data.relatedWorks.push("nao-existe"),
  },
  {
    name: "tipo de referência incorreto",
    expectedCode: "reference-type",
    mutate: (dataset) =>
      dataset.trabalhos[0].data.relatedWorks.push("fixture-texto"),
  },
  {
    name: "duas edições atuais",
    expectedCode: "current-edition-count",
    mutate: (dataset) => {
      const duplicate = structuredClone(dataset.edicoes[0]);
      duplicate.id = "002";
      duplicate.filePath = "tests/fixtures/content/002.yaml";
      duplicate.data.number = 2;
      duplicate.data.slug = "edicao-002";
      duplicate.data.translationKey = "edicao-002";
      dataset.edicoes.push(duplicate);
    },
  },
  {
    name: "nenhuma edição atual",
    expectedCode: "current-edition-count",
    mutate: (dataset) => {
      dataset.edicoes[0].data.current = false;
    },
  },
  {
    name: "nenhuma edição pública atual em acervo inteiramente privado",
    expectedCode: "current-edition-count",
    mutate: (dataset) => {
      for (const collection of [
        dataset.trabalhos,
        dataset.caderno,
        dataset.colecoes,
        dataset.edicoes,
        dataset.paginas,
      ]) {
        for (const entry of collection) entry.data.status = "draft";
      }
    },
  },
  {
    name: "mídia pending em item público",
    expectedCode: "media-rights",
    mutate: (dataset) => {
      const media = fixtureMedia(dataset);
      media.data.rights.status = "pending";
      media.data.rights.basis = undefined;
    },
  },
  {
    name: "mídia expirada",
    expectedCode: "media-expired",
    mutate: (dataset) => {
      fixtureMedia(dataset).data.rights.expiresAt = "2026-07-20T12:00:00-03:00";
    },
  },
  {
    name: "trabalho sem clearance",
    expectedCode: "work-clearance",
    mutate: (dataset) => {
      dataset.trabalhos[0].data.publicationClearance = "pending";
    },
  },
  {
    name: "crédito fotográfico ausente",
    expectedCode: "photo-credit",
    mutate: (dataset) => {
      dataset.trabalhos[0].data.credits[0].role = "direção";
    },
  },
  {
    name: "alt efetivo ausente",
    expectedCode: "media-alt",
    mutate: (dataset) => {
      fixtureMedia(dataset).data.defaultAlt = "";
    },
  },
  {
    name: "alt efetivo ausente em conteúdo privado",
    expectedCode: "media-alt",
    mutate: (dataset) => {
      dataset.trabalhos[0].data.status = "draft";
      fixtureMedia(dataset).data.defaultAlt = "";
    },
  },
  {
    name: "destaque fora da coleção",
    expectedCode: "featured-membership",
    mutate: (dataset) => {
      dataset.trabalhos[0].data.collections = [];
    },
  },
  {
    name: "destaque fora de circulação em coleção privada",
    expectedCode: "reference-not-circulating",
    mutate: (dataset) => {
      dataset.colecoes[0].data.status = "draft";
      dataset.trabalhos[0].data.status = "archived";
    },
  },
  {
    name: "edição atual com item arquivado",
    expectedCode: "reference-not-circulating",
    mutate: (dataset) => {
      dataset.trabalhos[0].data.status = "archived";
    },
  },
  {
    name: "data incoerente",
    expectedCode: "date-order",
    mutate: (dataset) => {
      dataset.trabalhos[0].data.updatedAt = "2026-07-19T09:00:00-03:00";
    },
  },
  {
    name: "archive number duplicado",
    expectedCode: "archive-duplicate",
    mutate: (dataset) => {
      const duplicate = structuredClone(dataset.trabalhos[0]);
      duplicate.id = "fixture-trabalho-dois";
      duplicate.filePath = "tests/fixtures/content/fixture-trabalho-dois.md";
      duplicate.data.slug = "fixture-trabalho-dois";
      duplicate.data.translationKey = "fixture-trabalho-dois";
      dataset.trabalhos.push(duplicate);
    },
  },
  {
    name: "archive number com ano incorreto",
    expectedCode: "archive-year",
    mutate: (dataset) => {
      dataset.trabalhos[0].data.archiveNumber = "GP-2025-0001";
    },
  },
  {
    name: "tema colidente após normalização",
    expectedCode: "theme-collision",
    mutate: (dataset) => {
      dataset.caderno[0].rawData.themes = ["Validação  técnica"];
    },
  },
];
