import { readFile } from "node:fs/promises";
import path from "node:path";

import { transform } from "@astrojs/compiler";
import { describe, expect, it } from "vitest";

import {
  WORK_COVER_VIEW_TRANSITION_NAMES,
  workCoverViewTransitionName,
} from "../../src/lib/view-transitions/work-cover.ts";

const root = process.cwd();

async function source(relativePath: string): Promise<string> {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Fase 7C — View Transitions nativas dos trabalhos", () => {
  it("mantém dois nomes únicos, estáveis e restritos aos trabalhos elegíveis", () => {
    expect(WORK_COVER_VIEW_TRANSITION_NAMES).toEqual([
      "work-nephillin-cover",
      "work-feira-do-rolo-cover",
    ]);
    expect(new Set(WORK_COVER_VIEW_TRANSITION_NAMES).size).toBe(2);
    expect(
      workCoverViewTransitionName("nephillin-uma-cobertura-sem-credencial"),
    ).toBe("work-nephillin-cover");
    expect(workCoverViewTransitionName("feira-do-rolo")).toBe(
      "work-feira-do-rolo-cover",
    );
    expect(workCoverViewTransitionName("trabalho-inelegivel")).toBeUndefined();
  });

  it("faz opt-in somente pela homepage, listagem e trabalho elegível", async () => {
    const homepage = await source("src/pages/index.astro");
    const worksIndex = await source("src/pages/trabalhos/index.astro");
    const workPage = await source("src/pages/trabalhos/[slug].astro");
    const workLayout = await source("src/layouts/WorkLayout.astro");
    const indexLayout = await source("src/layouts/IndexLayout.astro");
    const baseLayout = await source("src/layouts/BaseLayout.astro");
    const otherPages = await Promise.all(
      [
        "src/pages/caderno/index.astro",
        "src/pages/colecoes/index.astro",
        "src/pages/sobre.astro",
        "src/pages/contato.astro",
      ].map(source),
    );

    expect(homepage).toContain("viewTransitions");
    expect(worksIndex).toContain("viewTransitions");
    expect(indexLayout).toContain("viewTransitions={viewTransitions}");
    expect(workPage).toContain("workCoverViewTransitionName(entry.data.slug)");
    expect(workLayout).toContain(
      "viewTransitions={Boolean(viewTransitionName)}",
    );
    expect(baseLayout).toContain("viewTransitions && (");
    expect(baseLayout).toContain(
      "<WorkCoverViewTransitions activeName={viewTransitionName} />",
    );
    expect(workLayout).toContain("viewTransitionName={viewTransitionName}");
    expect(otherPages.join("\n")).not.toContain("viewTransitions");
  });

  it("conecta wrappers estáveis que usam a mesma mídia de capa", async () => {
    const homeWorks = await source("src/components/home/HomeWorks.astro");
    const worksIndex = await source("src/pages/trabalhos/index.astro");
    const workLayout = await source("src/layouts/WorkLayout.astro");
    const editorialImage = await source(
      "src/components/editorial/EditorialImage.astro",
    );
    const leadImage = await source("src/components/editorial/LeadImage.astro");
    const homeMotion = await source("src/lib/motion/home-works.ts");

    expect(homeWorks).toContain("asset={work.data.cover}");
    expect(homeWorks).toContain("viewTransitionName={viewTransitionName}");
    expect(worksIndex).toContain("asset={work.data.cover}");
    expect(worksIndex).toContain("workCoverViewTransitionName(work.data.slug)");
    expect(
      worksIndex.match(/viewTransitionName=\{viewTransitionName\}/g),
    ).toHaveLength(1);
    expect(worksIndex).not.toMatch(
      /work-nephillin-cover|work-feira-do-rolo-cover/,
    );
    expect(workLayout).toContain("asset={cover as never}");
    expect(workLayout).toContain("viewTransitionName={viewTransitionName}");
    expect(editorialImage).toContain(
      "`view-transition-name: ${viewTransitionName};`",
    );
    expect(editorialImage).toContain('class="work-cover-transition-frame"');
    expect(leadImage).toContain(
      "`view-transition-name: ${viewTransitionName};`",
    );
    expect(leadImage).toContain('class="work-cover-transition-frame"');
    expect(homeMotion).toContain(
      '"[data-home-works-image] .editorial-picture"',
    );
    expect(homeMotion).not.toMatch(/view-transition-name|editorial-image/);
  });

  it("usa somente o mecanismo nativo entre documentos", async () => {
    const styles = await source(
      "src/components/global/WorkCoverViewTransitions.astro",
    );
    const homepage = await source("src/pages/index.astro");
    const worksIndex = await source("src/pages/trabalhos/index.astro");
    const workPage = await source("src/pages/trabalhos/[slug].astro");
    const combined = `${styles}\n${homepage}\n${worksIndex}\n${workPage}`;

    expect(styles).toContain("@view-transition");
    expect(styles).toContain("navigation: auto");
    expect(styles).toContain('const groupSelectors = selectors("group")');
    expect(styles).toContain("::view-transition-old(root)");
    expect(styles).toContain("::view-transition-new(root)");
    expect(combined).not.toMatch(
      /ClientRouter|transition:animate|preventDefault|startViewTransition|navigation\.navigate/i,
    );
    expect(combined).not.toMatch(/addEventListener\(\s*["']click/i);
  });

  it("mantém a fotografia dominante e o root subordinado", async () => {
    const styles = await source(
      "src/components/global/WorkCoverViewTransitions.astro",
    );

    expect(styles).toContain("animation-duration: 760ms");
    expect(styles).toContain("animation-duration: 680ms");
    expect(styles).toContain("cubic-bezier(0.22, 1, 0.36, 1)");
    expect(styles).toContain("oldImageSelectors");
    expect(styles).toContain("newImageSelectors");
    expect(styles).toContain(
      "WORK_COVER_VIEW_TRANSITION_NAMES.filter((name) => name !== activeName)",
    );
    expect(styles).toContain("${inactiveOldImageRule}");
    expect(styles).toMatch(
      /::view-transition-old\(root\)\s*\{[^}]*animation:\s*none;[^}]*opacity:\s*0;/s,
    );
    expect(styles).toContain("work-transition-root-in 120ms");
    expect(styles).not.toMatch(/rotate|bounce|parallax|scale\(/i);
  });

  it("cobre movimento reduzido sem depender de JavaScript", async () => {
    const styles = await source(
      "src/components/global/WorkCoverViewTransitions.astro",
    );

    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain("animation-duration: 1ms !important");
    expect(styles).toContain("animation-delay: 0s !important");
    expect(styles).not.toMatch(/<script|import\s+.*gsap|ScrollTrigger/i);
  });

  it("preserva links nativos e não intercepta a navegação dos trabalhos", async () => {
    const homeWorks = await source("src/components/home/HomeWorks.astro");
    const worksIndex = await source("src/pages/trabalhos/index.astro");
    const indexLayout = await source("src/layouts/IndexLayout.astro");
    const workPage = await source("src/pages/trabalhos/[slug].astro");
    const workLayout = await source("src/layouts/WorkLayout.astro");
    const nephillinEntry = await source(
      "src/components/editorial/NephillinWorkMotion.astro",
    );

    expect(homeWorks).toContain("href={publicRoutes.trabalho(work.data.slug)}");
    expect(homeWorks).not.toMatch(/on:click|onclick|role="button"/i);
    expect(worksIndex).toContain("<a href={href}");
    expect(
      `${worksIndex}\n${indexLayout}\n${workPage}\n${workLayout}\n${nephillinEntry}`,
    ).not.toMatch(
      /ClientRouter|preventDefault|startViewTransition|addEventListener\(\s*["']click/i,
    );
  });

  it("mantém os componentes Astro compiláveis e o conteúdo estático", async () => {
    const files = await Promise.all(
      [
        "src/components/global/WorkCoverViewTransitions.astro",
        "src/components/editorial/EditorialImage.astro",
        "src/components/editorial/LeadImage.astro",
        "src/components/home/HomeWorks.astro",
        "src/layouts/BaseLayout.astro",
        "src/layouts/IndexLayout.astro",
        "src/layouts/WorkLayout.astro",
        "src/pages/trabalhos/index.astro",
      ].map(async (file) => ({
        file,
        source: await source(file),
      })),
    );

    for (const file of files) {
      await expect(
        transform(file.source, { filename: path.basename(file.file) }),
      ).resolves.toHaveProperty("code");
    }
  });
});
