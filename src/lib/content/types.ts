import type {
  CadernoData,
  ColecaoData,
  EdicaoData,
  MidiaData,
  PaginaData,
  PessoaData,
  TrabalhoData,
} from "./schemas/collections.ts";

export const COLLECTION_NAMES = [
  "trabalhos",
  "caderno",
  "colecoes",
  "edicoes",
  "midia",
  "pessoas",
  "paginas",
] as const;

export type CollectionName = (typeof COLLECTION_NAMES)[number];
export interface CollectionDataMap {
  trabalhos: TrabalhoData;
  caderno: CadernoData;
  colecoes: ColecaoData;
  edicoes: EdicaoData;
  midia: MidiaData;
  pessoas: PessoaData;
  paginas: PaginaData;
}

export type AnyContentData = CollectionDataMap[CollectionName];

export interface ContentEntry<C extends CollectionName = CollectionName> {
  collection: C;
  id: string;
  filePath: string;
  data: CollectionDataMap[C];
  rawData: Record<string, unknown>;
  body?: string;
}

export type EntryOf<C extends CollectionName> = {
  [K in C]: ContentEntry<K>;
}[C];
export type AnyContentEntry = EntryOf<CollectionName>;

export type ContentDataset = {
  [C in CollectionName]: Array<ContentEntry<C>>;
};

export function emptyDataset(): ContentDataset {
  return {
    trabalhos: [],
    caderno: [],
    colecoes: [],
    edicoes: [],
    midia: [],
    pessoas: [],
    paginas: [],
  };
}
