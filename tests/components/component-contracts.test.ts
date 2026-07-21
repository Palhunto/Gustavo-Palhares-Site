import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

import { ALLOWED_MDX_COMPONENTS } from "../../src/lib/content/mdx-policy.ts";
import { EDITORIAL_COMPONENT_NAMES } from "../../src/lib/mdx/component-names.ts";

const componentDir = path.join(process.cwd(), "src", "components", "editorial");

async function component(name: string): Promise<string> {
  return readFile(path.join(componentDir, `${name}.astro`), "utf8");
}

describe("contratos dos componentes editoriais", () => {
  it("mantém allowlist, arquivos e registro MDX sincronizados", async () => {
    expect(ALLOWED_MDX_COMPONENTS).toBe(EDITORIAL_COMPONENT_NAMES);
    const registry = await readFile(
      path.join(process.cwd(), "src", "lib", "mdx", "registry.ts"),
      "utf8",
    );
    for (const name of EDITORIAL_COMPONENT_NAMES) {
      await expect(component(name)).resolves.toContain("---");
      expect(registry).toMatch(new RegExp(`\\b${name}\\b`));
    }
  });

  it("compila todo o vocabulário fechado sem diretiva de hidratação", async () => {
    for (const name of EDITORIAL_COMPONENT_NAMES) {
      const source = await component(name);
      expect(source).not.toMatch(/client:[a-z-]+/);
      expect(source).not.toMatch(/<script(?:\s|>)/i);
      await expect(
        transform(source, { filename: `${name}.astro` }),
      ).resolves.toHaveProperty("code");
    }
  });

  it("usa elementos semânticos para figuras, sequências e informação", async () => {
    await expect(component("LeadImage")).resolves.toContain("<figure");
    await expect(component("PullQuote")).resolves.toContain("<blockquote>");
    await expect(component("MetadataBlock")).resolves.toContain("<dl");
    await expect(component("Credits")).resolves.toContain("<dl");
    await expect(component("ContactSheet")).resolves.toContain("<ol");
    await expect(component("FilmStrip")).resolves.toContain("<ol");
    await expect(component("RelatedWorks")).resolves.toContain("<ul");
    await expect(component("ContactSheet")).resolves.not.toContain(
      'role="list"',
    );
    await expect(component("FilmStrip")).resolves.not.toContain('role="list"');
    await expect(component("TextColumn")).resolves.toContain("<div");
  });

  it("aceita dados estruturados serializados sem abrir expressões MDX", async () => {
    const fixture = await readFile(
      path.join(
        process.cwd(),
        "tests",
        "fixtures",
        "content",
        "mdx",
        "component-valid.mdx",
      ),
      "utf8",
    );
    expect(fixture).toContain("<MetadataBlock items='");
    expect(fixture).toContain("<Credits items='");
    expect(fixture).toContain("<RelatedWorks items='");
    expect(fixture).not.toMatch(/items=\{/);
  });

  it("mantém a exploração técnica fora do índice e cobre o vocabulário", async () => {
    const route = await readFile(
      path.join(
        process.cwd(),
        "src",
        "pages",
        "exploracoes",
        "componentes-editoriais.astro",
      ),
      "utf8",
    );
    expect(route).toContain('content="noindex, nofollow"');
    expect(route).not.toMatch(/client:[a-z-]+/);
    for (const name of EDITORIAL_COMPONENT_NAMES) {
      expect(route).toContain(`<${name}`);
    }
  });
});
