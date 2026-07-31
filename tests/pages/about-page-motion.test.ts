import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Revelação tipográfica da página Sobre", () => {
  it("revela o título letra por letra com melhoria progressiva", async () => {
    const [page, motion, styles, config, packageJson] = await Promise.all([
      source("src/pages/sobre.astro"),
      source("src/lib/motion/about.ts"),
      source("src/styles/site.css"),
      source("src/lib/motion/config.ts"),
      source("package.json"),
    ]);

    expect(page).toContain("data-about-motion");
    expect(page).toContain("Array.from(aboutTitle).map");
    expect(page).toContain("data-about-title-letter={index}");
    expect(page).toContain("aria-label={aboutTitle}");
    expect(page).toContain("initializeAboutMotion(root)");
    expect(page).toContain("MOTION_LIFECYCLE_EVENTS.pageHide");

    expect(motion).toContain("initializeMotion");
    expect(motion).toContain('stagger: {');
    expect(motion).toContain('from: "start"');
    expect(motion).toContain('clearProps: "transform,opacity"');
    expect(motion).toContain("restoreAboutState");
    expect(config).toContain("ABOUT_PAGE_TIMELINE");
    expect(packageJson).not.toMatch(/SplitText|splitting/i);

    const aboutStyles = styles.slice(
      styles.indexOf("/* Sobre:"),
      styles.indexOf("/* Contato:"),
    );
    expect(aboutStyles).toMatch(
      /\.about-page__title-letter-clip\s*\{[^}]*overflow:\s*hidden/s,
    );
    expect(aboutStyles).toMatch(
      /\.about-page__title-letter\s*\{[^}]*transform-origin:\s*left bottom/s,
    );
    expect(aboutStyles).not.toMatch(
      /(?:^|\n)\s*(?:opacity|visibility)\s*:\s*0/,
    );

    await expect(
      transform(page, { filename: "sobre.astro" }),
    ).resolves.toHaveProperty("code");
  });
});
