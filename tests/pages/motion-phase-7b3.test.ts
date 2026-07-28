import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

import { HOME_PRESENCE_TIMELINES } from "../../src/lib/motion/config.ts";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Fase 7B3 — movimento da seção Publicação e presença", () => {
  it("usa módulo próprio no orquestrador único da homepage", async () => {
    const homepage = await source("src/pages/index.astro");
    const orchestrator = await source("src/lib/motion/homepage.ts");
    const motion = await source("src/lib/motion/home-presence.ts");

    expect(homepage.match(/<script>/g)).toHaveLength(1);
    expect(orchestrator).toContain("initializeHomeCoverMotion");
    expect(orchestrator).toContain("initializeHomeWorksMotion");
    expect(orchestrator).toContain("initializeHomePresenceMotion");
    expect(motion).toContain("initializeMotion");
    expect(motion).not.toMatch(
      /IntersectionObserver|scrub|pin:|snap:|Lenis|smooth scroll/i,
    );
  });

  it("declara hooks estáveis e mantém todo o conteúdo no HTML", async () => {
    const presence = await source("src/components/home/HomePresence.astro");
    const heading = await source(
      "src/components/home/HomeSectionHeading.astro",
    );

    expect(presence).toContain("data-home-presence-motion");
    expect(presence).toContain("data-home-presence-feature");
    expect(presence).toContain("data-home-presence-grid");
    expect(presence).toContain('data-home-presence-rule="main"');
    expect(presence).toContain('data-home-presence-item="contato"');
    expect(presence).toContain("sobre.description");
    expect(presence).toContain("contato.description");
    expect(presence).toContain("href={sobre.href}");
    expect(presence).toContain("href={contato.href}");
    expect(presence).not.toMatch(/grid-vertical|grid-horizontal|caderno/);
    expect(heading).toContain("data-home-presence-heading-rule");
    await expect(
      transform(presence, { filename: "HomePresence.astro" }),
    ).resolves.toHaveProperty("code");
  });

  it("mantém cabeçalho, Sobre e Contato como comportamentos distintos", async () => {
    const motion = await source("src/lib/motion/home-presence.ts");

    expect(motion.match(/scrollTrigger:/g)).toHaveLength(5);
    expect(motion.match(/once: true/g)).toHaveLength(5);
    expect(HOME_PRESENCE_TIMELINES.trigger.heading).toBe("top 84%");
    expect(HOME_PRESENCE_TIMELINES.trigger.feature).toBe("top 80%");
    expect(HOME_PRESENCE_TIMELINES.trigger.grid).toBe("top 82%");
    expect(
      HOME_PRESENCE_TIMELINES.heading.totalDuration,
    ).toBeGreaterThanOrEqual(0.7);
    expect(HOME_PRESENCE_TIMELINES.heading.totalDuration).toBeLessThanOrEqual(
      0.85,
    );
    expect(
      HOME_PRESENCE_TIMELINES.feature.totalDuration,
    ).toBeGreaterThanOrEqual(0.7);
    expect(HOME_PRESENCE_TIMELINES.feature.totalDuration).toBeLessThanOrEqual(
      0.8,
    );
    expect(HOME_PRESENCE_TIMELINES.grid.totalDuration).toBeGreaterThanOrEqual(
      0.85,
    );
    expect(HOME_PRESENCE_TIMELINES.grid.totalDuration).toBeLessThanOrEqual(
      0.95,
    );
  });

  it("monta os filetes por transform sem alterar geometria", async () => {
    const motion = await source("src/lib/motion/home-presence.ts");
    const styles = await source("src/styles/site.css");

    expect(motion).toContain("ruleInitialState");
    expect(motion).toContain("scaleY: 0");
    expect(motion).toContain("scaleX: 0");
    expect(styles).toContain(".home-presence__rule--main");
    expect(styles).not.toMatch(
      /home-presence__rule--grid-(?:vertical|horizontal)/,
    );
    expect(motion).not.toMatch(/\bwidth\s*:|\bheight\s*:/);
  });

  it("dispara cada área mobile somente perto de sua própria viewport", async () => {
    const motion = await source("src/lib/motion/home-presence.ts");

    expect(motion).toContain("if (compact)");
    expect(motion).toContain("items.forEach((item)");
    expect(motion).toContain("trigger: item");
    expect(motion).toContain(
      "start: HOME_PRESENCE_TIMELINES.trigger.mobileItem",
    );
    expect(HOME_PRESENCE_TIMELINES.trigger.mobileItem).toBe("top 88%");
    expect(HOME_PRESENCE_TIMELINES.mobileItem.totalDuration).toBeLessThan(0.7);
  });

  it("preserva fallback estático, redução e estado final", async () => {
    const presence = await source("src/components/home/HomePresence.astro");
    const motion = await source("src/lib/motion/home-presence.ts");
    const lifecycle = await source("src/lib/motion/lifecycle.ts");
    const styles = await source("src/styles/site.css");

    expect(presence).not.toMatch(/<script|style=|opacity:\s*0/);
    expect(motion).toContain('removeAttribute("style")');
    expect(motion).toContain("isPastViewport");
    expect(motion).toContain("document.fonts?.ready");
    expect(motion).toContain("ScrollTrigger.refresh()");
    expect(lifecycle).toContain('root.dataset.motionState = "reduced"');
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("mantém ações e canais nativos com hover, foco e toque mínimo", async () => {
    const presence = await source("src/components/home/HomePresence.astro");
    const styles = await source("src/styles/site.css");

    expect(
      presence.match(/class="home-presence__action type-nav"/g),
    ).toHaveLength(2);
    expect(presence).toContain("contactChannels.map");
    expect(presence).not.toMatch(/on:click|onclick=|role="button"/i);
    expect(styles).toContain("--home-presence-interaction-duration: 180ms");
    expect(styles).toContain(".home-presence__action:hover::after");
    expect(styles).toContain(".home-presence__action:focus-visible::after");
    expect(styles).toMatch(
      /\.home-presence__action,[^{]*\{[^}]*min-block-size:\s*2\.75rem/s,
    );
  });

  it("mantém o módulo da 7B3 restrito a Publicação e presença", async () => {
    const motion = await source("src/lib/motion/home-presence.ts");

    expect(motion).not.toMatch(/data-home-index|data-home-footer/i);
    expect(motion).not.toMatch(/initializeHome(?:Index|Footer)Motion/);
  });
});
