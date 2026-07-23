import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it, vi } from "vitest";

import { MOTION_TOKENS } from "../../src/lib/motion/config.ts";
import {
  observeReducedMotion,
  prefersReducedMotion,
  REDUCED_MOTION_QUERY,
} from "../../src/lib/motion/preferences.ts";
import { sitemapRoutes } from "../../src/lib/seo/distribution.ts";
import { BUILD_INSTANT, validDataset } from "../fixtures/content/scenarios.ts";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Fase 7A — fundação e laboratório de movimento", () => {
  it("fixa somente GSAP e registra ScrollTrigger em um ponto protegido", async () => {
    const packageJson = JSON.parse(await source("package.json")) as {
      dependencies: Record<string, string>;
    };
    const registration = await source("src/lib/motion/gsap.ts");

    expect(packageJson.dependencies.gsap).toBe("3.15.0");
    expect(registration).toContain('from "gsap/ScrollTrigger"');
    expect(registration.match(/registerPlugin\(ScrollTrigger\)/g)).toHaveLength(
      1,
    );
    expect(registration).toContain('typeof window === "undefined"');
    expect(packageJson.dependencies).not.toHaveProperty("lenis");
    expect(packageJson.dependencies).not.toHaveProperty("motion");
  });

  it("mantém homepage e layout global fora do grafo de movimento", async () => {
    const homeFiles = await readdir(
      path.join(root, "src", "components", "home"),
    );
    const sources = await Promise.all([
      source("src/pages/index.astro"),
      source("src/layouts/BaseLayout.astro"),
      source("src/styles/global.css"),
      ...homeFiles.map((file) =>
        source(path.join("src/components/home", file)),
      ),
    ]);
    const globalGraph = sources.join("\n");

    expect(globalGraph).not.toMatch(/gsap|ScrollTrigger|lib\/motion/i);
    expect(globalGraph).not.toContain("data-motion-lab");
    expect(sources[0]).not.toContain("<script");
    expect(sources[1]).not.toContain("<script");
  });

  it("emite o laboratório completo, técnico e visível por padrão", async () => {
    const page = await source("src/pages/exploracoes/movimento.astro");

    expect(page).toContain(
      '<meta name="robots" content="noindex, nofollow" />',
    );
    expect(page).toContain("initializeMotionLaboratory");
    expect(page.match(/data-motion-index-section/g)).toHaveLength(4);
    for (const hook of [
      "headline-lines",
      "rule-growth",
      "editorial-image",
      "editorial-block",
      "active-index",
    ]) {
      expect(page).toContain(`data-motion="${hook}"`);
    }
    expect(page).not.toMatch(/opacity\s*:\s*0|visibility\s*:\s*hidden/);
    expect(page).not.toMatch(/transform\s*:\s*translate/);
    await expect(
      transform(page, { filename: "movimento.astro" }),
    ).resolves.toHaveProperty("code");
  });

  it("mantém a manchete vertical, sobreposta e sem fade", async () => {
    const laboratory = await source("src/lib/motion/laboratory.ts");
    const page = await source("src/pages/exploracoes/movimento.astro");
    const headlineMotion = laboratory.slice(
      laboratory.indexOf("gsap.from(headlineLines"),
      laboratory.indexOf("const rule"),
    );

    expect(MOTION_TOKENS.headline.duration).toBe(0.84);
    expect(MOTION_TOKENS.headline.stagger.regular).toBe(0.15);
    expect(MOTION_TOKENS.headline.stagger.compact).toBe(0.14);
    expect(
      MOTION_TOKENS.headline.duration +
        MOTION_TOKENS.headline.stagger.regular,
    ).toBeCloseTo(0.99);
    expect(MOTION_TOKENS.headline.yPercent.compact).toBeLessThan(
      MOTION_TOKENS.headline.yPercent.regular,
    );
    expect(headlineMotion).not.toMatch(/opacity|autoAlpha/);
    expect(headlineMotion).toContain('clearProps: "transform"');
    expect(page).toMatch(
      /\.motion-headline__clip\s*\{[^}]*overflow:\s*hidden/s,
    );
  });

  it("entrega preferência reduzida segura e observável", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const query = { matches: true, addEventListener, removeEventListener };
    const callback = vi.fn();

    expect(REDUCED_MOTION_QUERY).toBe("(prefers-reduced-motion: reduce)");
    expect(prefersReducedMotion(query)).toBe(true);

    const cleanup = observeReducedMotion(callback, query);
    expect(callback).toHaveBeenCalledWith(true);
    expect(addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    cleanup();
    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("mantém lifecycle idempotente, cleanup e fallback final", async () => {
    const lifecycle = await source("src/lib/motion/lifecycle.ts");
    const laboratory = await source("src/lib/motion/laboratory.ts");
    const combined = `${lifecycle}\n${laboratory}`;

    expect(lifecycle).toContain("activeScopes.get(root)?.()");
    expect(lifecycle).toContain("activeContext.revert()");
    expect(lifecycle).toContain("context?.revert()");
    expect(lifecycle).toContain("restoreFinalState()");
    expect(lifecycle).toContain("stopPreferenceObserver()");
    expect(laboratory).toContain('removeAttribute("style")');
    expect(combined).not.toMatch(/ClientRouter|Lenis|scrollTo\(|smooth/i);

    const config = await source("src/lib/motion/config.ts");
    expect(config).toContain('astroBeforeSwap: "astro:before-swap"');
    expect(config).toContain('astroPageLoad: "astro:page-load"');
  });

  it("mantém a rota fora da circulação editorial e sob auditoria técnica", async () => {
    const dataset = await validDataset();
    const integrity = await source("src/lib/seo/public-integrity.ts");
    const header = await source("src/components/global/SiteHeader.astro");
    const footer = await source("src/components/global/SiteFooter.astro");

    expect(sitemapRoutes(dataset, BUILD_INSTANT)).not.toContain(
      "/exploracoes/movimento/",
    );
    expect(`${header}\n${footer}`).not.toMatch(/exploracoes\/movimento/);
    expect(integrity).toContain('"/exploracoes/movimento/"');
  });
});
