import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

import {
  homepageEditorialCopy,
  homepageEditorialSelection,
  homepageSections,
} from "../../src/config/homepage.ts";
import {
  formatCompactEditorialDate,
  isIndividuallyPublic,
  sortWorksByDate,
} from "../../src/lib/content/publication.ts";
import { referenceId } from "../../src/lib/content/schemas/shared.ts";
import { loadContentFromDisk } from "../../src/lib/content/source-loader.ts";
import { buildHomepageModel } from "../../src/lib/homepage/model.ts";

const root = process.cwd();
const at = new Date("2026-07-22T12:00:00-03:00");

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Fases 6A e 6B — homepage editorial", () => {
  it("deriva a composição somente dos trabalhos públicos e mantém a capa independente", async () => {
    const dataset = await loadContentFromDisk(root);
    const model = buildHomepageModel({
      works: dataset.trabalhos as never,
      at,
    });

    expect(model.works.map((entry) => entry.id)).toEqual([
      "kauan-felix-uma-noite-de-k-1",
      "nephillin-uma-cobertura-sem-credencial",
      "magma",
      "feira-do-rolo",
    ]);
    expect(model.featuredWorks.map((entry) => entry.id)).toEqual([
      "nephillin-uma-cobertura-sem-credencial",
      "feira-do-rolo",
    ]);
    expect(model.cover.work.id).toBe("kauan-felix-uma-noite-de-k-1");
    expect(referenceId(model.cover.media.asset)).toBe(
      "kauan-k1-01",
    );
    expect(referenceId(model.featuredWorks[0].data.cover.asset)).toBe(
      "fase-5-show-01-abertura",
    );
    expect(referenceId(model.cover.media.asset)).not.toBe(
      referenceId(model.featuredWorks[0].data.cover.asset),
    );

    const coverMedia = dataset.midia.find(
      (entry) => entry.id === referenceId(model.cover.media.asset),
    );
    expect(coverMedia?.data.rights.status).toBe("cleared");
    expect(
      dataset.edicoes.filter((entry) => isIndividuallyPublic(entry, at)),
    ).toHaveLength(0);
  });

  it("mantém quatro momentos, um único h1 e hooks estáticos para movimento futuro", async () => {
    const composition = await source("src/components/home/HomePage.astro");
    const route = await source("src/pages/index.astro");
    const components = ["HomeCover", "HomeWorks", "HomePresence", "HomeIndex"];
    let previous = -1;
    for (const component of components) {
      const position = composition.indexOf(`<${component}`);
      expect(position).toBeGreaterThan(previous);
      previous = position;
    }

    const fragments = await Promise.all(
      ["HomeCover", "HomeWorks", "HomePresence", "HomeIndex"].map((name) =>
        source(`src/components/home/${name}.astro`),
      ),
    );
    const combined = fragments.join("\n");
    for (const section of homepageSections) {
      expect(combined).toContain(`id="${section.id}"`);
      expect(combined).toContain(`data-motion-section="${section.id}"`);
    }
    expect(combined.match(/<h1\b/g)).toHaveLength(1);
    expect(route).not.toContain("showHeader={false}");
    expect(combined).toContain("home-cover__title-line");
    expect(combined).toContain("home-cover__title-rule");
    expect(combined).toContain("data-motion-rule");
    expect(combined).not.toMatch(
      /IntersectionObserver|<script|gsap|lightbox|ClientRouter/i,
    );
  });

  it("remove o vínculo fictício com edições, revisão e corrigenda", async () => {
    const files = await Promise.all(
      [
        "src/pages/index.astro",
        "src/config/homepage.ts",
        "src/lib/homepage/model.ts",
        "src/components/home/HomePage.astro",
        "src/components/home/HomeCover.astro",
      ].map(source),
    );
    const combined = files.join("\n");
    expect(combined).not.toMatch(
      /Edição 001|EDIÇÃO 001|julho de 2026|compositionRevision|corrigendaDecision|ADR-025|HomeEdition|getCollection\("edicoes"\)/i,
    );
    expect(combined).toContain("Publicação pessoal");
    expect(combined).toContain("Fotografia documental / produção dirigida");
    expect(combined).toContain("Fotografia documental e produção dirigida.");
    expect(combined).toContain('enterLabel: "Ver trabalhos"');
  });

  it("centraliza a presença factual e mantém o índice conciso", async () => {
    expect(homepageEditorialCopy.presence.map((item) => item.action)).toEqual([
      "Conhecer",
      "Entrar em contato",
    ]);
    expect(homepageEditorialSelection).toMatchObject({
      coverWorkId: "kauan-felix-uma-noite-de-k-1",
      featuredWorkId: "nephillin-uma-cobertura-sem-credencial",
      coverMedia: { asset: "kauan-k1-01" },
    });

    const index = await source("src/components/home/HomeIndex.astro");
    const presence = await source("src/components/home/HomePresence.astro");
    const works = await source("src/components/home/HomeWorks.astro");
    expect(index).toContain("Trabalhos");
    expect(index).toContain("{work.data.title}");
    expect(index).toContain('class="home-index__list"');
    expect(index).toContain("indexGroups.map");
    expect(index).toContain('class="home-index__details"');
    expect(index).toContain('class="home-index__action type-nav"');
    expect(index).not.toContain("data-home-index-item-state");
    expect(presence).toContain('class="home-presence__feature"');
    expect(presence).toContain('class="home-presence__secondary"');
    expect(presence).toContain('class="home-presence__contacts"');
    expect(works).toContain("home-work--lead");
    expect(works).toContain("home-work--reverse");
    expect(homepageEditorialCopy.presence.map((item) => item.title)).toEqual([
      "Sobre",
      "Contato",
    ]);
  });

  it("reproduz o cabeçalho compacto e integra a identificação editorial à capa", async () => {
    const header = await source("src/components/global/SiteHeader.astro");
    const cover = await source("src/components/home/HomeCover.astro");
    const styles = await source("src/styles/site.css");

    expect(header).toContain(
      "isHomepage && item.href === publicRoutes.contato",
    );
    expect(header).toContain('class="site-header__external-mark"');
    expect(header).toContain('aria-hidden="true"');
    expect(cover).toMatch(
      /homepageEditorialCopy\.coverLabel[\s\S]*?<span aria-hidden="true">·<\/span>[\s\S]*?homepageEditorialCopy\.coverStatus/,
    );
    expect(styles).toMatch(
      /\.public-page--homepage \.site-identity__role\s*\{\s*display: none;/,
    );
    expect(styles).toMatch(/\.home-cover__status-rule\s*\{\s*display: none;/);
  });

  it("mantém componentes compiláveis e evita altura de viewport na capa", async () => {
    for (const name of [
      "HomePage",
      "HomeCover",
      "HomeWorks",
      "HomePresence",
      "HomeIndex",
      "HomeSectionHeading",
      "HomeFooter",
    ]) {
      const component = await source(`src/components/home/${name}.astro`);
      await expect(
        transform(component, { filename: `${name}.astro` }),
      ).resolves.toHaveProperty("code");
    }

    const styles = await source("src/styles/site.css");
    const globalStyles = await source("src/styles/global.css");
    const motionStyles = await source("src/styles/motion.css");
    const homepageStyles = styles.slice(
      styles.indexOf("/* Homepage editorial:"),
    );
    expect(homepageStyles).not.toMatch(/100(?:s|d|l)?vh|homepage-edition/);
    expect(homepageStyles).not.toMatch(
      /home-presence__grid|home-index__grid|home-index__column/,
    );
    expect(homepageStyles).not.toMatch(
      /(?:^|\n)\s*(?:opacity|visibility|animation)\s*:/,
    );
    expect(homepageStyles).toContain(".home-cover__title-rule");
    expect(homepageStyles).toContain("aspect-ratio: 3 / 2");
    expect(homepageStyles).toContain(".home-presence__composition");
    expect(homepageStyles).toMatch(
      /\.home-presence__title-clip\s*\{[^}]*overflow:\s*hidden;[^}]*margin-block-start:\s*-0\.15em;[^}]*padding-block:\s*0\.25em 0\.05em/s,
    );
    expect(homepageStyles).toContain(".home-index__list");
    expect(homepageStyles).toContain(".site-footer.home-footer");
    expect(homepageStyles).toContain("@media (max-width: 63.99rem)");
    expect(homepageStyles).toContain("@media (max-width: 47.99rem)");
    expect(homepageStyles).toMatch(
      /\.home-cover__rail-item:nth-child\(even\)\s*\{[^}]*border-inline-start:[^}]*padding-inline-start: var\(--space-3\)/s,
    );
    expect(homepageStyles).not.toContain(
      ".home-cover__rail-item:nth-child(n + 3)",
    );
    expect(homepageStyles).toMatch(
      /@media \(max-width: 47\.99rem\)[\s\S]*?\.home-cover__rail-item a::after\s*\{\s*display: none;/,
    );
    expect(homepageStyles).toContain("min-block-size: 2.75rem");
    expect(globalStyles).toContain(":focus-visible");
    expect(motionStyles).toContain("prefers-reduced-motion: reduce");
  });

  it("reserva monograma e canais reais ao rodapé específico da homepage", async () => {
    const footer = await source("src/components/home/HomeFooter.astro");
    const layout = await source("src/layouts/BaseLayout.astro");

    expect(layout).toContain(
      'variant === "homepage" ? <HomeFooter /> : <SiteFooter />',
    );
    expect(footer).toContain('class="home-footer__monogram"');
    expect(footer).toContain("https://www.instagram.com/palhares.doc/");
    expect(footer).toContain("mailto:gustavo.palhares49@gmail.com");
    expect(footer.match(/target="_blank"/g)).toHaveLength(2);
    expect(footer.match(/rel="noopener noreferrer"/g)).toHaveLength(2);
    expect(footer.match(/<svg\b/g)).toHaveLength(2);
    await expect(
      transform(footer, { filename: "HomeFooter.astro" }),
    ).resolves.toHaveProperty("code");
  });

  it("apresenta intervalos compactos sem alterar as datas canônicas", () => {
    expect(formatCompactEditorialDate("2025-07-20", "2025-07-21")).toBe(
      "20–21 de julho de 2025",
    );
    expect(formatCompactEditorialDate("2026-07-19")).toBe(
      "19 de julho de 2026",
    );
  });

  it("preserva a mesma ordem editorial usada pelo índice público", async () => {
    const dataset = await loadContentFromDisk(root);
    const ordered = sortWorksByDate(
      dataset.trabalhos.filter(
        (entry) =>
          entry.id === "nephillin-uma-cobertura-sem-credencial" ||
          entry.id === "feira-do-rolo",
      ),
    );
    expect(ordered.map((entry) => entry.data.title.split(" — ")[0])).toEqual([
      "Nephillin",
      "Feira do Rolo",
    ]);
  });
});
