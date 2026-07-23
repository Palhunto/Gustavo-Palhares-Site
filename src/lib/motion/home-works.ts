import { HOME_WORKS_TIMELINES, MOTION_TOKENS } from "./config.ts";
import { initializeMotion } from "./lifecycle.ts";

const HOME_WORKS_TARGET_SELECTOR = [
  "[data-home-works-heading-copy]",
  "[data-home-works-heading-rule]",
  "[data-home-works-heading-note]",
  "[data-home-works-image]",
  "[data-home-works-image] .editorial-picture",
  "[data-home-works-eyebrow]",
  "[data-home-works-title]",
  "[data-home-works-summary]",
  "[data-home-works-meta]",
  "[data-home-works-cta]",
  "[data-home-works-divider]",
].join(",");

const refreshGenerations = new WeakMap<HTMLElement, number>();

function restoreHomeWorksState(root: HTMLElement) {
  refreshGenerations.set(root, (refreshGenerations.get(root) ?? 0) + 1);
  root
    .querySelectorAll<HTMLElement>(HOME_WORKS_TARGET_SELECTOR)
    .forEach((element) => element.removeAttribute("style"));
}

function scheduleStableRefresh(
  root: HTMLElement,
  refresh: () => void,
  generation: number,
) {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  const imageReadiness = images.map((image) =>
    image.complete ? Promise.resolve() : image.decode().catch(() => undefined),
  );
  const fontReadiness = document.fonts?.ready ?? Promise.resolve();

  void Promise.all([fontReadiness, ...imageReadiness]).then(() => {
    if (
      refreshGenerations.get(root) === generation &&
      root.isConnected &&
      root.dataset.motionState === "enhanced"
    ) {
      refresh();
    }
  });
}

function workTargets(root: HTMLElement, kind: "lead" | "reverse") {
  const item = root.querySelector<HTMLElement>(
    `[data-home-works-item="${kind}"]`,
  );
  if (!item) return undefined;

  return {
    item,
    image: item.querySelector<HTMLElement>(
      "[data-home-works-image] .editorial-picture",
    ),
    eyebrow: item.querySelectorAll<HTMLElement>("[data-home-works-eyebrow]"),
    title: item.querySelector<HTMLElement>("[data-home-works-title]"),
    support: item.querySelectorAll<HTMLElement>(
      "[data-home-works-summary], [data-home-works-meta], [data-home-works-cta]",
    ),
  };
}

function isPastViewport(element: HTMLElement): boolean {
  return element.getBoundingClientRect().bottom <= 0;
}

