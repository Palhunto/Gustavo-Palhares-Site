import { siteConfig } from "../../config/site.ts";
import type { EligibilityInput } from "../content/eligibility.ts";
import {
  isIndividuallyPublic,
  isInPublicCirculation,
} from "../content/publication.ts";
import { publicRoutes } from "../routes/public.ts";
import type { SocialImageMetadata, StructuredData } from "./metadata.ts";
import { absoluteCanonicalUrl } from "./site-url.ts";

const SCHEMA_CONTEXT = "https://schema.org";
const AUTHOR_NAME = "Gustavo Palhares";
const INSTAGRAM_URL = "https://www.instagram.com/gustavopalharess/";

const author = { "@type": "Person", name: AUTHOR_NAME } as const;

interface WorkEntry {
  collection: "trabalhos";
  id: string;
  data: EligibilityInput & {
    slug: string;
    title: string;
    summary: string;
    locale: string;
    archiveNumber: string;
    date: string;
    updatedAt?: string;
    location?: { city: string; subdivision?: string; country: string };
  };
}

export function websiteStructuredData(
  base: URL | undefined,
): StructuredData | undefined {
  if (!base) return undefined;
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    name: siteConfig.name,
    url: absoluteCanonicalUrl(publicRoutes.home, base),
    inLanguage: siteConfig.locale,
    author,
  };
}

export function personStructuredData(
  base: URL | undefined,
): StructuredData | undefined {
  if (!base) return undefined;
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Person",
    name: AUTHOR_NAME,
    url: absoluteCanonicalUrl(publicRoutes.sobre, base),
    jobTitle: "Fotógrafo e estudante de jornalismo",
    sameAs: [INSTAGRAM_URL],
  };
}

export function creativeWorkStructuredData(
  entry: WorkEntry,
  at: Date,
  base: URL | undefined,
  image?: SocialImageMetadata,
): StructuredData | undefined {
  if (!base) return undefined;
  if (!isIndividuallyPublic(entry, at)) {
    throw new Error(
      `Metadata pública recusada para trabalho inelegível: ${entry.id}.`,
    );
  }

  const url = absoluteCanonicalUrl(
    publicRoutes.trabalho(entry.data.slug),
    base,
  );
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "CreativeWork",
    name: entry.data.title,
    description: entry.data.summary,
    url,
    mainEntityOfPage: url,
    creator: author,
    dateCreated: entry.data.date,
    ...(entry.data.updatedAt ? { dateModified: entry.data.updatedAt } : {}),
    inLanguage: entry.data.locale,
    identifier: entry.data.archiveNumber,
    ...(entry.data.location
      ? {
          contentLocation: {
            "@type": "Place",
            name: [entry.data.location.city, entry.data.location.subdivision]
              .filter(Boolean)
              .join(", "),
          },
        }
      : {}),
    ...(image
      ? {
          image: {
            "@type": "ImageObject",
            url: image.url,
            contentUrl: image.url,
            caption: image.alt,
            ...(image.width && image.height
              ? { width: image.width, height: image.height }
              : {}),
          },
        }
      : {}),
  };
}

export function worksIndexStructuredData(
  entries: readonly WorkEntry[],
  at: Date,
  base: URL | undefined,
  description: string,
): StructuredData | undefined {
  if (!base) return undefined;
  const url = absoluteCanonicalUrl(publicRoutes.trabalhosIndex, base);
  const items = entries.filter((entry) => isInPublicCirculation(entry, at));
  const listId = `${url}#trabalhos`;
  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Trabalhos",
        description,
        url,
        inLanguage: siteConfig.locale,
        mainEntity: { "@id": listId },
      },
      {
        "@id": listId,
        "@type": "ItemList",
        numberOfItems: items.length,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        itemListElement: items.map((entry, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "CreativeWork",
            name: entry.data.title,
            url: absoluteCanonicalUrl(
              publicRoutes.trabalho(entry.data.slug),
              base,
            ),
          },
        })),
      },
    ],
  };
}

export function collectionPageStructuredData(
  base: URL | undefined,
  pathname: string,
  name: string,
  description: string,
): StructuredData | undefined {
  if (!base) return undefined;
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteCanonicalUrl(pathname, base),
    inLanguage: siteConfig.locale,
  };
}
