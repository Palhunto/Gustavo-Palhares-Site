import {
  ContactSheet,
  Credits,
  Diptych,
  FilmStrip,
  FullBleed,
  LeadImage,
  MetadataBlock,
  PullQuote,
  RelatedWorks,
  TextColumn,
  Triptych,
} from "../../components/editorial/index.ts";
import {
  EDITORIAL_COMPONENT_NAMES,
  type EditorialComponentName,
} from "./component-names.ts";

export const MDX_COMPONENT_REGISTRY = {
  LeadImage,
  FullBleed,
  Diptych,
  Triptych,
  ContactSheet,
  FilmStrip,
  TextColumn,
  PullQuote,
  MetadataBlock,
  Credits,
  RelatedWorks,
} satisfies Record<EditorialComponentName, unknown>;

const registeredNames = Object.keys(MDX_COMPONENT_REGISTRY);
if (
  registeredNames.length !== EDITORIAL_COMPONENT_NAMES.length ||
  EDITORIAL_COMPONENT_NAMES.some((name) => !(name in MDX_COMPONENT_REGISTRY))
) {
  throw new Error("O registro MDX divergiu da lista editorial permitida.");
}