export function initializeHomeWorksMotion(root: HTMLElement) {
  return initializeMotion({
    root,
    restoreFinalState: () => restoreHomeWorksState(root),
    setup: ({ engine, compact, distance }) => {
      const { gsap, ScrollTrigger } = engine;
      const generation = refreshGenerations.get(root) ?? 0;
      const heading = root.querySelector<HTMLElement>(
        "[data-home-works-header]",
      );
      const headingCopy = root.querySelectorAll<HTMLElement>(
        "[data-home-works-heading-copy]",
      );
      const headingRule = root.querySelector<HTMLElement>(
        "[data-home-works-heading-rule]",
      );
      const headingNote = root.querySelector<HTMLElement>(
        "[data-home-works-heading-note]",
      );
      const divider = root.querySelector<HTMLElement>(
        "[data-home-works-divider]",
      );

      if (heading && !isPastViewport(heading)) {
        const timeline = gsap.timeline({
          defaults: { overwrite: "auto" },
          scrollTrigger: {
            trigger: heading,
            start: HOME_WORKS_TIMELINES.trigger.heading,
            once: true,
          },
        });

        timeline.from(
          headingCopy,
          {
            y: distance * 0.42,
            opacity: HOME_WORKS_TIMELINES.text.initialOpacity,
            duration: HOME_WORKS_TIMELINES.heading.duration.copy,
            ease: MOTION_TOKENS.easing.editorial,
            stagger: HOME_WORKS_TIMELINES.heading.stagger,
            clearProps: "transform,opacity",
          },
          HOME_WORKS_TIMELINES.heading.at.copy,
        );
        if (headingRule) {
          timeline.from(
            headingRule,
            {
              scaleX: 0,
              duration: HOME_WORKS_TIMELINES.heading.duration.rule,
              ease: MOTION_TOKENS.easing.line,
              clearProps: "transform",
            },
            HOME_WORKS_TIMELINES.heading.at.rule,
          );
        }
        if (headingNote) {
          timeline.from(
            headingNote,
            {
              y: distance * 0.3,
              opacity: HOME_WORKS_TIMELINES.text.initialOpacity,
              duration: HOME_WORKS_TIMELINES.heading.duration.note,
              ease: MOTION_TOKENS.easing.editorial,
              clearProps: "transform,opacity",
            },
            HOME_WORKS_TIMELINES.heading.at.note,
          );
        }
      }

      const lead = workTargets(root, "lead");
      if (lead && !isPastViewport(lead.item)) {
        const timeline = gsap.timeline({
          defaults: { overwrite: "auto" },
          scrollTrigger: {
            trigger: lead.item,
            start: HOME_WORKS_TIMELINES.trigger.work,
            once: true,
          },
        });

        if (lead.image) {
          timeline.fromTo(
            lead.image,
            {
              opacity: MOTION_TOKENS.image.initialOpacity,
              scale: 1.03,
              clipPath: MOTION_TOKENS.image.initialClip,
            },
            {
              opacity: 1,
              scale: 1,
              clipPath: MOTION_TOKENS.image.finalClip,
              duration: compact
                ? HOME_WORKS_TIMELINES.lead.imageDuration.compact
                : HOME_WORKS_TIMELINES.lead.imageDuration.regular,
              ease: MOTION_TOKENS.easing.image,
              clearProps: "opacity,transform,clipPath",
            },
            HOME_WORKS_TIMELINES.lead.at.image,
          );
        }
        timeline.from(
          lead.eyebrow,
          {
            y: distance * 0.34,
            opacity: HOME_WORKS_TIMELINES.text.initialOpacity,
            duration: HOME_WORKS_TIMELINES.text.duration,
            ease: MOTION_TOKENS.easing.editorial,
            stagger: 0.04,
            clearProps: "transform,opacity",
          },
          HOME_WORKS_TIMELINES.lead.at.eyebrow,
        );
        if (lead.title) {
          timeline.from(
            lead.title,
            {
              y: distance * 0.5,
              opacity: HOME_WORKS_TIMELINES.text.initialOpacity,
              duration: HOME_WORKS_TIMELINES.text.titleDuration,
              ease: MOTION_TOKENS.easing.editorial,
              clearProps: "transform,opacity",
            },
            HOME_WORKS_TIMELINES.lead.at.title,
          );
        }
        timeline.from(
          lead.support,
          {
            y: distance * 0.32,
            opacity: HOME_WORKS_TIMELINES.text.initialOpacity,
            duration: HOME_WORKS_TIMELINES.text.duration,
            ease: MOTION_TOKENS.easing.editorial,
            stagger: HOME_WORKS_TIMELINES.text.stagger,
            clearProps: "transform,opacity",
          },
          HOME_WORKS_TIMELINES.lead.at.support,
        );
      }

      if (divider && !isPastViewport(divider)) {
        gsap.from(divider, {
          scaleX: 0,
          duration: HOME_WORKS_TIMELINES.dividerDuration,
          ease: MOTION_TOKENS.easing.line,
          clearProps: "transform",
          scrollTrigger: {
            trigger: divider,
            start: HOME_WORKS_TIMELINES.trigger.divider,
            once: true,
          },
        });
      }

      const reverse = workTargets(root, "reverse");
      if (reverse && !isPastViewport(reverse.item)) {
        const timeline = gsap.timeline({
          defaults: { overwrite: "auto" },
          scrollTrigger: {
            trigger: reverse.item,
            start: HOME_WORKS_TIMELINES.trigger.work,
            once: true,
          },
        });

        timeline.from(
          reverse.eyebrow,
          {
            y: distance * 0.3,
            opacity: HOME_WORKS_TIMELINES.text.initialOpacity,
            duration: HOME_WORKS_TIMELINES.text.duration,
            ease: MOTION_TOKENS.easing.editorial,
            stagger: 0.04,
            clearProps: "transform,opacity",
          },
          HOME_WORKS_TIMELINES.reverse.at.eyebrow,
        );
        if (reverse.image) {
          timeline.fromTo(
            reverse.image,
            {
              opacity: 0.66,
              scale: HOME_WORKS_TIMELINES.reverse.initialScale,
              clipPath: HOME_WORKS_TIMELINES.reverse.initialClip,
              transformOrigin: "right center",
            },
            {
              opacity: 1,
              scale: 1,
              clipPath: MOTION_TOKENS.image.finalClip,
              duration: compact
                ? HOME_WORKS_TIMELINES.reverse.imageDuration.compact
                : HOME_WORKS_TIMELINES.reverse.imageDuration.regular,
              ease: MOTION_TOKENS.easing.image,
              clearProps: "opacity,transform,clipPath,transformOrigin",
            },
            HOME_WORKS_TIMELINES.reverse.at.image,
          );
        }
        if (reverse.title) {
          timeline.from(
            reverse.title,
            {
              y: distance * 0.46,
              opacity: HOME_WORKS_TIMELINES.text.initialOpacity,
              duration: HOME_WORKS_TIMELINES.text.titleDuration,
              ease: MOTION_TOKENS.easing.editorial,
              clearProps: "transform,opacity",
            },
            HOME_WORKS_TIMELINES.reverse.at.title,
          );
        }
        timeline.from(
          reverse.support,
          {
            y: distance * 0.3,
            opacity: HOME_WORKS_TIMELINES.text.initialOpacity,
            duration: HOME_WORKS_TIMELINES.text.duration,
            ease: MOTION_TOKENS.easing.editorial,
            stagger: HOME_WORKS_TIMELINES.text.stagger,
            clearProps: "transform,opacity",
          },
          HOME_WORKS_TIMELINES.reverse.at.support,
        );
      }

      scheduleStableRefresh(root, () => ScrollTrigger.refresh(), generation);
    },
  });
}
