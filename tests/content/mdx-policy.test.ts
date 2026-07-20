import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { validateMdxPolicy } from "../../src/lib/content/mdx-policy.ts";

const fixtureDir = path.join(
  process.cwd(),
  "tests",
  "fixtures",
  "content",
  "mdx",
);

async function fixture(name: string): Promise<string> {
  return readFile(path.join(fixtureDir, name), "utf8");
}

describe("política estrutural de MDX", () => {
  it.each(["simple-valid.mdx", "component-valid.mdx"])(
    "aceita %s",
    async (name) => {
      expect(validateMdxPolicy(await fixture(name))).toEqual([]);
    },
  );

  it.each([
    ["component-invalid.mdx", "mdx-component"],
    ["import-invalid.mdx", "mdx-import"],
    ["export-invalid.mdx", "mdx-export"],
    ["expression-invalid.mdx", "mdx-expression"],
    ["path-invalid.mdx", "mdx-direct-file"],
  ])("rejeita %s por %s", async (name, code) => {
    expect(
      validateMdxPolicy(await fixture(name)).map((issue) => issue.code),
    ).toContain(code);
  });
});
