import { createProcessor } from "@mdx-js/mdx";

export const ALLOWED_MDX_COMPONENTS = [
  "LeadImage",
  "FullBleed",
  "Diptych",
  "Triptych",
  "ContactSheet",
  "FilmStrip",
  "TextColumn",
  "PullQuote",
  "MetadataBlock",
  "Credits",
  "RelatedWorks",
] as const;

export interface MdxPolicyIssue {
  code:
    | "mdx-import"
    | "mdx-export"
    | "mdx-expression"
    | "mdx-component"
    | "mdx-direct-file";
  message: string;
  line?: number;
}

interface AstNode {
  type?: string;
  name?: string | null;
  value?: unknown;
  url?: unknown;
  attributes?: unknown[];
  children?: unknown[];
  position?: { start?: { line?: number } };
}

const allowed = new Set<string>(ALLOWED_MDX_COMPONENTS);
const directFilePattern =
  /(?:^|["'(\s])(?:\.{0,2}\/|\/src\/)[^\s"')]+\.(?:avif|gif|jpe?g|png|svg|tiff?|webp)/i;

function lineOf(node: AstNode): number | undefined {
  return node.position?.start?.line;
}

function inspect(node: unknown, issues: MdxPolicyIssue[]): void {
  if (!node || typeof node !== "object") return;
  const value = node as AstNode;
  if (value.type === "mdxjsEsm" && typeof value.value === "string") {
    const isImport = /^\s*import\b/m.test(value.value);
    issues.push({
      code: isImport ? "mdx-import" : "mdx-export",
      message: isImport
        ? "imports são proibidos em MDX editorial"
        : "exports são proibidos em MDX editorial",
      line: lineOf(value),
    });
  }
  if (
    value.type === "mdxFlowExpression" ||
    value.type === "mdxTextExpression" ||
    value.type === "mdxJsxExpressionAttribute"
  ) {
    issues.push({
      code: "mdx-expression",
      message: "expressões arbitrárias são proibidas em MDX editorial",
      line: lineOf(value),
    });
  }
  if (
    value.type === "mdxJsxFlowElement" ||
    value.type === "mdxJsxTextElement"
  ) {
    if (value.name && /^[A-Z]/.test(value.name) && !allowed.has(value.name)) {
      issues.push({
        code: "mdx-component",
        message: `componente ${value.name} não pertence ao registro editorial`,
        line: lineOf(value),
      });
    }
    for (const attribute of value.attributes ?? []) inspect(attribute, issues);
  }
  for (const candidate of [value.value, value.url]) {
    if (typeof candidate === "string" && directFilePattern.test(candidate)) {
      issues.push({
        code: "mdx-direct-file",
        message:
          "caminho direto de mídia é proibido; use uma referência a midia",
        line: lineOf(value),
      });
    }
  }
  for (const child of value.children ?? []) inspect(child, issues);
}

export function validateMdxPolicy(source: string): MdxPolicyIssue[] {
  const tree = createProcessor({ format: "mdx" }).parse(source);
  const issues: MdxPolicyIssue[] = [];
  inspect(tree, issues);
  return issues;
}
