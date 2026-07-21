import { describe, expect, it } from "vitest";

import { siteConfig } from "../../src/config/site.ts";
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
      "/",
      "/sobre",
      "/contato",
    ]);
    expect(siteConfig.contacts).toEqual([]);
  });

  it("não produz canonical sem URL-base confirmada", () => {
    const withoutBase = createSeoMetadata({ pathname: "/sobre" });
    expect(withoutBase.canonical).toBeUndefined();
    expect(withoutBase.socialImage).toBeUndefined();

    const withBase = createSeoMetadata({
      pathname: "/sobre",
      siteUrl: "https://example.test",
      socialImage: "/social.jpg",
    });
    expect(withBase.canonical).toBe("https://example.test/sobre");
    expect(withBase.socialImage).toBe("https://example.test/social.jpg");
  });
});
