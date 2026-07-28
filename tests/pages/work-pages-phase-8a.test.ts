import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

import { loadContentFromDisk } from "../../src/lib/content/source-loader.ts";
import {
  formatCompactEditorialDate,
  formatEditorialDate,
} from "../../src/lib/content/publication.ts";
import { referenceId } from "../../src/lib/content/schemas/shared.ts";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

const contracts = {
  "nephillin-uma-cobertura-sem-credencial": {
    date: "2026-07-19",
    dateEnd: undefined,
    gallery: [
      "fase-5-show-01-abertura",
      "fase-5-show-02-ambiente",
      "fase-5-show-03-silhueta",
      "fase-4-palco-02",
      "fase-4-palco-03",
      "fase-4-palco-04",
      "fase-5-show-07-confronto",
      "fase-5-show-08-encerramento",
    ],
  },
  "feira-do-rolo": {
    date: "2025-07-20",
    dateEnd: "2025-07-21",
    gallery: [
      "fase-4-mercado-01",
      "fase-5-rua-02-plano-geral",
      "fase-5-rua-03-personagem",
      "fase-4-mercado-02",
      "fase-5-rua-05-relacao",
      "fase-5-rua-06-detalhe",
      "fase-5-rua-07-espaco",
      "fase-5-rua-08-sequencia",
      "fase-4-retrato-amplo",
    ],
  },
} as const;

