export const EDITORIAL_COMPONENT_NAMES = [
  "LeadImage",
  "FullBleed",
  "Diptych",
  "Triptych",
  "ContactSheet",
  "FilmStrip",
  "TextColumn",
  "PullQuote",
  "MetadataBlock",
  "Credits",
] as const;

export type EditorialComponentName = (typeof EDITORIAL_COMPONENT_NAMES)[number];
