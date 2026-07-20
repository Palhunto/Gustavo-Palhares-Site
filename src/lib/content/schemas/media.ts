import { z } from "astro/zod";

import {
  focalPointSchema,
  historicalDateSchema,
  locationSchema,
  offsetDateTimeSchema,
  rightsStatusSchema,
} from "./shared.ts";

export const rightsBasisSchema = z.enum([
  "authorship",
  "written-authorization",
  "commissioned-use",
  "license",
  "public-domain",
]);

const evidenceReferenceSchema = z
  .string()
  .max(200)
  .regex(
    /^[a-z][a-z0-9+.-]*:[A-Za-z0-9._/-]+$/,
    "deve ser um identificador externo sem query, segredo ou conteúdo incorporado",
  )
  .refine(
    (value) => !value.startsWith("file:"),
    "não pode apontar para arquivo local",
  )
  .refine(
    (value) => !/\.(?:pdf|docx?|txt|rtf|jpe?g|png)$/i.test(value),
    "não pode apontar diretamente para documentação privada",
  );

export const rightsSchema = z
  .object({
    status: rightsStatusSchema,
    holder: z.string().trim().min(1),
    basis: rightsBasisSchema.optional(),
    scope: z.string().trim().min(1).optional(),
    expiresAt: offsetDateTimeSchema.optional(),
    notes: z.string().trim().min(1).optional(),
    evidenceRef: evidenceReferenceSchema.optional(),
  })
  .strict()
  .superRefine((rights, context) => {
    if (rights.status === "cleared" && !rights.basis) {
      context.addIssue({
        code: "custom",
        path: ["basis"],
        message: "obrigatório quando rights.status é cleared",
      });
    }
    if (
      rights.basis &&
      ["license", "written-authorization"].includes(rights.basis) &&
      !rights.scope &&
      !rights.expiresAt &&
      !rights.notes
    ) {
      context.addIssue({
        code: "custom",
        path: ["basis"],
        message:
          "licença ou autorização deve registrar scope, expiresAt ou notes",
      });
    }
  });

export function createCreditSchema<TPerson extends z.ZodType>(
  personReference: TPerson,
) {
  return z
    .object({
      role: z.string().trim().min(1),
      person: personReference.optional(),
      name: z.string().trim().min(1).optional(),
    })
    .strict()
    .superRefine((credit, context) => {
      if (Boolean(credit.person) === Boolean(credit.name)) {
        context.addIssue({
          code: "custom",
          message: "informe exatamente person ou name",
        });
      }
    });
}

const cropSchema = z
  .object({
    aspectRatio: z
      .string()
      .regex(/^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/, "proporção inválida")
      .optional(),
    focalPoint: focalPointSchema.optional(),
  })
  .strict()
  .refine(
    (crop) => crop.aspectRatio !== undefined || crop.focalPoint !== undefined,
    "crop precisa definir aspectRatio ou focalPoint",
  );

export function createMediaUseSchema<TMedia extends z.ZodType>(
  mediaReference: TMedia,
) {
  return z
    .object({
      asset: mediaReference,
      decorative: z.boolean(),
      altOverride: z.string().trim().min(1).optional(),
      captionOverride: z.string().trim().min(1).optional(),
      crop: cropSchema.optional(),
      loading: z.enum(["eager", "lazy"]).optional(),
    })
    .strict()
    .superRefine((use, context) => {
      if (use.decorative && use.altOverride !== undefined) {
        context.addIssue({
          code: "custom",
          path: ["altOverride"],
          message: "imagem decorativa não pode definir altOverride",
        });
      }
    });
}

export function createMediaSchema<
  TImage extends z.ZodType,
  TPerson extends z.ZodType,
>(imageSchema: TImage, personReference: TPerson) {
  return z
    .object({
      src: imageSchema,
      description: z.string().trim().min(1),
      defaultAlt: z.string().trim(),
      defaultCaption: z.string().trim().min(1).optional(),
      credit: createCreditSchema(personReference),
      capturedAt: z
        .union([historicalDateSchema, offsetDateTimeSchema])
        .optional(),
      location: locationSchema.optional(),
      focalPoint: focalPointSchema.optional(),
      rights: rightsSchema,
      checksum: z.string().trim().min(1).optional(),
    })
    .strict();
}

export type Rights = z.infer<typeof rightsSchema>;
