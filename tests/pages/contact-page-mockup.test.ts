import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Página Contato — mockup editorial responsivo", () => {
  it("reproduz as seções 03 e 04 com um único h1", async () => {
    const page = await source("src/pages/contato.astro");

    expect(page.match(/<h1\b/g)).toHaveLength(1);
    expect(page).toContain('class="contact-page__number number-stable"');
    expect(page).toContain("Canais públicos e projetos");
    expect(page).toContain("Para projetos fotográficos");
    expect(page).toContain("Para agilizar a conversa");
    expect(page).toContain('id="titulo-indice">Índice</h2>');
    expect(page).toContain("Navegue por tudo");
    expect(page.match(/class="contact-page__index-item"/g)).toHaveLength(3);
    expect(page).toContain("Projetos fotográficos");
    expect(page).toContain("Parcerias e imprensa");
    expect(page).toContain("Outros contatos");

    await expect(
      transform(page, { filename: "contato.astro" }),
    ).resolves.toHaveProperty("code");
  });

  it("mantém os três canais como links nativos e semanticamente nomeados", async () => {
    const page = await source("src/pages/contato.astro");

    expect(page).toContain("https://wa.me/5514997173521");
    expect(page).toContain("https://www.instagram.com/gustavopalharess/");
    expect(page).toContain("mailto:gustavo.palhares49@gmail.com");
    expect(page).toContain('<address class="contact-page__channels"');
    expect(page).toContain("accessibleName");
    expect(page).not.toMatch(
      /<form|<input|<button|role="button"|on:click|onclick=|preventDefault|addEventListener/i,
    );
  });

  it("usa rota pública nativa no CTA e áreas interativas de pelo menos 44 px", async () => {
    const page = await source("src/pages/contato.astro");
    const styles = await source("src/styles/site.css");

    expect(page).toContain("href={publicRoutes.trabalhosIndex}");
    expect(page.match(/contact-page__index-action type-nav/g)).toHaveLength(1);
    expect(styles).toMatch(
      /\.contact-page__channel\s*\{[^}]*min-block-size:\s*4\.5rem/s,
    );
    expect(styles).toMatch(
      /\.contact-page__index-action\s*\{[^}]*min-block-size:\s*2\.75rem/s,
    );
  });

  it("remove o cabeçalho global e preserva metadata da página pública", async () => {
    const page = await source("src/pages/contato.astro");

    expect(page).toContain('title="Contato"');
    expect(page).toContain('robots="index, follow"');
    expect(page).toContain('variant="contact-page"');
    expect(page).toContain("showHeader={false}");
    expect(page).not.toMatch(/viewTransitions|WorkCoverViewTransitions/);
  });

  it("define composição responsiva sem altura fixa ou scroll customizado", async () => {
    const styles = await source("src/styles/site.css");
    const contactStart = styles.indexOf("/* Contato:");
    const contactStyles = styles.slice(
      contactStart,
      styles.indexOf(".works-index__metadata", contactStart),
    );

    expect(contactStyles).toContain(".contact-page__main");
    expect(contactStyles).toContain(".contact-page__index-grid");
    expect(contactStyles).toContain("@media (min-width: 64rem)");
    expect(contactStyles).toContain("@media (max-width: 63.99rem)");
    expect(contactStyles).toContain("@media (max-width: 47.99rem)");
    expect(contactStyles).not.toMatch(
      /100(?:s|d|l)?vh|position:\s*fixed|scroll-behavior|overflow:\s*hidden/i,
    );
  });

  it("preserva foco global e neutraliza a microinteração em movimento reduzido", async () => {
    const styles = await source("src/styles/site.css");
    const globalStyles = await source("src/styles/global.css");

    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain(
      '.contact-page__index-action:focus-visible span[aria-hidden="true"]',
    );
    expect(globalStyles).toContain(":focus-visible");
  });

  it("uniformiza explicitamente o fundo da faixa de orientação", async () => {
    const styles = await source("src/styles/site.css");

    expect(styles).toMatch(
      /\.contact-page__prompt\s*\{[^}]*background:\s*var\(--color-paper\)/s,
    );
    expect(styles).toContain("box-shadow: 0 0 0 100vmax var(--color-paper)");
  });
});
