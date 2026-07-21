import { describe, expect, it } from "vitest";

import {
  getArchived,
  getEffectivelyPublic,
  getRssEntries,
  getSearchEntries,
  getSitemapEntries,
  getStandardCirculation,
} from "../../src/lib/content/queries.ts";
import {
  BUILD_INSTANT,
  validDataset,
  withAllValidStates,
} from "../fixtures/content/scenarios.ts";

describe("elegibilidade central", () => {
  it("usa um instante explícito e separa as superfícies futuras", async () => {
    const dataset = withAllValidStates(await validDataset());
    const publicIds = getEffectivelyPublic(dataset, BUILD_INSTANT).map(
      (entry) => entry.id,
    );
    expect(publicIds).toContain("fixture-agendado-vencido");
    expect(publicIds).toContain("fixture-arquivado");
    expect(publicIds).not.toContain("fixture-agendado-futuro");
    expect(publicIds).not.toContain("fixture-draft");
    expect(publicIds).not.toContain("fixture-review");

    const circulationIds = getStandardCirculation(dataset, BUILD_INSTANT).map(
      (entry) => entry.id,
    );
    expect(circulationIds).not.toContain("fixture-arquivado");
    expect(getArchived(dataset).map((entry) => entry.id)).toContain(
      "fixture-arquivado",
    );

    const rssIds = getRssEntries(dataset, BUILD_INSTANT).map(
      (entry) => entry.id,
    );
    expect(rssIds).not.toContain("fixture-texto");
    expect(rssIds).toContain("fixture-agendado-vencido");
    expect(rssIds).not.toContain("fixture-arquivado");
    expect(rssIds).not.toContain("fixture-agendado-futuro");

    const sitemapIds = getSitemapEntries(dataset, BUILD_INSTANT).map(
      (entry) => entry.id,
    );
    expect(sitemapIds).toContain("fixture-arquivado");
    expect(sitemapIds).not.toContain("fixture-texto");
    expect(sitemapIds).not.toContain("fixture-trabalho");
    expect(
      getSearchEntries(dataset, BUILD_INSTANT).map((entry) => entry.id),
    ).toContain("fixture-arquivado");
  });
});
