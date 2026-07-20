import { describe, expect, it } from "vitest";

import { loadContentFromDisk } from "../../src/lib/content/source-loader.ts";
import { COLLECTION_NAMES } from "../../src/lib/content/types.ts";

describe("camada local de conteúdo", () => {
  it("carrega exatamente sete collections com IDs derivados dos arquivos", async () => {
    const dataset = await loadContentFromDisk(process.cwd());
    expect(Object.keys(dataset).sort()).toEqual([...COLLECTION_NAMES].sort());
    expect(dataset.trabalhos[0].id).toBe("fixture-trabalho");
    expect(dataset.edicoes[0].id).toBe("001");
    expect(dataset.midia[0].data).not.toHaveProperty("width");
    expect(dataset.midia[0].data).not.toHaveProperty("height");
    expect(dataset.midia[0].data).not.toHaveProperty("format");
  });
});
