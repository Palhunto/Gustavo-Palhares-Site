import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("RevelaÃ§Ã£o de tÃ­tulos editoriais", () => {
  it("aplica a mesma entrada tipogrÃ¡fica em Trabalhos e Contato", async () => {
    const [component, motion, works, contact, layout] = await Promise.all([
      source("src/components/editorial/EditorialTitleReveal.astro"),
      source("src/lib/motion/editorial-title.ts"),
      source("src/pages/trabalhos/index.astro"),
      source("src/pages/contato.astro"),
      source("src/layouts/IndexLayout.astro"),
    ]);

    expect(component).toContain("Array.from(title).map");
    expect(component).toContain("data-editorial-title-letter={index}");
    expect(component).toContain('aria-hidden="true"');
    expect(motion).toContain("initializeMotion");
    expect(motion).toContain('from: "start"');
    expect(motion).toContain('clearProps: "transform,opacity"');
    expect(layout).toContain('hasTitleReveal = family === "trabalhos"');
    expect(layout).toContain("<EditorialTitleReveal title={title} />");
    expect(works).toContain("initializeEditorialTitleMotion(root)");
    expect(contact).toContain("<EditorialTitleReveal title={contactTitle} />");
    expect(contact).toContain("initializeEditorialTitleMotion(root)");

    await expect(
      transform(component, { filename: "EditorialTitleReveal.astro" }),
    ).resolves.toHaveProperty("code");
    await expect(
      transform(contact, { filename: "contato.astro" }),
    ).resolves.toHaveProperty("code");
  });
});
