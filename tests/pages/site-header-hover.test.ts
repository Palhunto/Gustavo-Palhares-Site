import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Filete de hover da navega\u00e7\u00e3o principal", () => {
  it("mant\u00e9m o indicador da p\u00e1gina atual e o revela ao passar o mouse", async () => {
    const [header, styles, motion] = await Promise.all([
      source("src/components/global/SiteHeader.astro"),
      source("src/styles/site.css"),
      source("src/styles/motion.css"),
    ]);

    expect(header).toContain('class="site-header__nav type-nav"');
    expect(styles).toMatch(
      /\.site-header__nav a::after\s*\{[^}]*content:\s*"";[^}]*transform:\s*scaleX\(0\);[^}]*transform-origin:\s*left center/s,
    );
    expect(styles).toMatch(
      /\.site-header__nav a\[aria-current="page"\]::after,[\s\S]*?transform:\s*scaleX\(1\)/,
    );
    expect(styles).toMatch(
      /@media \(hover: hover\)[\s\S]*?\.site-header__nav a:hover::after\s*\{[^}]*transform:\s*scaleX\(1\)/,
    );
    expect(styles).toContain(
      "transition: transform var(--duration-short) var(--ease-editorial)",
    );
    expect(motion).toContain("prefers-reduced-motion: reduce");

    await expect(
      transform(header, { filename: "SiteHeader.astro" }),
    ).resolves.toHaveProperty("code");
  });
});
