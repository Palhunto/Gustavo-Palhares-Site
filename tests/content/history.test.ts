import { describe, expect, it } from "vitest";

import { compareHistoricalContent } from "../../src/lib/content/history.ts";
import {
  BUILD_INSTANT,
  cloneDataset,
  validDataset,
} from "../fixtures/content/scenarios.ts";

describe("imutabilidade histórica", () => {
  it("ignora corretamente a ausência de base no primeiro commit", async () => {
    const current = await validDataset();
    expect(
      compareHistoricalContent(current, undefined, "", BUILD_INSTANT),
    ).toEqual([]);
  });

  it("distingue correção textual de mudança de composição", async () => {
    const base = await validDataset();
    const current = cloneDataset(base);
    current.edicoes[0].data.title = "Correção textual permitida";
    expect(compareHistoricalContent(current, base, "", BUILD_INSTANT)).toEqual(
      [],
    );
  });

  it("rejeita alteração estrutural sem revisão e corrigenda", async () => {
    const base = await validDataset();
    const current = cloneDataset(base);
    current.edicoes[0].data.blocks.reverse();
    const codes = compareHistoricalContent(
      current,
      base,
      "",
      BUILD_INSTANT,
    ).map((issue) => issue.code);
    expect(codes).toContain("edition-revision");
    expect(codes).toContain("edition-corrigenda");
  });

  it("aceita alteração estrutural com revisão e decisão de corrigenda", async () => {
    const base = await validDataset();
    const current = cloneDataset(base);
    current.edicoes[0].data.blocks.reverse();
    current.edicoes[0].data.compositionRevision = 2;
    current.edicoes[0].data.corrigendaDecision = "ADR-999";
    const decisions = `## ADR-999 — Corrigenda da edição 001\n\nCorrigenda aprovada.`;
    expect(
      compareHistoricalContent(current, base, decisions, BUILD_INSTANT),
    ).toEqual([]);
  });

  it("impede reutilização de número de arquivo", async () => {
    const base = await validDataset();
    const current = cloneDataset(base);
    current.trabalhos[0].id = "outro-trabalho";
    const codes = compareHistoricalContent(
      current,
      base,
      "",
      BUILD_INSTANT,
    ).map((issue) => issue.code);
    expect(codes).toContain("archive-reused");
  });
});
