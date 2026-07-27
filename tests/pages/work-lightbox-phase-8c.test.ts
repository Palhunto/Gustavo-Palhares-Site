import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

import {
  FEIRA_WORK_TIMELINES,
  NEPHILLIN_WORK_TIMELINES,
  WORK_LIGHTBOX_TIMELINE,
} from "../../src/lib/motion/config.ts";
import {
  isLightboxActivationEligible,
  lightboxNavigationState,
} from "../../src/lib/lightbox/work-lightbox.ts";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Fase 8C — lightbox editorial das páginas de trabalhos", () => {
  it("ativa somente as duas sequências editoriais elegíveis", async () => {
    const layout = await source("src/layouts/WorkLayout.astro");
    const route = await source("src/pages/trabalhos/[slug].astro");
    const feira = await source("src/content/trabalhos/feira-do-rolo.mdx");
    const nephillin = await source(
      "src/content/trabalhos/nephillin-uma-cobertura-sem-credencial.mdx",
    );

    expect(route).toContain(
      'entry.id === "nephillin-uma-cobertura-sem-credencial"',
    );
    expect(route).toContain('entry.id === "feira-do-rolo"');
    expect(layout).toContain("lightbox={Boolean(motion)}");
    expect(layout).toContain("motion && <WorkLightbox");
    expect(feira.match(/\blightbox\b/g)).toHaveLength(2);
    expect(nephillin.match(/\blightbox\b/g)).toHaveLength(3);
    expect(feira).toContain('numbers="02,03"');
    expect(feira).toContain('numbers="04,05,06,07,08,09"');
    expect(nephillin).toContain('numbers="02,03"');
    expect(nephillin).toContain('numbers="04,05,06"');
    expect(nephillin).toContain('numbers="07,08"');
  });

  it("mantém cada fotografia como link nativo para mídia otimizada", async () => {
    const picture = await source(
      "src/components/editorial/_MediaPicture.astro",
    );

    expect(picture).toContain("await getImage({");
    expect(picture).toContain("Math.min(media.src.width, 1920)");
    expect(picture).toContain('format: "webp"');
    expect(picture).toContain("href={lightboxImage.src}");
    expect(picture).toContain("data-work-lightbox-link");
    expect(picture).toContain("lightboxImage && lightboxNumber");
    expect(picture).not.toMatch(/target=["']_self|download=/);
    expect(picture).not.toContain("view-transition-name");
  });

  it("renderiza um único dialog com controles nomeados", async () => {
    const component = await source(
      "src/components/editorial/WorkLightbox.astro",
    );

    expect(component.match(/<dialog\b/g)).toHaveLength(1);
    expect(component).toContain('aria-labelledby="work-lightbox-title"');
    expect(component).toContain('aria-label="Fechar visualização ampliada"');
    expect(component).toContain('aria-label="Fotografia anterior"');
    expect(component).toContain('aria-label="Próxima fotografia"');
    expect(component).toContain('aria-label="Navegação de imagens"');
    expect(component).toContain("data-work-lightbox-current");
    expect(component).toContain("data-work-lightbox-total");
  });

  it("preserva modificadores, menu de contexto e abertura em nova aba", () => {
    const base = {
      altKey: false,
      button: 0,
      ctrlKey: false,
      defaultPrevented: false,
      metaKey: false,
      shiftKey: false,
    };

    expect(isLightboxActivationEligible(base)).toBe(true);
    expect(isLightboxActivationEligible({ ...base, ctrlKey: true })).toBe(
      false,
    );
    expect(isLightboxActivationEligible({ ...base, metaKey: true })).toBe(
      false,
    );
    expect(isLightboxActivationEligible({ ...base, shiftKey: true })).toBe(
      false,
    );
    expect(isLightboxActivationEligible({ ...base, button: 1 })).toBe(false);
    expect(
      isLightboxActivationEligible({ ...base, defaultPrevented: true }),
    ).toBe(false);
  });

  it("implementa teclado e limites sem navegação circular", async () => {
    const lightbox = await source("src/lib/lightbox/work-lightbox.ts");

    expect(lightboxNavigationState(0, 9)).toEqual({
      canGoPrevious: false,
      canGoNext: true,
    });
    expect(lightboxNavigationState(8, 9)).toEqual({
      canGoPrevious: true,
      canGoNext: false,
    });
    for (const key of [
      '"ArrowLeft"',
      '"ArrowRight"',
      '"Home"',
      '"End"',
      '"Escape"',
    ]) {
      expect(lightbox).toContain(key);
    }
    expect(lightbox).toContain("previous.disabled = !state.canGoPrevious");
    expect(lightbox).toContain("next.disabled = !state.canGoNext");
    expect(lightbox).not.toMatch(/currentIndex\s*%\s*links\.length/);
  });

  it("restaura foco e posição e mantém o foco contido pelo dialog nativo", async () => {
    const lightbox = await source("src/lib/lightbox/work-lightbox.ts");
    const component = await source(
      "src/components/editorial/WorkLightbox.astro",
    );

    expect(lightbox).toContain("dialog.showModal()");
    expect(lightbox).toContain("window.scrollTo(snapshot.scrollX");
    expect(lightbox).toContain("opener.focus()");
    expect(lightbox).toContain('body.style.position = "fixed"');
    expect(lightbox).toContain("restoreStyleAttribute(document.body");
    expect(component).toContain("autofocus");
  });

  it("usa o GSAP compartilhado com movimento curto e redução imediata", async () => {
    const lightbox = await source("src/lib/lightbox/work-lightbox.ts");

    expect(WORK_LIGHTBOX_TIMELINE.duration.backdropIn).toBeGreaterThanOrEqual(
      0.18,
    );
    expect(WORK_LIGHTBOX_TIMELINE.duration.backdropIn).toBeLessThanOrEqual(
      0.22,
    );
    expect(WORK_LIGHTBOX_TIMELINE.duration.imageIn).toBeGreaterThanOrEqual(
      0.28,
    );
    expect(WORK_LIGHTBOX_TIMELINE.duration.imageIn).toBeLessThanOrEqual(0.36);
    expect(WORK_LIGHTBOX_TIMELINE.duration.swapIn).toBeGreaterThanOrEqual(0.16);
    expect(WORK_LIGHTBOX_TIMELINE.duration.swapIn).toBeLessThanOrEqual(0.22);
    expect(WORK_LIGHTBOX_TIMELINE.duration.exit).toBeLessThan(
      WORK_LIGHTBOX_TIMELINE.duration.backdropIn,
    );
    expect(WORK_LIGHTBOX_TIMELINE.scale.imageIn).toBe(0.985);
    expect(lightbox).toContain('from "../motion/gsap.ts"');
    expect(lightbox).not.toMatch(/from\s+["']gsap/);
    expect(lightbox).toContain("prefersReducedMotion()");
  });

  it("pré-carrega somente vizinhas e remove estado temporário no cleanup", async () => {
    const lightbox = await source("src/lib/lightbox/work-lightbox.ts");

    expect(lightbox).toContain("currentIndex - 1");
    expect(lightbox).toContain("currentIndex + 1");
    expect(lightbox).toContain("clearPreloads()");
    expect(lightbox).toContain('preload.removeAttribute("src")');
    expect(lightbox).toContain("activeLightboxes.get(root)?.()");
    expect(lightbox).toContain("activeLightboxes.delete(root)");
    expect(lightbox).toContain("root.removeEventListener");
    expect(lightbox).toContain("finishClose(false)");
  });

  it("mantém imagem inteira, controles de 44 px e safe areas no mobile", async () => {
    const styles = await source("src/styles/components.css");

    expect(styles).toContain(".work-lightbox__image");
    expect(styles).toContain("object-fit: contain");
    expect(styles).toContain("min-inline-size: 2.75rem");
    expect(styles).toContain("min-block-size: 2.75rem");
    expect(styles).toContain("env(safe-area-inset-top)");
    expect(styles).toContain("env(safe-area-inset-bottom)");
    expect(styles).toContain("html.work-lightbox-open");
  });

  it("não altera os contratos de movimento das Fases 8B1 e 8B2", async () => {
    const nephillin = await source("src/lib/motion/nephillin-work.ts");
    const feira = await source("src/lib/motion/feira-work.ts");
    const wrapper = await source("src/components/editorial/LeadImage.astro");

    expect(NEPHILLIN_WORK_TIMELINES.intro.duration.title).toBe(0.96);
    expect(FEIRA_WORK_TIMELINES.intro.duration.title).toBe(0.84);
    expect(nephillin).not.toContain("initializeWorkLightbox");
    expect(feira).not.toContain("initializeWorkLightbox");
    expect(wrapper).toContain("work-cover-transition-frame");
    expect(wrapper).toContain("view-transition-name:");
  });

  it("mantém componentes e layout Astro compiláveis", async () => {
    for (const file of [
      "src/components/editorial/_MediaPicture.astro",
      "src/components/editorial/LeadImage.astro",
      "src/components/editorial/Diptych.astro",
      "src/components/editorial/Triptych.astro",
      "src/components/editorial/ContactSheet.astro",
      "src/components/editorial/WorkLightbox.astro",
      "src/layouts/WorkLayout.astro",
    ]) {
      await expect(
        source(file).then((value) =>
          transform(value, { filename: path.basename(file) }),
        ),
      ).resolves.toHaveProperty("code");
    }
  });
});
