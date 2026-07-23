import { MOTION_NAMES, MOTION_TOKENS } from "./config.ts";
import { initializeMotion } from "./lifecycle.ts";

const MOTION_TARGET_SELECTOR = "[data-motion-target]";

function restoreLaboratoryState(root: HTMLElement) {
  root
    .querySelectorAll<HTMLElement>(MOTION_TARGET_SELECTOR)
    .forEach((element) => element.removeAttribute("style"));

  const links = root.querySelectorAll<HTMLAnchorElement>(
    "[data-motion-index-link]",
  );
  links.forEach((link, index) => {
    link.classList.toggle("is-active", index === 0);
    if (index === 0) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

export function initializeMotionLaboratory(root: HTMLElement) {
  return initializeMotion({
    root,
    restoreFinalState: () => restoreLaboratoryState(root),
    setup: ({ engine, compact, distance, stagger }) => {
      const { gsap, ScrollTrigger } = engine;

      const headlineLines = root.querySelectorAll<HTMLElement>(
        `[data-motion="${MOTION_NAMES.headline}"] [data-motion-target]`,
      );
      gsap.from(headlineLines, {
        yPercent: compact
          ? MOTION_TOKENS.headline.yPercent.compact
          : MOTION_TOKENS.headline.yPercent.regular,
        duration: MOTION_TOKENS.headline.duration,
        ease: MOTION_TOKENS.easing.editorial,
        stagger: compact
          ? MOTION_TOKENS.headline.stagger.compact
          : MOTION_TOKENS.headline.stagger.regular,
        clearProps: "transform",
      });

      const rule = root.querySelector<HTMLElement>(
        `[data-motion="${MOTION_NAMES.rule}"] [data-motion-target]`,
      );
      if (rule) {
        gsap.from(rule, {
          scaleX: 0,
          duration: MOTION_TOKENS.duration.editorial,
          ease: MOTION_TOKENS.easing.line,
          clearProps: "transform",
          scrollTrigger: {
            trigger: rule,
            start: MOTION_TOKENS.scroll.entryStart,
            once: true,
          },
        });
      }

      const image = root.querySelector<HTMLElement>(
        `[data-motion="${MOTION_NAMES.image}"] [data-motion-target]`,
      );
      if (image) {
        gsap.fromTo(
          image,
          {
            autoAlpha: MOTION_TOKENS.image.initialOpacity,
            scale: MOTION_TOKENS.image.initialScale,
            clipPath: MOTION_TOKENS.image.initialClip,
          },
          {
            autoAlpha: 1,
            scale: 1,
            clipPath: MOTION_TOKENS.image.finalClip,
            duration: MOTION_TOKENS.duration.slow,
            ease: MOTION_TOKENS.easing.image,
            clearProps: "opacity,visibility,transform,clipPath",
            scrollTrigger: {
              trigger: image,
              start: MOTION_TOKENS.scroll.entryStart,
              once: true,
            },
          },
        );
      }

      const block = root.querySelector<HTMLElement>(
        `[data-motion="${MOTION_NAMES.block}"]`,
      );
      const blockItems = block?.querySelectorAll<HTMLElement>(
        "[data-motion-target]",
      );
      if (block && blockItems?.length) {
        gsap.from(blockItems, {
          y: distance,
          opacity: 0,
          duration: MOTION_TOKENS.duration.editorial,
          ease: MOTION_TOKENS.easing.editorial,
          stagger,
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: block,
            start: MOTION_TOKENS.scroll.entryStart,
            once: true,
          },
        });
      }

      const indexLinks = root.querySelectorAll<HTMLAnchorElement>(
        `[data-motion="${MOTION_NAMES.index}"] [data-motion-index-link]`,
      );
      const indexSections = root.querySelectorAll<HTMLElement>(
        `[data-motion="${MOTION_NAMES.index}"] [data-motion-index-section]`,
      );
      const setActive = (sectionId: string) => {
        indexLinks.forEach((link) => {
          const active = link.hash === `#${sectionId}`;
          link.classList.toggle("is-active", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      };

      indexSections.forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: MOTION_TOKENS.scroll.indexStart,
          end: MOTION_TOKENS.scroll.indexEnd,
          onEnter: () => setActive(section.id),
          onEnterBack: () => setActive(section.id),
        });
      });
    },
  });
}
