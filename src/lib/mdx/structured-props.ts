export function parseStructuredItems<T>(
  value: string | readonly T[],
  label: string,
  isItem: (candidate: unknown) => candidate is T,
): T[] {
  let parsed: unknown = value;

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`${label} deve ser um array JSON válido.`);
    }
  }

  if (!Array.isArray(parsed) || !parsed.every(isItem)) {
    throw new Error(`${label} não corresponde ao contrato editorial.`);
  }

  return [...parsed];
}
