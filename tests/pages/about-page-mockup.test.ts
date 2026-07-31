import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Página Sobre — mockup editorial responsivo", () => {
  it("reproduz a hierarquia editorial e mantém um único h1", async () => {
    const page = await source("src/pages/sobre.astro");

    expect(page.match(/<h1\b/g)).toHaveLength(1);
    expect(page).toContain("Publicação / Sobre");
    expect(page).toContain('class="about-page__title"');
    expect(page).toContain("Fotógrafo e estudante de Jornalismo");
    expect(page).toContain('class="about-page__biography"');
    expect(page.match(/class="about-page__detail"/g)).toHaveLength(3);
    expect(page).toContain(">Atuação</h2>");
    expect(page).toContain(">Abordagem</h2>");
    expect(page).toContain(">Formação</h2>");

    await expect(
      transform(page, { filename: "sobre.astro" }),
    ).resolves.toHaveProperty("code");
  });

  it("usa um placeholder local, explícito e com proporção reservada", async () => {
    const page = await source("src/pages/sobre.astro");
    const placeholderPath = path.join(
      root,
      "public",
      "images",
      "about-placeholder.svg",
    );
    await expect(access(placeholderPath)).resolves.toBeUndefined();
    const placeholder = await readFile(placeholderPath, "utf8");

    expect(page).toContain('src="/images/about-placeholder.svg"');
    expect(page).toContain('width="1600"');
    expect(page).toContain('height="1067"');
    expect(page).toContain(
      'alt="Espaço reservado para o retrato de Gustavo Palhares."',
    );
    expect(placeholder).toContain('viewBox="0 0 1600 1067"');
    expect(placeholder).toContain("RETRATO / PLACEHOLDER");
    expect(placeholder).not.toMatch(/(?:href|src)=["']https?:\/\/|data:image/i);
  });

  it("mantém CTAs nativos, sem handlers inline e com toque mínimo", async () => {
    const page = await source("src/pages/sobre.astro");
    const styles = await source("src/styles/site.css");

    expect(page).toContain("href={publicRoutes.trabalhosIndex}");
    expect(page).toContain("href={publicRoutes.contato}");
    expect(page.match(/class="about-page__actions type-nav"/g)).toHaveLength(1);
    expect(page).not.toMatch(
      /on:click|onclick=|role="button"|preventDefault/i,
    );
    expect(styles).toMatch(
      /\.about-page__actions a\s*\{[^}]*min-block-size:\s*2\.75rem/s,
    );
  });

  it("define composição adaptativa sem altura fixa de viewport", async () => {
    const styles = await source("src/styles/site.css");
    const aboutStyles = styles.slice(
      styles.indexOf("/* Sobre:"),
      styles.indexOf("/* Contato:"),
    );

    expect(aboutStyles).toContain(".about-page__profile");
    expect(aboutStyles).toContain(".about-page__portrait img");
    expect(aboutStyles).toContain("aspect-ratio: 3 / 2");
    expect(aboutStyles).toContain("@media (min-width: 48rem)");
    expect(aboutStyles).toContain("@media (min-width: 70rem)");
    expect(aboutStyles).toContain("@media (max-width: 47.99rem)");
    expect(aboutStyles).not.toMatch(/100(?:s|d|l)?vh|position:\s*fixed/i);
  });

  it("preserva foco global e elimina movimento de interação quando solicitado", async () => {
    const styles = await source("src/styles/site.css");
    const globalStyles = await source("src/styles/global.css");

    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain(
      '.about-page__actions a:focus-visible span[aria-hidden="true"]',
    );
    expect(globalStyles).toContain(":focus-visible");
  });

  it("mantém metadata e View Transitions dos trabalhos fora da página", async () => {
    const page = await source("src/pages/sobre.astro");

    expect(page).toContain('title="Sobre"');
    expect(page).toContain('variant="about-page"');
    expect(page).toContain("structuredData={structuredData}");
    expect(page).not.toMatch(/viewTransitions|WorkCoverViewTransitions/);
  });
});
