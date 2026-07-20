import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { createCollectionSchemas } from "./lib/content/schemas/collections.ts";

function idFromFilename({ entry }: { entry: string }): string {
  const filename = entry.replaceAll("\\", "/").split("/").at(-1) ?? entry;
  return filename.replace(/\.(?:md|mdx|ya?ml)$/i, "");
}

const references = {
  media: reference("midia"),
  person: reference("pessoas"),
  trabalho: reference("trabalhos"),
  caderno: reference("caderno"),
  colecao: reference("colecoes"),
};
const schemas = createCollectionSchemas(z.string().min(1), references);

const trabalhos = defineCollection({
  loader: glob({
    base: "./src/content/trabalhos",
    pattern: "**/*.{md,mdx}",
    generateId: idFromFilename,
  }),
  schema: schemas.trabalhos,
});

const caderno = defineCollection({
  loader: glob({
    base: "./src/content/caderno",
    pattern: "**/*.{md,mdx}",
    generateId: idFromFilename,
  }),
  schema: schemas.caderno,
});

const colecoes = defineCollection({
  loader: glob({
    base: "./src/content/colecoes",
    pattern: "**/*.md",
    generateId: idFromFilename,
  }),
  schema: schemas.colecoes,
});

const edicoes = defineCollection({
  loader: glob({
    base: "./src/content/edicoes",
    pattern: "**/*.{yaml,yml}",
    generateId: idFromFilename,
  }),
  schema: schemas.edicoes,
});

const midia = defineCollection({
  loader: glob({
    base: "./src/content/midia",
    pattern: "**/*.{yaml,yml}",
    generateId: idFromFilename,
  }),
  schema: ({ image }) => createCollectionSchemas(image(), references).midia,
});

const pessoas = defineCollection({
  loader: glob({
    base: "./src/content/pessoas",
    pattern: "**/*.{yaml,yml}",
    generateId: idFromFilename,
  }),
  schema: schemas.pessoas,
});

const paginas = defineCollection({
  loader: glob({
    base: "./src/content/paginas",
    pattern: "**/*.md",
    generateId: idFromFilename,
  }),
  schema: schemas.paginas,
});

export const collections = {
  trabalhos,
  caderno,
  colecoes,
  edicoes,
  midia,
  pessoas,
  paginas,
};
