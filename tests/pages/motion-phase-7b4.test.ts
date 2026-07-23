import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

import { HOME_INDEX_TIMELINES } from "../../src/lib/motion/config.ts";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Fase 7B4 — Índice final e encerramento da homepage", () => {
  it("integra um módulo próprio ao orquestrador único", async () => {
    const homepage = await source("src/pages/index.astro");
    const orchestrator = await source("src/lib/motion/homepage.ts");
    const motion = await source("src/lib/motion/home-index-end.ts");

    expect(homepage.match(/<script>/g)).toHaveLength(1);
    expect(orchestrator).toContain("initializeHomeCoverMotion");
    expect(orchestrator).toContain("initializeHomeWorksMotion");
    expect(orchestrator).toContain("initializeHomePresenceMotion");
    expect(orchestrator).toContain("initializeHomeIndexEndMotion");
    expect(motion).toContain("initializeMotion");
    expect(motion).not.toMatch(
      /IntersectionObserver|scrub|pin:|snap:|Lenis|smooth scroll|ClientRouter/i,
    );
  });

  it("mantém Índice e footer completos no HTML estático", async () => {
    const index = await source("src/components/home/HomeIndex.astro");
    const footer = await source("src/components/home/HomeFooter.astro");
    const heading = await source(
      "src/components/home/HomeSectionHeading.astro",
    );

    expect(index).toContain("data-home-index-motion");
    expect(index).toContain("data-home-index-list");
    expect(index.match(/data-home-index-item="/g)).toHaveLength(5);
    expect(index).toContain("data-home-index-work");
    expect(index).toContain("data-home-index-item-state");
    expect(index).toContain("data-home-index-item-sublink");
    expect(index).toContain("data-home-index-item-action");
    expect(footer).toContain("data-home-footer-motion");
    expect(footer).toContain("data-home-footer-rule");
    expect(footer.match(/data-home-footer-group/g)).toHaveLength(4);
    expect(heading).toContain("data-home-index-heading-rule");
    await expect(
      transform(index, { filename: "HomeIndex.astro" }),
    ).resolves.toHaveProperty("code");
    await expect(
      transform(footer, { filename: "HomeFooter.astro" }),
    ).resolves.toHaveProperty("code");
  });

  it("usa timelines editoriais e triggers executados uma vez", async () => {
    const motion = await source("src/lib/motion/home-index-end.ts");

    expect(motion.match(/scrollTrigger:/g)).toHaveLength(4);
    expect(motion.match(/once: true/g)).toHaveLength(4);
    expect(HOME_INDEX_TIMELINES.trigger.heading).toBe("top 84%");
    expect(HOME_INDEX_TIMELINES.trigger.list).toBe("top 82%");
    expect(HOME_INDEX_TIMELINES.trigger.footer).toBe("top 94%");
    expect(HOME_INDEX_TIMELINES.heading.totalDuration).toBeGreaterThanOrEqual(
      0.75,
    );
    expect(HOME_INDEX_TIMELINES.heading.totalDuration).toBeLessThanOrEqual(
      0.85,
    );
    expect(HOME_INDEX_TIMELINES.list.totalDuration).toBeGreaterThanOrEqual(
      1.05,
    );
    expect(HOME_INDEX_TIMELINES.list.totalDuration).toBeLessThanOrEqual(1.3);
    expect(HOME_INDEX_TIMELINES.footer.totalDuration).toBeGreaterThanOrEqual(
      0.7,
    );
    expect(HOME_INDEX_TIMELINES.footer.totalDuration).toBeLessThanOrEqual(0.9);
  });

  it("calcula ordem visual e separa os grupos móveis", async () => {
    const motion = await source("src/lib/motion/home-index-end.ts");

    expect(motion).toContain("visualOrder(items)");
    expect(motion).toContain("leftRect.top - rightRect.top");
    expect(motion).toContain("if (compact)");
    expect(motion).toContain("items.forEach((item)");
    expect(motion).toContain("trigger: item");
    expect(motion).toContain("start: HOME_INDEX_TIMELINES.trigger.mobileItem");
    expect(HOME_INDEX_TIMELINES.mobileItem.totalDuration).toBeLessThan(0.7);
  });

  it("monta filetes por transform sem alterar geometria", async () => {
    const motion = await source("src/lib/motion/home-index-end.ts");
    const styles = await source("src/styles/site.css");

    expect(motion).toContain("ruleInitialState");
    expect(motion).toContain("scaleY: 0");
    expect(motion).toContain("scaleX: 0");
    expect(styles).toContain(".home-index__rule--inline");
    expect(styles).toContain(".home-index__rule--block");
    expect(styles).toContain(".home-footer__rule");
    expect(motion).not.toMatch(/\bwidth\s*:|\bheight\s*:/);
  });

  it("restringe a chegada animada ao footer da homepage", async () => {
    const baseLayout = await source("src/layouts/BaseLayout.astro");
    const homeFooter = await source("src/components/home/HomeFooter.astro");
    const siteFooter = await source("src/components/global/SiteFooter.astro");
    const orchestrator = await source("src/lib/motion/homepage.ts");

    expect(baseLayout).toContain(
      'variant === "homepage" ? <HomeFooter /> : <SiteFooter />',
    );
    expect(homeFooter).toContain("data-home-footer-motion");
    expect(siteFooter).not.toContain("data-home-footer-motion");
    expect(orchestrator).toContain("[data-home-footer-motion]");
  });

  it("preserva fallback, redução de movimento e cleanup", async () => {
    const index = await source("src/components/home/HomeIndex.astro");
    const footer = await source("src/components/home/HomeFooter.astro");
    const motion = await source("src/lib/motion/home-index-end.ts");
    const lifecycle = await source("src/lib/motion/lifecycle.ts");
    const styles = await source("src/styles/site.css");

    expect(index + footer).not.toMatch(/<script|style=|opacity:\s*0/);
    expect(motion).toContain('removeAttribute("style")');
    expect(motion).toContain("isPastViewport");
    expect(motion).toContain("document.fonts?.ready");
    expect(motion).toContain("ScrollTrigger.refresh()");
    expect(lifecycle).toContain('root.dataset.motionState = "reduced"');
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("mantém links nativos com hover, foco e toque mínimo", async () => {
    const index = await source("src/components/home/HomeIndex.astro");
    const styles = await source("src/styles/site.css");

    expect(index).toContain('class="home-index__text-link"');
    expect(index).toContain('class="home-index__action type-nav"');
    expect(index).not.toMatch(/on:click|onclick=|role="button"/i);
    expect(styles).toContain("--home-index-interaction-duration: 180ms");
    expect(styles).toContain(".home-index__action:hover::after");
    expect(styles).toContain(".home-index__text-link:hover::after");
    expect(styles).toContain(".home-index__action:focus-visible::after");
    expect(styles).toContain(".home-index__text-link:focus-visible::after");
    expect(styles).toContain("translateX(0.22rem)");
    expect(styles).toMatch(
      /\.home-index__action\s*\{[^}]*min-block-size:\s*2\.75rem/s,
    );
  });

  it("mantém as quatro seções no orquestrador sem registro duplicado", async () => {
    const orchestrator = await source("src/lib/motion/homepage.ts");
    const gsap = await source("src/lib/motion/gsap.ts");

    expect(orchestrator.match(/initializeHomeCoverMotion\(/g)).toHaveLength(1);
    expect(orchestrator.match(/initializeHomeWorksMotion\(/g)).toHaveLength(1);
    expect(orchestrator.match(/initializeHomePresenceMotion\(/g)).toHaveLength(
      1,
    );
    expect(orchestrator.match(/initializeHomeIndexEndMotion\(/g)).toHaveLength(
      1,
    );
    expect(gsap.match(/registerPlugin\(/g)).toHaveLength(1);
  });
});
