const EDITORIAL_NUMBER = /^\d{2}$/;

export function resolveEditorialNumbers(
  value: string | readonly string[] | undefined,
  count: number,
  component: string,
): readonly string[] {
  const numbers =
    value === undefined
      ? Array.from({ length: count }, (_, index) =>
          String(index + 1).padStart(2, "0"),
        )
      : typeof value === "string"
        ? value.split(",").map((number) => number.trim())
        : [...value];

  if (numbers.length !== count) {
    throw new Error(`${component}.numbers exige exatamente ${count} números.`);
  }
  if (numbers.some((number) => !EDITORIAL_NUMBER.test(number))) {
    throw new Error(
      `${component}.numbers aceita somente números de dois dígitos.`,
    );
  }
  if (new Set(numbers).size !== numbers.length) {
    throw new Error(`${component}.numbers não aceita números repetidos.`);
  }

  return numbers;
}

export function resolveEditorialNumber(
  value: string | undefined,
  component: string,
): string | undefined {
  if (value !== undefined && !EDITORIAL_NUMBER.test(value)) {
    throw new Error(
      `${component}.number aceita somente um número de dois dígitos.`,
    );
  }
  return value;
}
