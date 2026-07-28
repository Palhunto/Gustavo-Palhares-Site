import { KAUAN_WORK_TIMELINES, MOTION_TOKENS } from "./config.ts";
import type { MotionEngine } from "./gsap.ts";
import { initializeMotion } from "./lifecycle.ts";
import {
  animateWorkEnding,
  beginWorkRefreshGeneration,
  currentWorkRefreshGeneration,
  isPastViewport,
  resolveCurrentWorkEntryMode,
  scheduleStableRefresh,
  type NephillinEntryMode,
} from "./nephillin-work.ts";
import { prefersReducedMotion } from "./preferences.ts";

type GsapInstance = MotionEngine["gsap"];
type ScrollTriggerInstance = MotionEngine["ScrollTrigger"];

const KAUAN_TARGET_SELECTOR = [
  "[data-work-intro] .work-header__marker",
  "[data-work-title]",
  "[data-work-summary]",
  "[data-work-metadata]",
  "[data-work-metadata] > div",
  "[data-work-lead] .editorial-picture",
  "[data-work-gallery] [data-work-figure]",
  "[data-work-credit] .credits",
  "[data-work-credit] .credits__item",
  "[data-work-continuity]",
  "[data-work-continuity] .work-continuity__link",
].join(",");

function restoreKauanState(root: HTMLElement) {
  beginWorkRefreshGeneration(root);
  root
    .querySelectorAll<HTMLElement>(KAUAN_TARGET_SELECTOR)
    .forEach((element) => element.removeAttribute("style"));
}

function figureFromVars(
  distance: number,
  groupIndex: number,
  itemIndex: number,
) {
  const direction = itemIndex % 2 === 0 ? -1 : 1;
  const restrained = groupIndex === 4;
  return {
    x: restrained ? 0 : distance * direction * (groupIndex === 1 ? 0.26 : 0.14),
    y: distance * (restrained ? 0.24 : 0.48),
    opacity: restrained ? 0.78 : 0.7,
    scale: restrained ? 1.008 : 1.016,
    clipPath: restrained ? "inset(0 0 4% 0)" : "inset(0 0 7% 0)",
  };
}

function figureToVars(duration: number) {
  return {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    clipPath: MOTION_TOKENS.image.finalClip,
    duration,
    ease: MOTION_TOKENS.easing.image,
    clearProps: "transform,opacity,clipPath",
  };
}

function animateIntro(
  root: HTMLElement,
  gsap: GsapInstance,
  distance: number,
  entryMode: NephillinEntryMode,
) {
  const marker = root.querySelector<HTMLElement>(
    "[data-work-intro] .work-header__marker",
  );
  const title = root.querySelector<HTMLElement>("[data-work-title]");
  const summary = root.querySelector<HTMLElement>("[data-work-summary]");
  const metadata = root.querySelector<HTMLElement>("[data-work-metadata]");
  const metadataItems =
    metadata?.querySelectorAll<HTMLElement>(":scope > div") ?? [];
  const leadPicture = root.querySelector<HTMLElement>(
    "[data-work-lead] .editorial-picture",
  );
  const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });

  if (marker) {
    timeline.from(
      marker,
      {
        y: distance * 0.36,
        opacity: 0.8,
        duration: KAUAN_WORK_TIMELINES.intro.duration.marker,
        ease: MOTION_TOKENS.easing.editorial,
        clearProps: "transform,opacity",
      },
      KAUAN_WORK_TIMELINES.intro.at.marker,
    );
  }
  if (title) {
    timeline.from(
      title,
      {
        y: distance * 0.7,
        duration: KAUAN_WORK_TIMELINES.intro.duration.title,
        ease: MOTION_TOKENS.easing.editorial,
        clearProps: "transform",
      },
      KAUAN_WORK_TIMELINES.intro.at.title,
    );
  }
  if (summary) {
    timeline.from(
      summary,
      {
        y: distance * 0.44,
        opacity: 0.8,
        duration: KAUAN_WORK_TIMELINES.intro.duration.summary,
        ease: MOTION_TOKENS.easing.editorial,
        clearProps: "transform,opacity",
      },
      KAUAN_WORK_TIMELINES.intro.at.summary,
    );
  }
  if (metadata) {
    timeline.fromTo(
      metadata,
      { "--work-metadata-rule-scale": 0 },
      {
        "--work-metadata-rule-scale": 1,
        duration: KAUAN_WORK_TIMELINES.intro.duration.rule,
        ease: MOTION_TOKENS.easing.line,
        clearProps: "--work-metadata-rule-scale",
      },
      KAUAN_WORK_TIMELINES.intro.at.rule,
    );
    timeline.from(
      metadataItems,
      {
        y: distance * 0.26,
        opacity: 0.82,
        duration: KAUAN_WORK_TIMELINES.intro.duration.metadata,
        ease: MOTION_TOKENS.easing.editorial,
        stagger: 0.05,
        clearProps: "transform,opacity",
      },
      KAUAN_WORK_TIMELINES.intro.at.metadata,
    );
  }
  if (entryMode === "direct" && leadPicture) {
    timeline.fromTo(
      leadPicture,
      {
        opacity: 0.74,
        scale: 1.02,
        clipPath: "inset(0 0 6% 0)",
      },
      {
        opacity: 1,
        scale: 1,
        clipPath: MOTION_TOKENS.image.finalClip,
        duration: KAUAN_WORK_TIMELINES.intro.duration.lead,
        ease: MOTION_TOKENS.easing.image,
        clearProps: "opacity,transform,clipPath",
      },
      KAUAN_WORK_TIMELINES.intro.at.lead,
    );
  }
}

