import { initializeHomeCoverMotion } from "./home-cover.ts";
import { initializeHomePresenceMotion } from "./home-presence.ts";
import { initializeHomeWorksMotion } from "./home-works.ts";

type Cleanup = () => void;

export function initializeHomepageMotion(documentRoot: Document): Cleanup {
  const cleanups: Cleanup[] = [];
  const cover = documentRoot.querySelector<HTMLElement>(
    "[data-home-cover-motion]",
  );
  const works = documentRoot.querySelector<HTMLElement>(
    "[data-home-works-motion]",
  );
  const presence = documentRoot.querySelector<HTMLElement>(
    "[data-home-presence-motion]",
  );

  if (cover) cleanups.push(initializeHomeCoverMotion(cover));
  if (works) cleanups.push(initializeHomeWorksMotion(works));
  if (presence) cleanups.push(initializeHomePresenceMotion(presence));

  return () => {
    cleanups
      .splice(0)
      .reverse()
      .forEach((cleanup) => cleanup());
  };
}
