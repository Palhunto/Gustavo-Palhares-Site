const EDITORIAL_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EDITION_SEGMENT = /^\d+$/;

export type PublicPath = "/" | `/${string}/`;

function validSegment(
  value: string,
  label: string,
  pattern = EDITORIAL_SEGMENT,
): string {
  if (!pattern.test(value)) {
    throw new Error(`${label} inválido para rota pública: ${value}`);
  }
  return value;
}

function internalPath(...segments: readonly string[]): PublicPath {
  if (segments.length === 0) return "/";
  return `/${segments.join("/")}/`;
}

export const publicRoutes = {
  home: internalPath(),
  trabalhosIndex: internalPath("trabalhos"),
  trabalho: (slug: string) =>
    internalPath("trabalhos", validSegment(slug, "slug de trabalho")),
  cadernoIndex: internalPath("caderno"),
  caderno: (slug: string) =>
    internalPath("caderno", validSegment(slug, "slug do Caderno")),
  colecoesIndex: internalPath("colecoes"),
  colecao: (slug: string) =>
    internalPath("colecoes", validSegment(slug, "slug de coleção")),
  edicoesIndex: internalPath("edicoes"),
  edicao: (number: number | string) => {
    const normalized =
      typeof number === "number" ? String(number).padStart(3, "0") : number;
    return internalPath(
      "edicoes",
      validSegment(normalized, "número de edição", EDITION_SEGMENT),
    );
  },
  sobre: internalPath("sobre"),
  contato: internalPath("contato"),
} as const;
