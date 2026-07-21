import { describe, expect, it } from "vitest";

import { domainSchemas } from "../../src/lib/content/schemas/collections.ts";
import {
  createMediaUseSchema,
  rightsSchema,
} from "../../src/lib/content/schemas/media.ts";
import {
  historicalDateSchema,
  offsetDateTimeSchema,
  themesSchema,
} from "../../src/lib/content/schemas/shared.ts";

const validWorkFixture: Record<string, unknown> = {
  slug: "fixture-trabalho",
  title: "Fixture técnica de trabalho",
  summary: "Entrada provisória usada para validar o modelo editorial.",
  locale: "pt-BR",
  translationKey: "fixture-trabalho",
  status: "published",
  publishAt: "2026-07-20T09:00:00-03:00",
  archiveNumber: "GP-2026-0001",
  date: "2026-07-20",
  location: {
    city: "Bauru",
    subdivision: "São Paulo",
    country: "Brasil",
  },
  formato: "projeto",
  contexto: "autoral",
  themes: ["validação técnica"],
  collections: ["fixture-colecao"],
  cover: { asset: "fixture-imagem", decorative: false },
  gallery: [
    {
      asset: "fixture-imagem",
      decorative: false,
      altOverride: "Retângulo cinza da fixture técnica.",
    },
  ],
  credits: [{ role: "fotografia", person: "fixture-autor" }],
  publicationClearance: "cleared",
  relatedWorks: [],
};

describe("schemas compartilhados", () => {
  it("aceita datas explícitas e recusa valores ambíguos", () => {
    expect(historicalDateSchema.safeParse("2026-07-20").success).toBe(true);
    expect(historicalDateSchema.safeParse("2026-02-30").success).toBe(false);
    expect(
      offsetDateTimeSchema.safeParse("2026-07-20T09:00:00-03:00").success,
    ).toBe(true);
    expect(offsetDateTimeSchema.safeParse("2026-07-20T09:00:00").success).toBe(
      false,
    );
  });

  it("normaliza temas e rejeita colisões", () => {
    expect(themesSchema.parse(["  Música   ao vivo "])).toEqual([
      "música ao vivo",
    ]);
    expect(themesSchema.safeParse(["Tema", " tema "]).success).toBe(false);
    expect(themesSchema.safeParse(["tema."]).success).toBe(false);
  });

  it("exige basis para direitos cleared", () => {
    expect(
      rightsSchema.safeParse({ status: "cleared", holder: "Titular" }).success,
    ).toBe(false);
    expect(
      rightsSchema.safeParse({
        status: "cleared",
        holder: "Titular",
        basis: "authorship",
      }).success,
    ).toBe(true);
  });

  it("impede sobrescrita de identidade e alt em uso decorativo", () => {
    const mediaUse = createMediaUseSchema(historicalDateSchema);
    expect(
      mediaUse.safeParse({
        asset: "2026-07-20",
        decorative: true,
        altOverride: "Não permitido",
      }).success,
    ).toBe(false);
    expect(
      mediaUse.safeParse({
        asset: "2026-07-20",
        decorative: false,
        width: 100,
      }).success,
    ).toBe(false);
  });

  it("valida intervalos e noindex editorial", () => {
    const work = structuredClone(validWorkFixture);
    work.dateEnd = "2026-07-19";
    expect(domainSchemas.trabalhos.safeParse(work).success).toBe(false);
    delete work.dateEnd;
    work.seo = { noindex: true };
    expect(domainSchemas.trabalhos.safeParse(work).success).toBe(false);
  });
});