function animateDesktopGroups(
  root: HTMLElement,
  gsap: GsapInstance,
  ScrollTrigger: ScrollTriggerInstance,
  distance: number,
) {
  const groups = Array.from(
    root.querySelectorAll<HTMLElement>("[data-work-gallery] > *"),
  );

  groups.forEach((group, groupIndex) => {
    if (isPastViewport(group)) return;
    const figures = Array.from(
      group.querySelectorAll<HTMLElement>("[data-work-figure]"),
    );
    const duration =
      KAUAN_WORK_TIMELINES.group.durations[groupIndex] ??
      KAUAN_WORK_TIMELINES.group.durations[1];
    const stagger =
      KAUAN_WORK_TIMELINES.group.staggers[groupIndex] ??
      KAUAN_WORK_TIMELINES.group.staggers[1];

    ScrollTrigger.create({
      trigger: group,
      start: KAUAN_WORK_TIMELINES.trigger.group,
      once: true,
      onEnter: () => {
        const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });
        figures.forEach((figure, itemIndex) => {
          timeline.fromTo(
            figure,
            figureFromVars(distance, groupIndex, itemIndex),
            figureToVars(duration),
            itemIndex * stagger,
          );
        });
      },
    });
  });
}

function animateMobileFigures(
  root: HTMLElement,
  gsap: GsapInstance,
  ScrollTrigger: ScrollTriggerInstance,
  distance: number,
) {
  const figures = Array.from(
    root.querySelectorAll<HTMLElement>(
      "[data-work-gallery] [data-work-figure]",
    ),
  );
  figures.forEach((figure, index) => {
    if (isPastViewport(figure)) return;
    ScrollTrigger.create({
      trigger: figure,
      start: KAUAN_WORK_TIMELINES.trigger.mobileFigure,
      once: true,
      onEnter: () => {
        gsap.fromTo(
          figure,
          figureFromVars(distance * 0.64, index >= 9 ? 4 : 0, index),
          figureToVars(KAUAN_WORK_TIMELINES.mobile.duration),
        );
      },
    });
  });
}

export function initializeKauanWorkMotion(
  root: HTMLElement,
  documentRoot: Document = document,
) {
  const entryMode = resolveCurrentWorkEntryMode(documentRoot);

  if (entryMode === "restored" || prefersReducedMotion()) {
    root.dataset.workMotionPresented = "true";
  }

  const cleanup = initializeMotion({
    root,
    restoreFinalState: () => restoreKauanState(root),
    setup: ({ engine, compact, distance }) => {
      if (root.dataset.workMotionPresented === "true") return;

      const { gsap, ScrollTrigger } = engine;
      const generation = currentWorkRefreshGeneration(root);
      root.dataset.workMotionPresented = "true";
      root.dataset.workEntryMode = entryMode;

      animateIntro(root, gsap, distance, entryMode);
      if (compact) {
        animateMobileFigures(root, gsap, ScrollTrigger, distance);
      } else {
        animateDesktopGroups(root, gsap, ScrollTrigger, distance);
      }
      animateWorkEnding(root, gsap, ScrollTrigger, distance);
      scheduleStableRefresh(root, () => ScrollTrigger.refresh(), generation);
    },
  });

  return () => {
    cleanup();
    root.removeAttribute("data-work-entry-mode");
    root.removeAttribute("data-work-motion-presented");
  };
}
