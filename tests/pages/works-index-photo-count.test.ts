import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

import { loadContentFromDisk } from "../../src/lib/content/source-loader.ts";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Contador de fotos na listagem de trabalhos", () => {
  it("deriva o selo da galeria pública, que inclui a capa", async () => {
    const [page, styles, dataset] = await Promise.all([
      source("src/pages/trabalhos/index.astro"),
      source("src/styles/site.css"),
      loadContentFromDisk(root),
    ]);

    for (const work of dataset.trabalhos) {
      expect(
        work.data.gallery.some(
          (media) => media.asset === work.data.cover.asset,
        ),
      ).toBe(true);
    }

    expect(page).toContain("const photoCount = work.data.gallery.length;");
    expect(page).toContain('class="works-index__photo-count"');
    expect(page).toContain("{photoCount}");
    expect(page).toContain("Fotografias");
    expect(page).toContain("${photoCount} fotos");
    expect(styles).toMatch(
      /\.public-page--works-index \.works-index__photo-count\s*\{[^}]*position:\s*absolute[^}]*inset-inline-end:[^}]*max-inline-size:/s,
    );

    await expect(
      transform(page, { filename: "trabalhos/index.astro" }),
    ).resolves.toHaveProperty("code");
  });
});
