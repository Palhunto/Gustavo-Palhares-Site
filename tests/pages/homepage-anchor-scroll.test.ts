import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { homepageSections } from "../../src/config/homepage.ts";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Rolagem das âncoras internas da homepage", () => {
  it("ativa rolagem suave somente pelo hook da homepage", async () => {
    const styles = await source("src/styles/site.css");

    expect(styles).toMatch(
      /html:has\(> body\.public-page--homepage\)\s*\{[^}]*scroll-behavior:\s*smooth;[^}]*scroll-padding-block-start:\s*var\(--space-4\);/s,
    );
    expect(styles.match(/scroll-behavior:\s*smooth/g)).toHaveLength(1);
  });

  it("preserva destinos, margem superior e âncoras HTML nativas", async () => {
    const styles = await source("src/styles/site.css");
    const cover = await source("src/components/home/HomeCover.astro");

    expect(homepageSections.map(({ id }) => id)).toEqual([
      "capa",
      "trabalhos",
      "publicacao",
      "indice",
    ]);
    expect(styles).toMatch(
      /\.home-moment\s*\{[^}]*scroll-margin-block-start:\s*var\(--space-4\);/s,
    );
    expect(cover).toContain('href={`#${section.id}`}');
    expect(cover).not.toMatch(/preventDefault|onclick|on:click/);
  });

  it("mantém rolagem instantânea para movimento reduzido", async () => {
    const motion = await source("src/styles/motion.css");

    expect(motion).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*scroll-behavior:\s*auto !important;/,
    );
  });
});
