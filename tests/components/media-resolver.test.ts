import type { ImageMetadata } from "astro";
import { describe, expect, it } from "vitest";

import {
  MEDIA_LAYOUTS,
  createMediaResolver,
  parseMediaList,
  type MediaRecord,
} from "../../src/lib/media/resolver.ts";

const source = {
  src: "/fixture.jpg",
  width: 1200,
  height: 800,
  format: "jpg",
} as ImageMetadata;

function record(overrides: Partial<MediaRecord["data"]> = {}): MediaRecord {
  return {
    id: "fixture-imagem",
    data: {
      src: source,
      description: "Descrição factual.",
      defaultAlt: "Alternativa padrão.",
      defaultCaption: "Legenda padrão.",
      credit: { role: "fotografia", name: "Autoria confirmada" },
      rights: { status: "cleared", holder: "Autoria confirmada" },
      ...overrides,
    },
  };
}

describe("resolver central de mídia", () => {
  it("resolve ID, semântica, crédito e política de layout", () => {
    const media = createMediaResolver([record()]).resolve(
      {
        asset: "fixture-imagem",
        altOverride: "Alternativa contextual.",
        captionOverride: "Legenda contextual.",
        crop: { aspectRatio: "16:9", focalPoint: { x: 40, y: 60 } },
      },
      { layout: "lead", priority: true },
    );

    expect(media).toMatchObject({
      id: "fixture-imagem",
      alt: "Alternativa contextual.",
      caption: "Legenda contextual.",
      aspectRatio: "16:9",
      objectPosition: "40% 60%",
      loading: "eager",
      priority: true,
      sizes: MEDIA_LAYOUTS.lead.sizes,
      credit: { role: "fotografia", name: "Autoria confirmada" },
    });
  });

  it("mantém direitos e identidade centrais ao variar apenas apresentação", () => {
    const resolver = createMediaResolver([record()]);
    const first = resolver.resolve("fixture-imagem");
    const second = resolver.resolve({
      asset: "fixture-imagem",
      altOverride: "Outro contexto.",
      crop: { focalPoint: { x: 20, y: 30 } },
    });

    expect(first.credit).toEqual(second.credit);
    expect(first.src).toBe(second.src);
    expect(first.alt).not.toBe(second.alt);
  });

  it("trata decoração sem vazar alternativa e recusa override incoerente", () => {
    const resolver = createMediaResolver([record()]);
    expect(
      resolver.resolve({ asset: "fixture-imagem", decorative: true }).alt,
    ).toBe("");
    expect(() =>
      resolver.resolve({
        asset: "fixture-imagem",
        decorative: true,
        altOverride: "Não permitido",
      }),
    ).toThrow(/decorativa/);
  });

  it("interrompe referência inexistente, caminho direto e direito não liberado", () => {
    const resolver = createMediaResolver([record()]);
    expect(() => resolver.resolve("ausente")).toThrow(/inexistente/);
    expect(() => resolver.resolve("../../foto.jpg")).toThrow(
      /nunca por caminho/,
    );
    expect(() =>
      createMediaResolver([
        record({
          rights: { status: "restricted", holder: "Titular" },
        }),
      ]).resolve("fixture-imagem"),
    ).toThrow(/sem liberação pública/);

    expect(() =>
      createMediaResolver([
        record({
          rights: {
            status: "cleared",
            holder: "Titular",
            expiresAt: "2026-07-19T23:59:59-03:00",
          },
        }),
      ]).resolve("fixture-imagem", {
        at: new Date("2026-07-20T00:00:00-03:00"),
      }),
    ).toThrow(/direitos expirados/);
  });

  it("reserva carregamento eager para mídia prioritária", () => {
    const resolver = createMediaResolver([record()]);
    expect(() =>
      resolver.resolve({ asset: "fixture-imagem", loading: "eager" }),
    ).toThrow(/priority=true/);
    expect(
      resolver.resolve(
        { asset: "fixture-imagem", loading: "eager" },
        { priority: true },
      ).loading,
    ).toBe("eager");
  });

  it("resolve crédito relacionado e valida listas editoriais", () => {
    const media = record({
      credit: { role: "fotografia", person: { id: "fixture-autoria" } },
    });
    const resolver = createMediaResolver(
      [media],
      [
        {
          id: "fixture-autoria",
          data: { name: "Nome central", public: false },
        },
      ],
    );
    expect(resolver.resolve("fixture-imagem").credit.name).toBe("Nome central");
    expect(parseMediaList("um, dois, tres")).toEqual(["um", "dois", "tres"]);
  });
});
