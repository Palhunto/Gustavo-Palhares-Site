import { describe, expect, it } from "vitest";

import { siteConfig } from "../../src/config/site.ts";
import { publicRoutes } from "../../src/lib/routes/public.ts";
import { createSeoMetadata } from "../../src/lib/seo/metadata.ts";

describe("configuração pública global", () => {
  it("centraliza somente identidade e rotas confirmadas", () => {
    expect(siteConfig).toMatchObject({
      name: "Gustavo Palhares",
      shortIdentity: "Publicação digital pessoal",
      locale: "pt-BR",
      homepageStatus: "provisional",
    });
    expect(siteConfig.navigation.map((item) => item.href)).toEqual([
      "/trabalhos/",
      "/caderno/",
      "/colecoes/",
      "/sobre/",
      "/contato/",
    ]);
    expect(siteConfig.footerNavigation.map((item) => item.href)).toEqual([
      "/edicoes/",
    ]);
    expect(siteConfig.contacts).toEqual([]);
  });

  it("não produz canonical sem URL-base confirmada", () => {
    const withoutBase = createSeoMetadata({ pathname: publicRoutes.sobre });
    expect(withoutBase.canonical).toBeUndefined();
    expect(withoutBase.socialImage).toBeUndefined();

    const withBase = createSeoMetadata({
      pathname: publicRoutes.sobre,
      siteUrl: "https://example.test",
      socialImage: "/social.jpg",
    });
    expect(withBase.canonical).toBe("https://example.test/sobre/");
    expect(withBase.socialImage).toBe("https://example.test/social.jpg");
  });

  it("produz rotas absolutas com exatamente uma barra final", () => {
    expect(publicRoutes).toMatchObject({
      home: "/",
      trabalhosIndex: "/trabalhos/",
      cadernoIndex: "/caderno/",
      colecoesIndex: "/colecoes/",
      edicoesIndex: "/edicoes/",
      sobre: "/sobre/",
      contato: "/contato/",
    });
    expect(publicRoutes.trabalho("feira-do-rolo")).toBe(
      "/trabalhos/feira-do-rolo/",
    );
    expect(publicRoutes.caderno("notas-de-campo")).toBe(
      "/caderno/notas-de-campo/",
    );
    expect(publicRoutes.colecao("arquivo-pessoal")).toBe(
      "/colecoes/arquivo-pessoal/",
    );
    expect(publicRoutes.edicao(1)).toBe("/edicoes/001/");
    expect(() => publicRoutes.trabalho("/slug/")).toThrow(/inválido/);
    expect(() => publicRoutes.caderno("dois//segmentos")).toThrow(/inválido/);
    expect(() => publicRoutes.colecao("../relativo")).toThrow(/inválido/);
  });
});
