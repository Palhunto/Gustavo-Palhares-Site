import type { EditorialStatus } from "./schemas/shared.ts";

export interface EligibilityInput {
  status: EditorialStatus;
  publishAt?: string;
}

export interface PublicationConditions {
  referencesValid?: boolean;
  rightsValid?: boolean;
  editorialClearanceValid?: boolean;
}

export function isEffectivelyPublic(
  entry: EligibilityInput,
  buildInstant: Date,
  conditions: PublicationConditions = {},
): boolean {
  if (
    conditions.referencesValid === false ||
    conditions.rightsValid === false ||
    conditions.editorialClearanceValid === false
  ) {
    return false;
  }
  if (entry.status === "published" || entry.status === "archived") return true;
  if (entry.status !== "scheduled" || !entry.publishAt) return false;
  return Date.parse(entry.publishAt) <= buildInstant.getTime();
}

export function isStandardCirculation(
  entry: EligibilityInput,
  buildInstant: Date,
): boolean {
  return (
    entry.status !== "archived" && isEffectivelyPublic(entry, buildInstant)
  );
}

export function isHomepageEligible(
  entry: EligibilityInput,
  buildInstant: Date,
): boolean {
  return isStandardCirculation(entry, buildInstant);
}

export function isRssEligible(
  entry: EligibilityInput,
  buildInstant: Date,
): boolean {
  return (
    entry.status !== "archived" && isEffectivelyPublic(entry, buildInstant)
  );
}

export function isSitemapEligible(
  entry: EligibilityInput,
  buildInstant: Date,
): boolean {
  return isEffectivelyPublic(entry, buildInstant);
}

export function isSearchEligible(
  entry: EligibilityInput,
  buildInstant: Date,
): boolean {
  return isEffectivelyPublic(entry, buildInstant);
}

export function isArchived(entry: EligibilityInput): boolean {
  return entry.status === "archived";
}
