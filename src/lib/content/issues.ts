export interface IntegrityIssue {
  code: string;
  path: string;
  message: string;
  trace?: string[];
}

export class ContentIntegrityError extends Error {
  readonly issues: IntegrityIssue[];

  constructor(issues: IntegrityIssue[]) {
    super(formatIntegrityIssues(issues));
    this.name = "ContentIntegrityError";
    this.issues = issues;
  }
}

export function formatIntegrityIssues(issues: IntegrityIssue[]): string {
  return issues
    .map((issue) => {
      const trace = issue.trace?.map((step) => `  → ${step}`).join("\n");
      return `[${issue.code}] ${issue.path}: ${issue.message}${trace ? `\n${trace}` : ""}`;
    })
    .join("\n");
}
