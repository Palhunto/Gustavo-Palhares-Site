import { inspectMediaBuild } from "../src/lib/media/build-gate.ts";

const result = await inspectMediaBuild(process.cwd());

console.log(
  `Gate de mídia válido: ${result.publicMediaIds.length} IDs públicos aprovados; ` +
    `${result.emittedMediaIds.length} IDs canônicos emitidos; ` +
    `${result.privateOnlyIds.length} IDs exclusivos do catálogo privado.`,
);
