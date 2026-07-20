import { z } from "astro/zod";

export const EDITORIAL_TIME_ZONE = "America/Sao_Paulo";
export const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ARCHIVE_NUMBER_PATTERN = /^GP-(\d{4})-(\d{4})$/;

export const editorialIdSchema = z
  .string()
  .regex(ID_PATTERN, "deve usar kebab-case ASCII");
export const slugSchema = editorialIdSchema;
export const translationKeySchema = editorialIdSchema;
export const localeSchema = z.literal("pt-BR");
export const statusSchema = z.enum([
  "draft",
  "review",
  "scheduled",
  "published",
  "archived",
]);
export const rightsStatusSchema = z.enum([
  "pending",
  "cleared",
  "restricted",
  "expired",
]);

const HISTORICAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const OFFSET_DATETIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function isCalendarDate(value: string): boolean {
  if (!HISTORICAL_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const historicalDateSchema = z
  .string()
  .refine(isCalendarDate, "deve usar uma data válida em YYYY-MM-DD");

export const offsetDateTimeSchema = z
  .string()
  .regex(
    OFFSET_DATETIME_PATTERN,
    "deve usar ISO 8601 com segundos e offset explícito",
  )
  .refine((value) => !Number.isNaN(Date.parse(value)), "datetime inválido");

export function instant(value: string): number {
  return Date.parse(value);
}

export function normalizeTheme(value: string): string {
  return value
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ");
}

export const themesSchema = z
  .array(z.string())
  .superRefine((values, context) => {
    const seen = new Map<string, number>();
    values.forEach((value, index) => {
      const normalized = normalizeTheme(value);
      if (!normalized) {
        context.addIssue({
          code: "custom",
          path: [index],
          message: "tema vazio após normalização",
        });
        return;
      }
      if (/[.!?;:,]$/.test(normalized)) {
        context.addIssue({
          code: "custom",
          path: [index],
          message: "tema não pode terminar com pontuação",
        });
      }
      const previous = seen.get(normalized);
      if (previous !== undefined) {
        context.addIssue({
          code: "custom",
          path: [index],
          message: `colide após normalização com themes[${previous}]`,
        });
      } else {
        seen.set(normalized, index);
      }
    });
  })
  .transform((values) => values.map(normalizeTheme));

export const locationSchema = z
  .object({
    city: z.string().trim().min(1),
    subdivision: z.string().trim().min(1).optional(),
    country: z.string().trim().min(1),
  })
  .strict();

export const focalPointSchema = z
  .object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  })
  .strict();

export function commonEditorialShape<TMedia extends z.ZodType>(
  mediaReference: TMedia,
) {
  return {
    slug: slugSchema,
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    locale: localeSchema,
    translationKey: translationKeySchema,
    status: statusSchema,
    publishAt: offsetDateTimeSchema.optional(),
    updatedAt: offsetDateTimeSchema.optional(),
    seo: z
      .object({
        title: z.string().trim().min(1).optional(),
        description: z.string().trim().min(1).optional(),
        socialImage: mediaReference.optional(),
        noindex: z.boolean().optional(),
      })
      .strict()
      .optional(),
  };
}

export interface CommonEditorialData {
  status: z.infer<typeof statusSchema>;
  publishAt?: string;
  updatedAt?: string;
  seo?: { noindex?: boolean };
}

export function validateCommonEditorial(
  data: CommonEditorialData,
  context: z.RefinementCtx,
  options: { allowNoindex: boolean },
): void {
  const requiresPublishAt = ["scheduled", "published", "archived"].includes(
    data.status,
  );
  if (requiresPublishAt && !data.publishAt) {
    context.addIssue({
      code: "custom",
      path: ["publishAt"],
      message: `obrigatório quando status é ${data.status}`,
    });
  }
  if (
    data.updatedAt &&
    data.publishAt &&
    instant(data.updatedAt) < instant(data.publishAt)
  ) {
    context.addIssue({
      code: "custom",
      path: ["updatedAt"],
      message: "não pode preceder publishAt",
    });
  }
  if (!options.allowNoindex && data.seo?.noindex) {
    context.addIssue({
      code: "custom",
      path: ["seo", "noindex"],
      message: "não é permitido para esta collection",
    });
  }
}

export function referenceId(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string"
  ) {
    return value.id;
  }
  return undefined;
}

export type EditorialStatus = z.infer<typeof statusSchema>;
