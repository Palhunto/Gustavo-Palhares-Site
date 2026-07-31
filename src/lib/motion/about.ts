import { ABOUT_PAGE_TIMELINE, MOTION_TOKENS } from "./config.ts";
import { initializeMotion } from "./lifecycle.ts";

const ABOUT_MOTION_TARGET_SELECTOR = [
  "[data-about-marker]",
  "[data-about-title-letter]",
  "[data-about-lead]",
  "[data-about-rule]",
].join(",");

function restoreAboutState(root: HTMLElement) {
  root
    .querySelectorAll<HTMLElement>(ABOUT_MOTION_TARGET_SELECTOR)
    .forEach((element) => element.removeAttribute("style"));
}

export function initializeAboutMotion(root: HTMLElement) {
  return initializeMotion({
    root,
    restoreFinalState: () => restoreAboutState(root),
    setup: ({ engine, compact, distance }) => {
      const { gsap } = engine;
      const marker = root.querySelector<HTMLElement>("[data-about-marker]");
      const letters = root.querySelectorAll<HTMLElement>(
        "[data-about-title-letter]",
      );
      const lead = root.querySelector<HTMLElement>("[data-about-lead]");
      const rule = root.querySelector<HTMLElement>("[data-about-rule]");
      const titleStagger = compact
        ? ABOUT_PAGE_TIMELINE.title.stagger.compact
        : ABOUT_PAGE_TIMELINE.title.stagger.regular;
      const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });

      if (marker) {
        timeline.from(
          marker,
          {
            y: distance * 0.24,
            opacity: ABOUT_PAGE_TIMELINE.auxiliaryOpacity,
            duration: ABOUT_PAGE_TIMELINE.duration.marker,
            ease: MOTION_TOKENS.easing.editorial,
            clearProps: "transform,opacity",
          },
          ABOUT_PAGE_TIMELINE.at.marker,
        );
      }

      timeline.from(
        letters,
        {
          yPercent: ABOUT_PAGE_TIMELINE.title.yPercent,
          skewX: ABOUT_PAGE_TIMELINE.title.skewX,
          opacity: ABOUT_PAGE_TIMELINE.title.initialOpacity,
          duration: ABOUT_PAGE_TIMELINE.duration.title,
          ease: MOTION_TOKENS.easing.editorial,
          stagger: {
            each: titleStagger,
            from: "start",
          },
          clearProps: "transform,opacity",
        },
        ABOUT_PAGE_TIMELINE.at.title,
      );

      if (rule) {
        timeline.from(
          rule,
          {
            scaleX: 0,
            duration: ABOUT_PAGE_TIMELINE.duration.rule,
            ease: MOTION_TOKENS.easing.line,
            clearProps: "transform",
          },
          ABOUT_PAGE_TIMELINE.at.rule,
        );
      }

      if (lead) {
        timeline.from(
          lead,
          {
            y: distance * 0.32,
            opacity: ABOUT_PAGE_TIMELINE.auxiliaryOpacity,
            duration: ABOUT_PAGE_TIMELINE.duration.lead,
            ease: MOTION_TOKENS.easing.editorial,
            clearProps: "transform,opacity",
          },
          ABOUT_PAGE_TIMELINE.at.lead,
        );
      }
    },
  });
}
