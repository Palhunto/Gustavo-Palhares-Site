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

  it("mantém uma única numeração editorial na folha de contato", async () => {
    const contactSheet = await component("ContactSheet");
    const styles = await readFile(
      path.join(process.cwd(), "src", "styles", "components.css"),
      "utf8",
    );
    expect(contactSheet).toContain('<ol class="contact-sheet__grid">');
    expect(contactSheet.match(/contact-sheet__index/g)).toHaveLength(1);
    expect(contactSheet).toContain("editorial-photo-number");
    expect(contactSheet).toContain("resolveEditorialNumbers(");
    expect(contactSheet).not.toMatch(/index\s*\+\s*1/);
    expect(styles).toMatch(
      /\.contact-sheet__grid\s*\{[^}]*list-style:\s*none/s,
    );
  });

  it("centraliza números editoriais explícitos sem contadores locais", async () => {
    const { resolveEditorialNumber, resolveEditorialNumbers } =
      await import("../../src/lib/mdx/editorial-numbers.ts");
    expect(resolveEditorialNumbers("04,05,06", 3, "Fixture")).toEqual([
      "04",
      "05",
      "06",
    ]);
    expect(resolveEditorialNumber("01", "Fixture")).toBe("01");
    expect(() => resolveEditorialNumbers("01,01", 2, "Fixture")).toThrow(
      /repetidos/,
    );
    expect(() => resolveEditorialNumber("1", "Fixture")).toThrow(
      /dois dígitos/,
    );

    for (const name of ["Diptych", "Triptych", "FilmStrip", "ContactSheet"]) {
      const source = await component(name);
      expect(source).toContain("resolveEditorialNumbers(");
      expect(source).not.toMatch(/index\s*\+\s*1/);
    }
    for (const name of ["LeadImage", "FullBleed"]) {
      await expect(component(name)).resolves.toContain(
        "resolveEditorialNumber(",
      );
    }
  });

  it("deduplica crédito comum por dados e preserva créditos diferentes", async () => {
    const { commonMediaCredit } =
      await import("../../src/lib/media/credits.ts");
    const media = (name: string) => ({ credit: { role: "fotografia", name } });
    expect(
      commonMediaCredit([
        media("Gustavo Palhares"),
        media("Gustavo Palhares"),
      ] as never),
    ).toEqual({
      role: "fotografia",
      name: "Gustavo Palhares",
    });
    expect(
      commonMediaCredit([media("Autoria A"), media("Autoria B")] as never),
    ).toBeUndefined();
    for (const name of ["Diptych", "Triptych", "FilmStrip"]) {
      const source = await component(name);
      expect(source).toContain("commonMediaCredit(media)");
      expect(source).toContain(
        'showCredit={creditMode === "auto" && !sharedCredit}',
      );
      expect(source).toContain("<SharedCredit");
      expect(source).toContain('creditMode?: "auto" | "document"');
    }
  });

  it("permite um único crédito documental nas páginas de trabalho", async () => {
    for (const name of [
      "LeadImage",
      "FullBleed",
      "Diptych",
      "Triptych",
      "FilmStrip",
    ]) {
      const source = await component(name);
      expect(source).toContain('creditMode?: "auto" | "document"');
      expect(source).toContain('creditMode = "auto"');
    }
    const layout = await readFile(
      path.join(process.cwd(), "src", "layouts", "WorkLayout.astro"),
      "utf8",
    );
    expect(layout).toContain('creditMode="document"');
    expect(layout).toContain("<Credits items={credits}");
  });

  it("não renderiza o bloco de relacionados quando a lista está vazia", async () => {
    const related = await component("RelatedWorks");
    expect(related).toContain("resolvedItems.length > 0");
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
