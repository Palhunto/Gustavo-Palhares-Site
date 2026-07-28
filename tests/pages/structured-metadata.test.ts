import { describe, expect, it } from "vitest";

import { publicRoutes } from "../../src/lib/routes/public.ts";
import {
  createSeoMetadata,
  serializeStructuredData,
  type SocialImageMetadata,
} from "../../src/lib/seo/metadata.ts";
import { normalizeSiteUrl } from "../../src/lib/seo/site-url.ts";
import {
  collectionPageStructuredData,
  creativeWorkStructuredData,
  personStructuredData,
  websiteStructuredData,
  worksIndexStructuredData,
} from "../../src/lib/seo/structured-data.ts";
import { validDataset } from "../fixtures/content/scenarios.ts";
import { PRODUCTION_SITE_URL } from "../fixtures/production-site.ts";

const base = normalizeSiteUrl(PRODUCTION_SITE_URL)!;
const at = new Date("2026-07-27T12:00:00-03:00");
const socialImage: SocialImageMetadata = {
  url: "https://gustavopalhares.com.br/_astro/capa.jpg",
  alt: "Apresentação factual do trabalho",
  width: 1200,
  height: 800,
};

describe("metadata social e dados estruturados da Fase 5C-B", () => {
  it("não fabrica URLs nem dados dependentes de domínio sem SITE_URL", () => {
    const metadata = createSeoMetadata({
      pathname: publicRoutes.home,
      siteUrl: "",
      socialImage: { ...socialImage, url: "/_astro/capa.jpg" },
    });
    expect(metadata.canonical).toBeUndefined();
    expect(metadata.socialImage).toBeUndefined();
    expect(websiteStructuredData(undefined)).toBeUndefined();
    expect(personStructuredData(undefined)).toBeUndefined();
  });

  it("valida o contrato factual das imagens sociais", () => {
    expect(() =>
      createSeoMetadata({
        pathname: publicRoutes.home,
        siteUrl: base.href,
        socialImage: { ...socialImage, alt: "" },
      }),
    ).toThrow(/alternativo/);
    expect(() =>
      createSeoMetadata({
        pathname: publicRoutes.home,
        siteUrl: base.href,
        socialImage: { ...socialImage, height: undefined },
      }),
    ).toThrow(/Dimensões sociais/);
  });

  it("escapa JSON-LD antes da inserção inline", () => {
    expect(serializeStructuredData({ value: "</script>\u2028" })).toBe(
      '{"value":"\\u003c/script>\\u2028"}',
    );
  });

  it("gera WebSite e Person mínimos, sem inferir dados pessoais", () => {
    expect(websiteStructuredData(base)).toMatchObject({
      "@type": "WebSite",
      name: "Gustavo Palhares",
      url: "https://gustavopalhares.com.br/",
      inLanguage: "pt-BR",
    });
    const person = personStructuredData(base) as Record<string, unknown>;
    expect(person).toMatchObject({
      "@type": "Person",
      name: "Gustavo Palhares",
      url: "https://gustavopalhares.com.br/sobre/",
      sameAs: ["https://www.instagram.com/gustavopalharess/"],
    });
    for (const inferred of ["email", "telephone", "address", "birthDate"]) {
      expect(person).not.toHaveProperty(inferred);
    }
  });

  it("gera CreativeWork somente para os quatro trabalhos públicos elegíveis", async () => {
    const dataset = await validDataset();
    const publicWorks = dataset.trabalhos.filter((entry) =>
      [
        "kauan-felix-uma-noite-de-k-1",
        "nephillin-uma-cobertura-sem-credencial",
        "magma",
        "feira-do-rolo",
      ].includes(entry.id),
    );
    const documents = publicWorks.map((entry) =>
      creativeWorkStructuredData(entry, at, base, socialImage),
    ) as Record<string, unknown>[];
    expect(documents).toHaveLength(4);
    expect(documents.map((document) => document["@type"])).toEqual([
      "CreativeWork",
      "CreativeWork",
      "CreativeWork",
      "CreativeWork",
    ]);
    expect(documents.map((document) => document.identifier)).toEqual(
      expect.arrayContaining([
        "GP-2026-0003",
        "GP-2026-0002",
        "GP-2025-0002",
        "GP-2025-0001",
      ]),
    );
    expect(
      documents.every(
        (document) =>
          typeof document.url === "string" &&
          document.url.startsWith("https://gustavopalhares.com.br/trabalhos/"),
      ),
    ).toBe(true);

    const fixture = dataset.trabalhos.find(
      (entry) => entry.id === "fixture-trabalho",
    )!;
    expect(() => creativeWorkStructuredData(fixture, at, base)).toThrow(
      /inelegível/,
    );
  });

  it("descreve o índice ordenado e não cria ItemList para famílias vazias", async () => {
    const dataset = await validDataset();
    const works = dataset.trabalhos
      .filter((entry) => entry.id !== "fixture-trabalho")
      .sort((a, b) => b.data.date.localeCompare(a.data.date));
    const index = worksIndexStructuredData(
      works,
      at,
      base,
      "Trabalhos publicados.",
    ) as Record<string, unknown>;
    const graph = index["@graph"] as Record<string, unknown>[];
    const list = graph.find((node) => node["@type"] === "ItemList")!;
    const items = list.itemListElement as Array<Record<string, unknown>>;
    expect(list.numberOfItems).toBe(4);
    expect(items.map((item) => item.position)).toEqual([1, 2, 3, 4]);

    const emptyFamily = collectionPageStructuredData(
      base,
      publicRoutes.cadernoIndex,
      "Caderno",
      "Nenhuma entrada publicada.",
    ) as Record<string, unknown>;
    expect(emptyFamily["@type"]).toBe("CollectionPage");
    expect(JSON.stringify(emptyFamily)).not.toContain("ItemList");
  });
});
