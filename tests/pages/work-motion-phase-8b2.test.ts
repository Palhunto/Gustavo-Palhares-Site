import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

import {
  FEIRA_WORK_TIMELINES,
  MOTION_TOKENS,
  NEPHILLIN_WORK_TIMELINES,
} from "../../src/lib/motion/config.ts";
import { resolveNephillinEntryMode } from "../../src/lib/motion/nephillin-work.ts";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Fase 8B2 — movimento editorial da Feira do Rolo", () => {
  it("inicializa a Feira pelo orquestrador e motor compartilhados", async () => {
    const route = await source("src/pages/trabalhos/[slug].astro");
    const layout = await source("src/layouts/WorkLayout.astro");
    const entry = await source("src/components/editorial/WorkMotion.astro");
    const motion = await source("src/lib/motion/feira-work.ts");
    const engine = await source("src/lib/motion/gsap.ts");

    expect(route).toContain('entry.id === "feira-do-rolo"');
    expect(route).toContain('? "feira"');
    expect(layout).toContain('motion?: "nephillin" | "feira"');
    expect(layout).toContain("motion && <WorkMotion />");
    expect(entry).toContain("? initializeNephillinWorkMotion");
    expect(entry).toContain("? initializeFeiraWorkMotion");
    expect(entry).toContain("const cleanup = initialize(root)");
    expect(entry.match(/addEventListener\(/g)).toHaveLength(1);
    expect(motion).toContain("initializeMotion({");
    expect(motion).toContain("resolveCurrentWorkEntryMode(documentRoot)");
    expect(motion).toContain("animateWorkEnding(");
    expect(motion).toContain("scheduleStableRefresh(");
    expect(motion).not.toMatch(/from\s+["']gsap(?:\/ScrollTrigger)?["']/);
    expect(engine.match(/registerPlugin\(ScrollTrigger\)/g)).toHaveLength(1);
  });

  it("preserva a sequência editorial e a numeração 01–09", async () => {
    const layout = await source("src/layouts/WorkLayout.astro");
    const feira = await source("src/content/trabalhos/feira-do-rolo.mdx");

    expect(layout).toContain('number="01"');
    expect(feira).toContain('numbers="02,03"');
    expect(feira).toContain('numbers="04,05,06,07,08,09"');
    expect(feira.indexOf("<Diptych")).toBeLessThan(
      feira.indexOf("<ContactSheet"),
    );
    expect(feira).toContain(
      'assets="fase-4-mercado-02,fase-5-rua-05-relacao,fase-5-rua-06-detalhe,fase-5-rua-07-espaco,fase-5-rua-08-sequencia,fase-4-retrato-amplo"',
    );
  });

  it("usa introdução documental sem fade no título", async () => {
    const motion = await source("src/lib/motion/feira-work.ts");
    const titleBranch = motion.slice(
      motion.indexOf("if (titleLine)"),
      motion.indexOf("if (summary)"),
    );

    expect(MOTION_TOKENS.easing.editorial).toBe("power3.out");
    expect(FEIRA_WORK_TIMELINES.intro.duration.title).toBe(0.84);
    expect(FEIRA_WORK_TIMELINES.intro.duration.summary).toBeGreaterThanOrEqual(
      0.55,
    );
    expect(FEIRA_WORK_TIMELINES.intro.duration.summary).toBeLessThanOrEqual(
      0.68,
    );
    expect(titleBranch).toContain("yPercent:");
    expect(titleBranch).toContain("ease: MOTION_TOKENS.easing.editorial");
    expect(titleBranch).not.toContain("opacity");
  });

  it("distingue acesso direto, View Transition e restauração sem transformar o wrapper", async () => {
    const motion = await source("src/lib/motion/feira-work.ts");
    const directBranch = motion.slice(
      motion.indexOf('entryMode === "direct" && leadPicture'),
      motion.indexOf("return timeline;"),
    );

    expect(
      resolveNephillinEntryMode({
        activeViewTransition: true,
        navigationType: "navigate",
        scrollY: 0,
      }),
    ).toBe("shared");
    expect(
      resolveNephillinEntryMode({
        activeViewTransition: false,
        navigationType: "reload",
        scrollY: 0,
      }),
    ).toBe("direct");
    expect(
      resolveNephillinEntryMode({
        activeViewTransition: true,
        navigationType: "back_forward",
        scrollY: 0,
      }),
    ).toBe("restored");
    expect(directBranch).toContain("scale: 1.022");
    expect(directBranch).toContain(
      "duration: FEIRA_WORK_TIMELINES.intro.duration.lead",
    );
    expect(motion).not.toContain(
      "[data-work-lead] .work-cover-transition-frame",
    );
    expect(directBranch).not.toContain("view-transition-name");
  });

  it("coordena díptico e folha de contato com gatilhos once", async () => {
    const motion = await source("src/lib/motion/feira-work.ts");
    const triggerCount =
      motion.match(/ScrollTrigger\.create\(\{/g)?.length ?? 0;
    const onceCount = motion.match(/once:\s*true/g)?.length ?? 0;

    expect(FEIRA_WORK_TIMELINES.trigger.diptych).toBe("top 82%");
    expect(FEIRA_WORK_TIMELINES.diptych.totalDuration).toBeGreaterThanOrEqual(
      1.05,
    );
    expect(FEIRA_WORK_TIMELINES.diptych.totalDuration).toBeLessThanOrEqual(1.15);
    expect(FEIRA_WORK_TIMELINES.sheet.totalDuration).toBeGreaterThanOrEqual(
      1.15,
    );
    expect(FEIRA_WORK_TIMELINES.sheet.totalDuration).toBeLessThanOrEqual(1.35);
    expect(FEIRA_WORK_TIMELINES.sheet.stagger).toBeGreaterThanOrEqual(0.07);
    expect(FEIRA_WORK_TIMELINES.sheet.stagger).toBeLessThanOrEqual(0.1);
    expect(motion).toContain("animateDiptych(");
    expect(motion).toContain("animateDesktopSheet(");
    expect(motion).toContain("animateSheetRows(");
    expect(motion).toContain("figures.slice(0, 2)");
    expect(motion).toContain("figures.slice(2, 4)");
    expect(motion).toContain("figures.slice(4, 6)");
    expect(motion).toContain('"--feira-sheet-inline-scale": 0');
    expect(motion).toContain('"--feira-sheet-block-scale": 0');
    expect(triggerCount).toBeGreaterThanOrEqual(4);
    expect(onceCount).toBe(triggerCount);
    expect(motion).not.toMatch(
      /\bscrub\b|\bpin\b|\bsnap\b|scrollTo|Lenis|smooth/i,
    );
  });

  it("mantém duas colunas no tablet/mobile sem estado invisível no CSS", async () => {
    const styles = await source("src/styles/site.css");
    const scopedStyles = styles.slice(
      styles.indexOf('[data-work-motion="feira"] [data-work-title-clip]'),
      styles.indexOf(".family-list,"),
    );

    expect(scopedStyles).toContain(
      '[data-work-motion="feira"] .contact-sheet__grid',
    );
    expect(scopedStyles).toContain(
      "grid-template-columns: repeat(2, minmax(0, 1fr))",
    );
    expect(scopedStyles).toContain("[data-work-contact-sheet]::before");
    expect(scopedStyles).toContain("[data-work-contact-sheet]::after");
    expect(scopedStyles).not.toMatch(
      /opacity\s*:\s*0|visibility\s*:\s*hidden/,
    );
    expect(scopedStyles).not.toMatch(
      /\[data-work-figure\][^{]*\{[^}]*transform/s,
    );
  });

  it("preserva View Transition, links nativos e imagens internas", async () => {
    const lead = await source("src/components/editorial/LeadImage.astro");
    const internal = await Promise.all(
      ["Diptych", "ContactSheet"].map((component) =>
        source(`src/components/editorial/${component}.astro`),
      ),
    );
    const layout = await source("src/layouts/WorkLayout.astro");
    const motion = await source("src/lib/motion/feira-work.ts");

    expect(lead).toContain("view-transition-name:");
    expect(internal.join("\n")).not.toMatch(
      /viewTransitionName|view-transition-name/,
    );
    expect(layout).toContain("href={previous.href}");
    expect(layout).toContain("href={next.href}");
    expect(`${layout}\n${motion}`).not.toMatch(
      /preventDefault|ClientRouter|addEventListener\(\s*["']click/i,
    );
  });

  it("preserva cleanup, idempotência, movimento reduzido e Nephillin", async () => {
    const motion = await source("src/lib/motion/feira-work.ts");
    const lifecycle = await source("src/lib/motion/lifecycle.ts");
    const nephillin = await source("src/lib/motion/nephillin-work.ts");

    expect(motion).toContain("prefersReducedMotion()");
    expect(motion).toContain('removeAttribute("style")');
    expect(motion).toContain('root.dataset.workMotionPresented = "true"');
    expect(motion).toContain(
      'if (root.dataset.workMotionPresented === "true") return',
    );
    expect(motion).toContain('root.removeAttribute("data-work-entry-mode")');
    expect(lifecycle).toContain("activeScopes.get(root)?.()");
    expect(lifecycle).toContain('root.dataset.motionState = "reduced"');
    expect(NEPHILLIN_WORK_TIMELINES.intro.duration.title).toBe(0.96);
    expect(nephillin).toContain("initializeNephillinWorkMotion(");
    expect(nephillin).toContain(
      "animateDesktopGallery(root, gsap, ScrollTrigger, distance)",
    );
  });

  it("mantém entrada e layout Astro compiláveis", async () => {
    for (const file of [
      "src/components/editorial/WorkMotion.astro",
      "src/layouts/WorkLayout.astro",
      "src/pages/trabalhos/[slug].astro",
    ]) {
      await expect(
        source(file).then((value) =>
          transform(value, { filename: path.basename(file) }),
        ),
      ).resolves.toHaveProperty("code");
    }
  });
});
