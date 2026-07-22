import { assertPublicIntegrity } from "../src/lib/seo/public-integrity.ts";
import { requirePublicSiteUrl } from "../src/lib/seo/site-url.ts";

try {
  const report = await assertPublicIntegrity({
    root: process.cwd(),
    base: requirePublicSiteUrl(),
  });
  console.log(
    `Integridade pública aprovada: ${report.publicPages} páginas indexáveis, ` +
      `${report.htmlPages} HTMLs auditados, ${report.socialImages} imagens sociais ` +
      `e ${report.structuredDataBlocks} blocos JSON-LD.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
