export { normalizeTheme } from "./schemas/shared.ts";

export function normalizeRole(value: string): string {
  return value
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ");
}
