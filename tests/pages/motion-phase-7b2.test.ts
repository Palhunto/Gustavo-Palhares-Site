import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

import { HOME_WORKS_TIMELINES } from "../../src/lib/motion/config.ts";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Fase 7B2 — movimento da seção Trabalhos", () => {
  it("mantém uma única entrada de movimento e isola a coreografia", async () => {
    const homepage = await source("src/pages/index.astro");
    const orchestrator = await source("src/lib/motion/homepage.ts");
    const worksMotion = await source("src/lib/motion/home-works.ts");

    expect(homepage.match(/<script>/g)).toHaveLength(1);
    expect(homepage).toContain("initializeHomepageMotion(document)");
    expect(orchestrator).toContain("initializeHomeCoverMotion");
    expect(orchestrator).toContain("initializeHomeWorksMotion");
    expect(worksMotion).toContain("initializeMotion");
    expect(worksMotion).not.toMatch(/IntersectionObserver|scrub|pin:|snap:/);
  });

  it("declara hooks semânticos e preserva links e conteúdo no HTML", async () => {
    const works = await source("src/components/home/HomeWorks.astro");
    const heading = await source(
      "src/components/home/HomeSectionHeading.astro",
    );

    expect(works).toContain("data-home-works-motion");
    expect(works).toContain(
      'data-home-works-item={index === 0 ? "lead" : "reverse"}',
    );
    expect(works).toContain("data-home-works-divider");
    expect(works).toContain("data-home-works-image");
    expect(works).toContain("data-home-works-title");
    expect(works).toContain("data-home-works-summary");
    expect(works).toContain("data-home-works-meta");
    expect(works).toContain("data-home-works-cta");
    expect(works).toContain("publicRoutes.trabalho(work.data.slug)");
    expect(heading).toContain("data-home-works-heading-rule");
    await expect(
      transform(works, { filename: "HomeWorks.astro" }),
    ).resolves.toHaveProperty("code");
  });

  it("mantém quatro gatilhos independentes, únicos e sem scroll contínuo", async () => {
    const motion = await source("src/lib/motion/home-works.ts");

    expect(motion.match(/scrollTrigger:/g)).toHaveLength(4);
    expect(motion.match(/once: true/g)).toHaveLength(4);
    expect(HOME_WORKS_TIMELINES.trigger).toEqual({
      heading: "top 84%",
      work: "top 80%",
      divider: "top 82%",
    });
    expect(HOME_WORKS_TIMELINES.lead.totalDuration).toBeGreaterThanOrEqual(1);
    expect(HOME_WORKS_TIMELINES.lead.totalDuration).toBeLessThanOrEqual(1.2);
    expect(HOME_WORKS_TIMELINES.reverse.totalDuration).toBeGreaterThanOrEqual(
      1,
    );
    expect(HOME_WORKS_TIMELINES.reverse.totalDuration).toBeLessThanOrEqual(1.2);
  });

  it("diferencia as duas entradas e mantém imagem e texto sobrepostos", async () => {
    const motion = await source("src/lib/motion/home-works.ts");

    expect(motion).toContain('workTargets(root, "lead")');
    expect(motion).toContain('workTargets(root, "reverse")');
    expect(motion).toContain('transformOrigin: "right center"');
    expect(motion).toContain("HOME_WORKS_TIMELINES.reverse.initialClip");
    expect(HOME_WORKS_TIMELINES.lead.at.title).toBeLessThan(
      HOME_WORKS_TIMELINES.lead.imageDuration.regular,
    );
    expect(HOME_WORKS_TIMELINES.reverse.at.title).toBeLessThan(
      HOME_WORKS_TIMELINES.reverse.imageDuration.regular,
    );
  });

  it("preserva progressive enhancement, redução e refresh estável", async () => {
    const component = await source("src/components/home/HomeWorks.astro");
    const motion = await source("src/lib/motion/home-works.ts");
    const styles = await source("src/styles/site.css");

    expect(component).not.toMatch(/<script|style=|opacity:\s*0/);
    expect(motion).toContain('removeAttribute("style")');
    expect(motion).toContain("document.fonts?.ready");
    expect(motion).toContain("image.decode()");
    expect(motion).toContain("ScrollTrigger.refresh()");
    expect(motion).toContain("isPastViewport");
    expect(styles).toMatch(/\.home-work__media\s*\{[^}]*overflow:\s*hidden/s);
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("limita o CTA a hover real, foco e duração rápida", async () => {
    const styles = await source("src/styles/site.css");

    expect(styles).toContain("--home-works-interaction-duration: 180ms");
    expect(styles).toContain(".home-work__cta:hover::after");
    expect(styles).toContain(".home-work__cta:focus-visible::after");
    expect(styles).toContain("translateX(0.22rem)");
    expect(styles).toContain("@media (hover: hover) and (pointer: fine)");
  });

  it("não adiciona movimento às seções seguintes", async () => {
    const followingSections = await Promise.all(
      ["HomePresence", "HomeIndex", "HomeFooter"].map((component) =>
        source(`src/components/home/${component}.astro`),
      ),
    );

    expect(followingSections.join("\n")).not.toMatch(
      /data-home-works|lib\/motion|<script/i,
    );
  });
});
