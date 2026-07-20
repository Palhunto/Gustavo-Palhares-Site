import { runContentGate } from "../src/lib/content/index.ts";
import { offsetDateTimeSchema } from "../src/lib/content/schemas/shared.ts";

const configuredInstant = process.env.BUILD_INSTANT;
if (configuredInstant) offsetDateTimeSchema.parse(configuredInstant);
const buildInstant = configuredInstant
  ? new Date(configuredInstant)
  : new Date();
const baseRef =
  process.env.CONTENT_BASE_REF || process.env.GITHUB_BASE_SHA || undefined;

try {
  const dataset = await runContentGate({
    root: process.cwd(),
    buildInstant,
    baseRef,
  });
  const total = Object.values(dataset).reduce(
    (sum, entries) => sum + entries.length,
    0,
  );
  console.log(
    `Conteúdo válido: ${total} entradas em 7 collections; buildInstant=${buildInstant.toISOString()}${baseRef ? `; base=${baseRef}` : "; sem base histórica"}.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
