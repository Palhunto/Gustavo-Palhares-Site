import { describe, expect, it } from "vitest";

import { validateIntegrity } from "../../src/lib/content/integrity.ts";
import { runContentGate } from "../../src/lib/content/index.ts";
import {
  BUILD_INSTANT,
  cloneDataset,
  invalidScenarios,
  validDataset,
  withAllValidStates,
} from "../fixtures/content/scenarios.ts";

describe("gate transversal de conteúdo", () => {
  it("aceita o conjunto coerente e todos os estados editoriais", async () => {
    const dataset = withAllValidStates(await validDataset());
    expect(validateIntegrity(dataset, BUILD_INSTANT)).toEqual([]);
  });

  it.each(invalidScenarios)(
    "$name falha por $expectedCode",
    async (scenario) => {
      const dataset = cloneDataset(await validDataset());
      scenario.mutate(dataset);
      const codes = validateIntegrity(dataset, BUILD_INSTANT).map(
        (issue) => issue.code,
      );
      expect(codes).toContain(scenario.expectedCode);
    },
  );

  it("executa o mesmo gate usado pelo build sobre as collections reais", async () => {
    const dataset = await runContentGate({
      root: process.cwd(),
      buildInstant: BUILD_INSTANT,
    });
    expect(Object.keys(dataset)).toHaveLength(7);
    expect(dataset.edicoes).toHaveLength(1);
  });
});
