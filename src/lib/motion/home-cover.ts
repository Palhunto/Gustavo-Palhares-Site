import { HOME_COVER_TIMELINE, MOTION_TOKENS } from "./config.ts";
import { initializeMotion } from "./lifecycle.ts";
import { prefersReducedMotion } from "./preferences.ts";

const HOME_COVER_TARGET_SELECTOR = [
  "[data-home-cover-status]",
  "[data-home-cover-status-rule]",
  "[data-home-cover-title-word]",
  "[data-home-cover-title-rule]",
  "[data-home-cover-support]",
  "[data-home-cover-image]",
  "[data-home-cover-rail-item]",
  "[data-home-cover-scroll]",
].join(",");

export interface HomeCoverEntryContext {
  hash: string;
  scrollY: number;
  navigationType?: PerformanceNavigationTiming["type"];
}

export function shouldPresentHomeCoverImmediately({
  hash,
  scrollY,
  navigationType,
}: HomeCoverEntryContext): boolean {
  return (
    (hash.length > 0 && hash !== "#capa") ||
    scrollY > 1 ||
    navigationType === "back_forward"
  );
}

function currentNavigationType():
  PerformanceNavigationTiming["type"] | undefined {
  return performance.getEntriesByType("navigation")[0]?.entryType ===
    "navigation"
    ? (
        performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming
      ).type
    : undefined;
}

function restoreHomeCoverState(root: HTMLElement) {
  root
    .querySelectorAll<HTMLElement>(HOME_COVER_TARGET_SELECTOR)
    .forEach((element) => element.removeAttribute("style"));
}

export function initializeHomeCoverMotion(root: HTMLElement) {
  const presentImmediately = shouldPresentHomeCoverImmediately({
    hash: window.location.hash,
    scrollY: window.scrollY,
    navigationType: currentNavigationType(),
  });

  if (presentImmediately || prefersReducedMotion()) {
    root.dataset.homeCoverPresented = "true";
  }

  return initializeMotion({
    root,
    restoreFinalState: () => restoreHomeCoverState(root),
    setup: ({ engine, compact, distance }) => {
      if (root.dataset.homeCoverPresented === "true") return;

      const { gsap } = engine;
      const status = root.querySelector<HTMLElement>(
        "[data-home-cover-status]",
      );
      const statusRule = root.querySelector<HTMLElement>(
        "[data-home-cover-status-rule]",
      );
      const titleWords = root.querySelectorAll<HTMLElement>(
        "[data-home-cover-title-word]",
      );
      const titleRules = root.querySelectorAll<HTMLElement>(
        "[data-home-cover-title-rule]",
      );
      const support = root.querySelectorAll<HTMLElement>(
        "[data-home-cover-support]",
      );
      const image = root.querySelector<HTMLElement>("[data-home-cover-image]");
      const railItems = root.querySelectorAll<HTMLElement>(
        "[data-home-cover-rail-item]",
      );
      const scroll = root.querySelector<HTMLElement>(
        "[data-home-cover-scroll]",
      );

      root.dataset.homeCoverPresented = "true";

      const headlineStagger = compact
        ? MOTION_TOKENS.headline.stagger.compact
        : MOTION_TOKENS.headline.stagger.regular;
      const headlineDistance = compact
        ? MOTION_TOKENS.headline.yPercent.compact
        : MOTION_TOKENS.headline.yPercent.regular;
      const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });

      timeline.addLabel(
        "identification",
        HOME_COVER_TIMELINE.at.identification,
      );
      if (status) {
        timeline.from(
          status,
          {
            y: distance * HOME_COVER_TIMELINE.distanceFactor.identification,
            opacity: HOME_COVER_TIMELINE.opacity.auxiliary,
            duration: HOME_COVER_TIMELINE.duration.identification,
            ease: MOTION_TOKENS.easing.editorial,
            clearProps: "transform,opacity",
          },
          "identification",
        );
      }
      if (statusRule) {
        timeline.from(
          statusRule,
          {
            scaleX: 0,
            duration: HOME_COVER_TIMELINE.duration.statusRule,
            ease: MOTION_TOKENS.easing.line,
            clearProps: "transform",
          },
          HOME_COVER_TIMELINE.at.statusRule,
        );
      }

      timeline.addLabel("image", HOME_COVER_TIMELINE.at.image);
      if (image) {
        timeline.fromTo(
          image,
          {
            opacity: MOTION_TOKENS.image.initialOpacity,
            scale: MOTION_TOKENS.image.initialScale,
            clipPath: MOTION_TOKENS.image.initialClip,
          },
          {
            opacity: 1,
            scale: 1,
            clipPath: MOTION_TOKENS.image.finalClip,
            duration: HOME_COVER_TIMELINE.duration.image,
            ease: MOTION_TOKENS.easing.image,
            clearProps: "opacity,transform,clipPath",
          },
          "image",
        );
      }

      timeline.addLabel("headline", HOME_COVER_TIMELINE.at.headline);
      timeline.from(
        titleWords,
        {
          yPercent: headlineDistance,
          duration: MOTION_TOKENS.headline.duration,
          ease: MOTION_TOKENS.easing.editorial,
          stagger: headlineStagger,
          clearProps: "transform",
        },
        "headline",
      );
      timeline.from(
        titleRules,
        {
          scaleX: 0,
          duration: HOME_COVER_TIMELINE.duration.titleRule,
          ease: MOTION_TOKENS.easing.line,
          stagger: headlineStagger,
          clearProps: "transform",
        },
        `headline+=${HOME_COVER_TIMELINE.offset.titleRule}`,
      );

      timeline.addLabel("support", HOME_COVER_TIMELINE.at.support);
      timeline.from(
        support,
        {
          y: distance * HOME_COVER_TIMELINE.distanceFactor.auxiliary,
          opacity: HOME_COVER_TIMELINE.opacity.auxiliary,
          duration: HOME_COVER_TIMELINE.duration.support,
          ease: MOTION_TOKENS.easing.editorial,
          stagger: HOME_COVER_TIMELINE.stagger.support,
          clearProps: "transform,opacity",
        },
        "support",
      );

      timeline.addLabel("rail", HOME_COVER_TIMELINE.at.rail);
      timeline.from(
        railItems,
        {
          y: distance * HOME_COVER_TIMELINE.distanceFactor.auxiliary,
          opacity: HOME_COVER_TIMELINE.opacity.auxiliary,
          duration: HOME_COVER_TIMELINE.duration.rail,
          ease: MOTION_TOKENS.easing.editorial,
          stagger: HOME_COVER_TIMELINE.stagger.rail,
          clearProps: "transform,opacity",
        },
        "rail",
      );

      timeline.addLabel("scroll", HOME_COVER_TIMELINE.at.scroll);
      if (scroll) {
        timeline.from(
          scroll,
          {
            y: distance * HOME_COVER_TIMELINE.distanceFactor.scroll,
            opacity: HOME_COVER_TIMELINE.opacity.scroll,
            duration: HOME_COVER_TIMELINE.duration.scroll,
            ease: MOTION_TOKENS.easing.editorial,
            clearProps: "transform,opacity",
          },
          "scroll",
        );
      }
    },
  });
}
