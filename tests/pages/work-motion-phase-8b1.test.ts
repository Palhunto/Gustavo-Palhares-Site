import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

import {
  MOTION_TOKENS,
  NEPHILLIN_WORK_TIMELINES,
} from "../../src/lib/motion/config.ts";
import { resolveNephillinEntryMode } from "../../src/lib/motion/nephillin-work.ts";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Fase 8B1 — movimento editorial de Nephillin", () => {
  it("preserva a inicialização de Nephillin no orquestrador compartilhado", async () => {
    const route = await source("src/pages/trabalhos/[slug].astro");
    const layout = await source("src/layouts/WorkLayout.astro");
    const entry = await source("src/components/editorial/WorkMotion.astro");

    expect(route).toContain(
      'entry.id === "nephillin-uma-cobertura-sem-credencial"',
    );
    expect(route).toContain('? "nephillin"');
    expect(route).toContain("motion={motion}");
    expect(layout).toContain(
      'motion?: "standard" | "nephillin" | "feira" | "kauan"',
    );
    expect(layout).toContain("motion && <WorkMotion />");
    expect(layout).toContain("data-work-motion={motion}");
    expect(entry).toContain("? initializeNephillinWorkMotion");
    expect(entry).toContain("const cleanup = initialize(root)");
    expect(entry).toContain("MOTION_LIFECYCLE_EVENTS.pageHide, cleanup");
    expect(entry.match(/addEventListener\(/g)).toHaveLength(1);
  });

  it("distingue chegada compartilhada, acesso direto e restauração", () => {
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
    expect(
      resolveNephillinEntryMode({
        activeViewTransition: false,
        navigationType: "navigate",
        scrollY: 240,
      }),
    ).toBe("restored");
  });

  it("coordena introdução em power3.out sem dividir a manchete", async () => {
    const motion = await source("src/lib/motion/nephillin-work.ts");
    const layout = await source("src/layouts/WorkLayout.astro");

    expect(MOTION_TOKENS.easing.editorial).toBe("power3.out");
    expect(NEPHILLIN_WORK_TIMELINES.intro.duration.title).toBe(0.96);
    expect(NEPHILLIN_WORK_TIMELINES.intro.at).toMatchObject({
      marker: 0,
      title: 0.08,
      summary: 0.28,
      rule: 0.34,
      metadata: 0.42,
    });
    expect(motion).toContain('"[data-work-title]"');
    expect(motion).toContain('"[data-work-summary]"');
    expect(motion).toContain('"--work-metadata-rule-scale": 0');
    expect(motion).toContain("ease: MOTION_TOKENS.easing.editorial");
    expect(layout).not.toMatch(/data-work-title-word|SplitText/);
  });

  it("não anima a abertura compartilhada e reserva um caminho ao acesso direto", async () => {
    const motion = await source("src/lib/motion/nephillin-work.ts");
    const directBranch = motion.slice(
      motion.indexOf('entryMode === "direct" && leadPicture'),
      motion.indexOf("return timeline;"),
    );

    expect(motion).toContain("activeViewTransition");
    expect(motion).toContain('entryMode === "direct" && leadPicture');
    expect(directBranch).toContain("scale: 1.025");
    expect(directBranch).toContain(
      "duration: NEPHILLIN_WORK_TIMELINES.intro.duration.lead",
    );
    expect(directBranch).not.toContain("view-transition-name");
    expect(motion).not.toContain(
      "[data-work-lead] .work-cover-transition-frame",
    );
  });

  it("preserva oito números e as estratégias responsivas dos três blocos", async () => {
    const nephillin = await source(
      "src/content/trabalhos/nephillin-uma-cobertura-sem-credencial.mdx",
    );
    const motion = await source("src/lib/motion/nephillin-work.ts");

    expect(nephillin).toContain('numbers="02,03"');
    expect(nephillin).toContain('numbers="04,05,06"');
    expect(nephillin).toContain('numbers="07,08"');
    expect(nephillin).toContain('layout="mosaic"');
    expect(motion).toContain(
      "animateMobileFigures(gsap, ScrollTrigger, figures, distance)",
    );
    expect(motion).toContain(
      "animateDesktopGallery(root, gsap, ScrollTrigger, distance)",
    );
    expect(motion).toContain(
      "NEPHILLIN_WORK_TIMELINES.mosaic.duration.dominant",
    );
    expect(NEPHILLIN_WORK_TIMELINES.pair.stagger).toBeGreaterThanOrEqual(0.08);
    expect(NEPHILLIN_WORK_TIMELINES.pair.stagger).toBeLessThanOrEqual(0.14);
  });

  it("usa ScrollTrigger once sem scrub, pin, snap ou rolagem artificial", async () => {
    const motion = await source("src/lib/motion/nephillin-work.ts");
    const triggerCount =
      motion.match(/ScrollTrigger\.create\(\{/g)?.length ?? 0;
    const onceCount = motion.match(/once:\s*true/g)?.length ?? 0;

    expect(triggerCount).toBeGreaterThanOrEqual(5);
    expect(onceCount).toBe(triggerCount);
    expect(motion).toContain("onEnter: () =>");
    expect(motion).not.toMatch(
      /\bscrub\b|\bpin\b|\bsnap\b|scrollTo|Lenis|smooth/i,
    );
    expect(motion).toContain("ScrollTrigger.refresh()");
  });

  it("mantém fallback visível, movimento reduzido e cleanup completo", async () => {
    const motion = await source("src/lib/motion/nephillin-work.ts");
    const lifecycle = await source("src/lib/motion/lifecycle.ts");
    const styles = await source("src/styles/site.css");
    const motionStyles = await source("src/styles/motion.css");
    const scopedStyles = styles.slice(
      styles.indexOf('[data-work-motion="nephillin"]'),
      styles.indexOf(".family-list,"),
    );

    expect(motion).toContain("prefersReducedMotion()");
    expect(motion).toContain('removeAttribute("style")');
    expect(motion).toContain('root.dataset.workMotionPresented = "true"');
    expect(lifecycle).toContain('root.dataset.motionState = "reduced"');
    expect(motionStyles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(scopedStyles).not.toMatch(/opacity\s*:\s*0|visibility\s*:\s*hidden/);
    expect(scopedStyles).not.toMatch(
      /\[data-work-figure\][^{]*\{[^}]*transform/s,
    );
  });

  it("preserva View Transition da capa, imagens internas e links nativos", async () => {
    const lead = await source("src/components/editorial/LeadImage.astro");
    const internal = await Promise.all(
      ["Diptych", "Triptych", "ContactSheet"].map((component) =>
        source(`src/components/editorial/${component}.astro`),
      ),
    );
    const layout = await source("src/layouts/WorkLayout.astro");
    const motion = await source("src/lib/motion/nephillin-work.ts");

    expect(lead).toContain("view-transition-name:");
    expect(internal.join("\n")).not.toMatch(
      /viewTransitionName|view-transition-name/,
    );
    expect(layout).toContain("href={publicRoutes.trabalhosIndex}");
    expect(layout.match(/class="work-continuity__link/g)).toHaveLength(1);
    expect(`${layout}\n${motion}`).not.toMatch(
      /preventDefault|ClientRouter|addEventListener\(\s*["']click/i,
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
