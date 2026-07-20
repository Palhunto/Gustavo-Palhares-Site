import { z } from "astro/zod";

import {
  ARCHIVE_NUMBER_PATTERN,
  commonEditorialShape,
  editorialIdSchema,
  historicalDateSchema,
  locationSchema,
  rightsStatusSchema,
  themesSchema,
  validateCommonEditorial,
} from "./shared.ts";
import {
  createCreditSchema,
  createMediaSchema,
  createMediaUseSchema,
} from "./media.ts";

export interface SchemaReferences<
  TMedia extends z.ZodType,
  TPerson extends z.ZodType,
  TTrabalho extends z.ZodType,
  TCaderno extends z.ZodType,
  TColecao extends z.ZodType,
> {
  media: TMedia;
  person: TPerson;
  trabalho: TTrabalho;
  caderno: TCaderno;
  colecao: TColecao;
}

export function createCollectionSchemas<
  TImage extends z.ZodType,
  TMedia extends z.ZodType,
  TPerson extends z.ZodType,
  TTrabalho extends z.ZodType,
  TCaderno extends z.ZodType,
  TColecao extends z.ZodType,
>(
  imageSchema: TImage,
  references: SchemaReferences<TMedia, TPerson, TTrabalho, TCaderno, TColecao>,
) {
  const mediaUse = createMediaUseSchema(references.media);
  const credit = createCreditSchema(references.person);
  const relatedContent = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("trabalho"), id: references.trabalho }).strict(),
    z.object({ kind: z.literal("caderno"), id: references.caderno }).strict(),
  ]);

  const trabalhos = z
    .object({
      ...commonEditorialShape(references.media),
      archiveNumber: z.string().regex(ARCHIVE_NUMBER_PATTERN),
      date: historicalDateSchema,
      dateEnd: historicalDateSchema.optional(),
      location: locationSchema.optional(),
      formato: z.enum(["ensaio", "cobertura", "retrato", "projeto"]),
      contexto: z.enum(["autoral", "editorial", "comercial"]),
      themes: themesSchema.optional().default([]),
      collections: z.array(references.colecao).optional().default([]),
      cover: mediaUse,
      gallery: z.array(mediaUse).min(1),
      credits: z.array(credit).min(1),
      publicationClearance: rightsStatusSchema,
      relatedWorks: z.array(references.trabalho).optional().default([]),
    })
    .strict()
    .superRefine((data, context) => {
      validateCommonEditorial(data, context, { allowNoindex: false });
      if (data.dateEnd && data.dateEnd < data.date) {
        context.addIssue({
          code: "custom",
          path: ["dateEnd"],
          message: "não pode preceder date",
        });
      }
    });

  const caderno = z
    .object({
      ...commonEditorialShape(references.media),
      tipo: z.enum([
        "nota",
        "processo",
        "critica",
        "reportagem",
        "investigacao",
        "ensaio",
      ]),
      date: historicalDateSchema,
      authors: z.array(credit).min(1),
      cover: mediaUse.optional(),
      themes: themesSchema.optional().default([]),
      collections: z.array(references.colecao).optional().default([]),
      relatedWorks: z.array(references.trabalho).optional().default([]),
      relatedNotebook: z.array(references.caderno).optional().default([]),
      credits: z.array(credit).optional().default([]),
    })
    .strict()
    .superRefine((data, context) =>
      validateCommonEditorial(data, context, { allowNoindex: false }),
    );

  const colecoes = z
    .object({
      ...commonEditorialShape(references.media),
      cover: mediaUse.optional(),
      themes: themesSchema.optional().default([]),
      featured: z.array(relatedContent).optional().default([]),
      curatorNote: z.string().trim().min(1).optional(),
      relatedCollections: z.array(references.colecao).optional().default([]),
    })
    .strict()
    .superRefine((data, context) =>
      validateCommonEditorial(data, context, { allowNoindex: false }),
    );

  const heroBlock = z
    .object({
      type: z.literal("hero"),
      content: relatedContent,
      image: mediaUse,
      treatment: z.enum(["standard", "immersive", "split"]),
    })
    .strict();
  const workGridBlock = z
    .object({
      type: z.literal("work-grid"),
      works: z.array(references.trabalho).min(1),
      treatment: z.enum(["balanced", "dense", "featured"]),
    })
    .strict();
  const notebookListBlock = z
    .object({
      type: z.literal("notebook-list"),
      entries: z.array(references.caderno).min(1),
      treatment: z.enum(["chronological", "selected"]),
    })
    .strict();
  const collectionFeatureBlock = z
    .object({
      type: z.literal("collection-feature"),
      collection: references.colecao,
      items: z.array(relatedContent).min(1),
      treatment: z.enum(["lead", "compact"]),
    })
    .strict();
  const textCalloutBlock = z
    .object({
      type: z.literal("text-callout"),
      text: z.string().trim().min(1),
      treatment: z.enum(["note", "statement"]),
    })
    .strict();

  const edicoes = z
    .object({
      ...commonEditorialShape(references.media),
      number: z.number().int().positive(),
      period: z.string().trim().min(1),
      current: z.boolean(),
      blocks: z
        .array(
          z.discriminatedUnion("type", [
            heroBlock,
            workGridBlock,
            notebookListBlock,
            collectionFeatureBlock,
            textCalloutBlock,
          ]),
        )
        .min(1),
      compositionRevision: z.number().int().min(1),
      corrigendaDecision: z
        .string()
        .regex(/^ADR-\d{3}$/)
        .optional(),
    })
    .strict()
    .superRefine((data, context) => {
      validateCommonEditorial(data, context, { allowNoindex: false });
      if (data.current && data.status === "archived") {
        context.addIssue({
          code: "custom",
          path: ["current"],
          message: "edição archived não pode ser current",
        });
      }
    });

  const pessoas = z
    .object({
      name: z.string().trim().min(1),
      sortName: z.string().trim().min(1).optional(),
      roleLabel: z.string().trim().min(1).optional(),
      url: z.url().optional(),
      sameAs: z.array(z.url()).optional().default([]),
      bio: z.string().trim().min(1).optional(),
      public: z.boolean(),
    })
    .strict();

  const contactLink = z
    .object({
      label: z.string().trim().min(1),
      url: z
        .string()
        .refine(
          (value) => /^(?:https?:|mailto:|tel:)/.test(value),
          "protocolo de contato não permitido",
        ),
      order: z.number().int().nonnegative(),
    })
    .strict();
  const paginas = z
    .object({
      ...commonEditorialShape(references.media),
      pageType: z.enum(["about", "contact"]),
      contactLinks: z.array(contactLink).optional().default([]),
      portrait: mediaUse.optional(),
    })
    .strict()
    .superRefine((data, context) => {
      validateCommonEditorial(data, context, { allowNoindex: true });
      if (data.pageType === "contact" && data.portrait) {
        context.addIssue({
          code: "custom",
          path: ["portrait"],
          message: "portrait é permitido apenas em sobre",
        });
      }
      if (data.pageType === "about" && data.contactLinks.length > 0) {
        context.addIssue({
          code: "custom",
          path: ["contactLinks"],
          message: "contactLinks é permitido apenas em contato",
        });
      }
    });

  return {
    trabalhos,
    caderno,
    colecoes,
    edicoes,
    midia: createMediaSchema(imageSchema, references.person),
    pessoas,
    paginas,
  };
}

const domainReference = editorialIdSchema;
export const domainSchemas = createCollectionSchemas(z.string().min(1), {
  media: domainReference,
  person: domainReference,
  trabalho: domainReference,
  caderno: domainReference,
  colecao: domainReference,
});

export type TrabalhoData = z.infer<typeof domainSchemas.trabalhos>;
export type CadernoData = z.infer<typeof domainSchemas.caderno>;
export type ColecaoData = z.infer<typeof domainSchemas.colecoes>;
export type EdicaoData = z.infer<typeof domainSchemas.edicoes>;
export type MidiaData = z.infer<typeof domainSchemas.midia>;
export type PessoaData = z.infer<typeof domainSchemas.pessoas>;
export type PaginaData = z.infer<typeof domainSchemas.paginas>;