describe("Fase 8A — estrutura estável das páginas de trabalhos", () => {
  it("centraliza o intervalo editorial público sem alterar as datas canônicas", async () => {
    expect(formatEditorialDate("2025-07-20", "2025-07-21")).toBe(
      "20–21 de julho de 2025",
    );
    expect(formatCompactEditorialDate("2025-07-20", "2025-07-21")).toBe(
      "20–21 de julho de 2025",
    );

    const dataset = await loadContentFromDisk(root);
    const feira = dataset.trabalhos.find(
      (entry) => entry.id === "feira-do-rolo",
    );
    expect(feira?.data.date).toBe("2025-07-20");
    expect(feira?.data.dateEnd).toBe("2025-07-21");
  });

  it("preserva a ordem integral das oito e nove fotografias", async () => {
    const dataset = await loadContentFromDisk(root);

    for (const [id, contract] of Object.entries(contracts)) {
      const work = dataset.trabalhos.find((entry) => entry.id === id);
      expect(work?.data.date).toBe(contract.date);
      expect(work?.data.dateEnd).toBe(contract.dateEnd);
      expect(work?.data.gallery.map((use) => referenceId(use.asset))).toEqual(
        contract.gallery,
      );
    }
  });

  it("mantém as composições editoriais e a numeração aprovadas", async () => {
    const nephillin = await source(
      "src/content/trabalhos/nephillin-uma-cobertura-sem-credencial.mdx",
    );
    const feira = await source("src/content/trabalhos/feira-do-rolo.mdx");

    expect(nephillin).toMatch(
      /<Diptych[\s\S]*numbers="02,03"[\s\S]*balance="end-emphasis"/,
    );
    expect(nephillin).toMatch(
      /<Triptych[\s\S]*numbers="04,05,06"[\s\S]*layout="mosaic"/,
    );
    expect(nephillin).toMatch(
      /<Diptych[\s\S]*numbers="07,08"[\s\S]*creditMode="document"/,
    );
    expect(feira).toMatch(/<Diptych[\s\S]*numbers="02,03"/);
    expect(feira).toMatch(/<ContactSheet[\s\S]*numbers="04,05,06,07,08,09"/);
  });

  it("expõe hooks semânticos sem criar classes de efeito", async () => {
    const layout = await source("src/layouts/WorkLayout.astro");
    const diptych = await source("src/components/editorial/Diptych.astro");
    const triptych = await source("src/components/editorial/Triptych.astro");
    const contactSheet = await source(
      "src/components/editorial/ContactSheet.astro",
    );
    const caption = await source(
      "src/components/editorial/_FigureCaption.astro",
    );
    const combined = [layout, diptych, triptych, contactSheet, caption].join(
      "\n",
    );

    for (const hook of [
      "data-work-page",
      "data-work-intro",
      "data-work-title",
      "data-work-summary",
      "data-work-metadata",
      "data-work-lead",
      "data-work-gallery",
      "data-work-figure",
      "data-work-number",
      "data-work-contact-sheet",
      "data-work-credit",
      "data-work-continuity",
    ]) {
      expect(combined).toContain(hook);
    }
    expect(combined).not.toMatch(
      /class="[^"]*(?:reveal|animate|motion)[^"]*"/i,
    );
  });

  it("preserva semântica, navegação nativa e apenas um h1", async () => {
    const layout = await source("src/layouts/WorkLayout.astro");
    const continuity = layout
      .split('<nav\n      class="work-continuity"', 2)[1]
      .split("</nav>", 1)[0];

    expect(layout.match(/<h1\b/g)).toHaveLength(1);
    expect(layout).toContain('<article class="work-document"');
    expect(layout).toContain('<div class="work-body" data-work-gallery>');
    expect(layout).toContain("<Credits items={credits}");
    expect(continuity).toContain('aria-label="Continuidade dos trabalhos"');
    expect(continuity.match(/<a\b/g)).toHaveLength(1);
    expect(continuity).toContain("href={publicRoutes.trabalhosIndex}");
    expect(continuity).toContain("VER TODOS OS TRABALHOS");
    expect(continuity).toContain('aria-hidden="true">→</span>');
    expect(continuity).not.toMatch(/picture|summary|metadata|article/i);
  });

  it("remove relacionados da superfície pública e do vocabulário editorial", async () => {
    const files = await Promise.all(
      [
        "src/layouts/WorkLayout.astro",
        "src/pages/trabalhos/[slug].astro",
        "src/styles/site.css",
        "src/styles/components.css",
        "src/lib/motion/nephillin-work.ts",
        "src/lib/motion/feira-work.ts",
        "src/lib/motion/kauan-work.ts",
        "src/lib/mdx/registry.ts",
        "src/lib/mdx/component-names.ts",
        "src/components/editorial/index.ts",
      ].map(source),
    );
    const combined = files.join("\n");

    expect(combined).not.toMatch(
      /RelatedWorks|publicRelatedWorks|data-work-related|\.related-works|--work-related/,
    );
    await expect(
      access(
        path.join(root, "src", "components", "editorial", "RelatedWorks.astro"),
      ),
    ).rejects.toThrow();
  });

  it("mantém a transição apenas na abertura e JavaScript isolado da galeria", async () => {
    const files = await Promise.all(
      [
        "src/layouts/WorkLayout.astro",
        "src/pages/trabalhos/[slug].astro",
        "src/components/editorial/LeadImage.astro",
        "src/components/editorial/Diptych.astro",
        "src/components/editorial/Triptych.astro",
        "src/components/editorial/ContactSheet.astro",
      ].map(async (file) => ({ file, source: await source(file) })),
    );
    const lead = files.find((file) =>
      file.file.endsWith("LeadImage.astro"),
    )!.source;
    const internal = files
      .filter((file) =>
        /(?:Diptych|Triptych|ContactSheet)\.astro$/.test(file.file),
      )
      .map((file) => file.source)
      .join("\n");
    const combined = files.map((file) => file.source).join("\n");

    expect(lead).toContain("viewTransitionName");
    expect(lead).toContain("view-transition-name:");
    expect(internal).not.toMatch(/viewTransitionName|view-transition-name/);
    expect(combined).not.toMatch(/gsap|ScrollTrigger|ClientRouter/i);
  });

  it("mantém todos os componentes Astro alterados compiláveis", async () => {
    for (const file of [
      "src/layouts/WorkLayout.astro",
      "src/components/editorial/Diptych.astro",
      "src/components/editorial/Triptych.astro",
      "src/components/editorial/ContactSheet.astro",
      "src/components/editorial/_FigureCaption.astro",
    ]) {
      await expect(
        source(file).then((value) =>
          transform(value, { filename: path.basename(file) }),
        ),
      ).resolves.toHaveProperty("code");
    }
  });
});
