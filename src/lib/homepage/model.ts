import type { CollectionEntry } from "astro:content";

import { homepageEditorialSelection } from "../../config/homepage.ts";
import {
  isInPublicCirculation,
  sortWorksByDate,
} from "../content/publication.ts";
import { referenceId } from "../content/schemas/shared.ts";

type PublicWork = CollectionEntry<"trabalhos">;

export interface HomepageModel {
  cover: {
    media: typeof homepageEditorialSelection.coverMedia;
    work: PublicWork;
  };
  works: PublicWork[];
}

interface HomepageModelInput {
  works: readonly PublicWork[];
  at: Date;
}

export function buildHomepageModel({
  works,
  at,
}: HomepageModelInput): HomepageModel {
  const publicWorks = sortWorksByDate(
    works.filter((entry) => isInPublicCirculation(entry, at)),
  );
  const featuredWork = publicWorks.find(
    (entry) => entry.id === homepageEditorialSelection.featuredWorkId,
  );
  if (!featuredWork) {
    throw new Error(
      `Trabalho de capa não elegível: ${homepageEditorialSelection.featuredWorkId}.`,
    );
  }

  const coverMediaId = referenceId(homepageEditorialSelection.coverMedia.asset);
  const featuredCoverId = referenceId(featuredWork.data.cover.asset);
  if (!coverMediaId || coverMediaId === featuredCoverId) {
    throw new Error(
      "A capa da homepage deve usar mídia pública distinta da capa do trabalho em destaque.",
    );
  }

  return {
    cover: {
      media: homepageEditorialSelection.coverMedia,
      work: featuredWork,
    },
    works: publicWorks,
  };
}
