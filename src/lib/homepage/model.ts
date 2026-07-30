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
  featuredWorks: PublicWork[];
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
  const coverWork = publicWorks.find(
    (entry) => entry.id === homepageEditorialSelection.coverWorkId,
  );
  if (!coverWork) {
    throw new Error(
      `Trabalho de destino da capa nÃ£o elegÃ­vel: ${homepageEditorialSelection.coverWorkId}.`,
    );
  }

  const featuredWork = publicWorks.find(
    (entry) => entry.id === homepageEditorialSelection.featuredWorkId,
  );
  if (!featuredWork) {
    throw new Error(
      `Trabalho de capa não elegível: ${homepageEditorialSelection.featuredWorkId}.`,
    );
  }
  const featuredById = new Map(publicWorks.map((entry) => [entry.id, entry]));
  const featuredWorks = homepageEditorialSelection.featuredWorkIds.map((id) =>
    featuredById.get(id),
  );
  if (featuredWorks.some((entry) => entry === undefined)) {
    throw new Error("Um ou mais trabalhos em destaque não estão elegíveis.");
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
      work: coverWork,
    },
    works: publicWorks,
    featuredWorks: featuredWorks as PublicWork[],
  };
}
