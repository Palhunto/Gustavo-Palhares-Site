import { EDITORIAL_TITLE_REVEAL, MOTION_TOKENS } from "./config.ts";
import { initializeMotion } from "./lifecycle.ts";

const TITLE_TARGET_SELECTOR = [
  "[data-editorial-title-letter]",
  "[data-editorial-title-support]",
].join(",");

function restoreEditorialTitleState(root: HTMLElement) {
  root
    .querySelectorAll<HTMLElement>(TITLE_TARGET_SELECTOR)
    .forEach((element) => element.removeAttribute("style"));
}

export function initializeEditorialTitleMotion(root: HTMLElement) {
  return initializeMotion({
    root,
    restoreFinalState: () => restoreEditorialTitleState(root),
    setup: ({ engine, compact, distance }) => {
      const { gsap } = engine;
      const letters = root.querySelectorAll<HTMLElement>(
        "[data-editorial-title-letter]",
      );
      const support = root.querySelectorAll<HTMLElement>(
        "[data-editorial-title-support]",
      );
      const titleStagger = compact
        ? EDITORIAL_TITLE_REVEAL.stagger.compact
        : EDITORIAL_TITLE_REVEAL.stagger.regular;
      const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });

      timeline.from(letters, {
        yPercent: EDITORIAL_TITLE_REVEAL.yPercent,
        skewX: EDITORIAL_TITLE_REVEAL.skewX,
        opacity: EDITORIAL_TITLE_REVEAL.initialOpacity,
        duration: 0.72,
        ease: MOTION_TOKENS.easing.editorial,
        stagger: {
          each: titleStagger,
          from: "start",
        },
        clearProps: "transform,opacity",
      });

      if (support.length > 0) {
        timeline.from(
          support,
          {
            y: distance * 0.28,
            opacity: 0.68,
            duration: 0.5,
            ease: MOTION_TOKENS.easing.editorial,
            stagger: 0.06,
            clearProps: "transform,opacity",
          },
          0.42,
        );
      }
    },
  });
}
