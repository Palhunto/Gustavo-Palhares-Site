import { readdir } from "node:fs/promises";
import path from "node:path";

const assetsDirectory = path.join(process.cwd(), "dist", "_astro");
const files = await readdir(assetsDirectory, { recursive: true });
const leaked = files.filter((file) =>
  path.basename(file).startsWith("fase-5-"),
);

if (leaked.length > 0) {
  throw new Error(
    `Mídia privada da Fase 5A encontrada no build: ${leaked.join(", ")}`,
  );
}

console.log("Gate de mídia privada válido: nenhum ativo da Fase 5A em dist/.");
