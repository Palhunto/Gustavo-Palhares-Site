import { describe, expect, it } from "vitest";

import { siteConfig } from "../../src/config/site.ts";
import { publicRoutes } from "../../src/lib/routes/public.ts";
import { createSeoMetadata } from "../../src/lib/seo/metadata.ts";
import {
  absoluteCanonicalUrl,
  normalizeSiteUrl,
  requirePublicSiteUrl,
} from "../../src/lib/seo/site-url.ts";

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
    const withoutBase = createSeoMetadata({
      pathname: publicRoutes.sobre,
      siteUrl: "",
    });
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

  it("normaliza somente bases HTTP(S) e protege o gate público", () => {
    expect(normalizeSiteUrl("http://publicacao.dev///")?.href).toBe(
      "http://publicacao.dev/",
    );
    expect(normalizeSiteUrl("https://publicacao.dev/base//")?.href).toBe(
      "https://publicacao.dev/base/",
    );
    expect(() => normalizeSiteUrl("ftp://publicacao.dev")).toThrow(/HTTP/);
    expect(() => normalizeSiteUrl("não é URL")).toThrow(/SITE_URL inválida/);

    expect(() => requirePublicSiteUrl("")).toThrow(/obrigatória/);
    for (const value of [
      "https://preview.test",
      "https://preview.invalid",
      "https://preview.example",
      "http://localhost:4321",
      "http://127.0.0.1:4321",
      "http://192.168.1.10",
      "http://100.64.0.1",
      "http://[::1]",
    ]) {
      expect(() => requirePublicSiteUrl(value), value).toThrow(
        /inválida para build público/,
      );
    }
    expect(requirePublicSiteUrl("https://publicacao.dev").href).toBe(
      "https://publicacao.dev/",
    );
  });

  it("usa a base técnica somente quando injetada e mantém a barra canônica", () => {
    const technical = normalizeSiteUrl("https://preview.test");
    expect(technical).toBeDefined();
    expect(absoluteCanonicalUrl("/sobre//", technical!)).toBe(
      "https://preview.test/sobre/",
    );
    expect(() => absoluteCanonicalUrl("/sobre/#equipe", technical!)).toThrow(
      /fragmento/,
    );
    expect(
      createSeoMetadata({
        pathname: "/404/",
        siteUrl: "https://preview.test",
        canonical: false,
      }).canonical,
    ).toBeUndefined();
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
