import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

import {
  HOME_COVER_TIMELINE,
  MOTION_TOKENS,
} from "../../src/lib/motion/config.ts";
import { shouldPresentHomeCoverImmediately } from "../../src/lib/motion/home-cover.ts";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Fase 7B1 — coreografia de abertura da capa", () => {
  it("carrega o módulo somente na homepage e preserva o layout global", async () => {
    const homepage = await source("src/pages/index.astro");
    const globalLayout = await source("src/layouts/BaseLayout.astro");
    const otherPublicPages = await Promise.all(
      [
        "src/pages/caderno/index.astro",
        "src/pages/colecoes/index.astro",
        "src/pages/contato.astro",
        "src/pages/edicoes/index.astro",
        "src/pages/sobre.astro",
        "src/pages/trabalhos/index.astro",
        "src/pages/trabalhos/[slug].astro",
      ].map(source),
    );

    const orchestrator = await source("src/lib/motion/homepage.ts");

    expect(homepage).toContain("initializeHomepageMotion");
    expect(homepage).toContain('from "../lib/motion/homepage.ts"');
    expect(orchestrator).toContain("initializeHomeCoverMotion");
    expect(orchestrator).toContain('from "./home-cover.ts"');
    expect(globalLayout).not.toMatch(/gsap|lib\/motion|<script/i);
    expect(otherPublicPages.join("\n")).not.toMatch(
      /gsap|ScrollTrigger|lib\/motion/i,
    );
  });

  it("mantém conteúdo, imagem e links nativos no HTML inicial", async () => {
    const cover = await source("src/components/home/HomeCover.astro");

    expect(cover.match(/<h1\b/g)).toHaveLength(1);
    expect(cover).toContain("homepageEditorialCopy.coverLabel");
    expect(cover).toContain("homepageEditorialCopy.coverStatus");
    expect(cover).toContain("homepageEditorialCopy.coverPlaceholder");
    expect(cover).toContain("<EditorialImage");
    expect(cover).toContain('href="#trabalhos"');
    expect(cover).toContain(
      "publicRoutes.trabalho(model.cover.work.data.slug)",
    );
    expect(cover).not.toMatch(/on:click|onclick|preventDefault/);
    await expect(
      transform(cover, { filename: "HomeCover.astro" }),
    ).resolves.toHaveProperty("code");
  });

  it("reutiliza o ritmo aprovado e fecha uma timeline sobreposta de 1,44 s", () => {
    expect(MOTION_TOKENS.headline).toEqual({
      duration: 0.84,
      stagger: { compact: 0.14, regular: 0.15 },
      yPercent: { compact: 78, regular: 104 },
    });
    expect(MOTION_TOKENS.easing.editorial).toBe("power3.out");
    expect(HOME_COVER_TIMELINE.totalDuration).toBe(1.44);
    expect(
      HOME_COVER_TIMELINE.at.headline +
        MOTION_TOKENS.headline.stagger.regular +
        MOTION_TOKENS.headline.duration,
    ).toBeCloseTo(1.17);
    expect(
      HOME_COVER_TIMELINE.at.scroll + HOME_COVER_TIMELINE.duration.scroll,
    ).toBe(HOME_COVER_TIMELINE.totalDuration);
  });

  it("usa clipping e estados transitórios somente pelo módulo", async () => {
    const cover = await source("src/components/home/HomeCover.astro");
    const styles = await source("src/styles/site.css");
    const motion = await source("src/lib/motion/home-cover.ts");
    const homepageStyles = styles.slice(
      styles.indexOf("/* Homepage editorial:"),
    );

    expect(cover).toContain('class="home-cover__title-clip"');
    expect(homepageStyles).toMatch(
      /\.home-cover__title-clip\s*\{[^}]*overflow:\s*hidden/s,
    );
    expect(homepageStyles).toMatch(
      /\.home-cover__title-clip\s*\{[^}]*margin-block-start:\s*-0\.12em;[^}]*padding-block-start:\s*0\.12em/s,
    );
    expect(homepageStyles).not.toMatch(/opacity\s*:\s*0/);
    expect(homepageStyles).not.toMatch(/visibility\s*:\s*hidden/);
    expect(motion).toContain("gsap.timeline");
    expect(motion).toContain("scaleX: 0");
    expect(motion).toContain("clipPath: MOTION_TOKENS.image.initialClip");
    expect(motion).not.toMatch(/SplitText|parallax|scrollTo\(|smooth/i);
  });

  it("limita microinterações da capa a hover real, foco e movimento reduzido", async () => {
    const styles = await source("src/styles/site.css");
    const homepageStyles = styles.slice(
      styles.indexOf("/* Homepage editorial:"),
    );

    expect(homepageStyles).toContain(
      "--home-cover-interaction-duration: 180ms",
    );
    expect(homepageStyles).toContain(
      "@media (hover: hover) and (pointer: fine)",
    );
    expect(homepageStyles).toContain(".home-cover__enter:hover::after");
    expect(homepageStyles).toContain(".home-cover__scroll:hover::after");
    expect(homepageStyles).toContain(".home-cover__rail-item a:hover::after");
    expect(homepageStyles).toContain("translateY(0.22rem)");
    expect(homepageStyles).toContain(
      ".home-cover__rail-item a:focus-visible::after",
    );
    expect(homepageStyles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("entrega estado final para hash, scroll restaurado e histórico", () => {
    expect(
      shouldPresentHomeCoverImmediately({
        hash: "#trabalhos",
        scrollY: 0,
        navigationType: "navigate",
      }),
    ).toBe(true);
    expect(
      shouldPresentHomeCoverImmediately({
        hash: "",
        scrollY: 320,
        navigationType: "reload",
      }),
    ).toBe(true);
    expect(
      shouldPresentHomeCoverImmediately({
        hash: "",
        scrollY: 0,
        navigationType: "back_forward",
      }),
    ).toBe(true);
    expect(
      shouldPresentHomeCoverImmediately({
        hash: "#capa",
        scrollY: 0,
        navigationType: "navigate",
      }),
    ).toBe(false);
  });

  it("preserva redução de movimento, cleanup e escopo exclusivo da capa", async () => {
    const homepageMotion = await source("src/lib/motion/home-cover.ts");
    const lifecycle = await source("src/lib/motion/lifecycle.ts");
    const sections = await Promise.all(
      ["HomeWorks", "HomePresence", "HomeIndex"].map((component) =>
        source(`src/components/home/${component}.astro`),
      ),
    );

    expect(homepageMotion).toContain("prefersReducedMotion()");
    expect(homepageMotion).toContain('removeAttribute("style")');
    expect(homepageMotion).toContain('homeCoverPresented = "true"');
    expect(lifecycle).toContain('root.dataset.motionState = "reduced"');
    expect(sections.join("\n")).not.toMatch(
      /data-home-cover|lib\/motion|<script/i,
    );
    expect(`${homepageMotion}\n${lifecycle}`).not.toMatch(
      /ClientRouter|IntersectionObserver|ScrollTrigger|smooth scroll/i,
    );
  });
});
