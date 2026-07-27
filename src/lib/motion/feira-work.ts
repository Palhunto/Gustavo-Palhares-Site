import { FEIRA_WORK_TIMELINES, MOTION_TOKENS } from "./config.ts";
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

const FEIRA_SHEET_ROW_BREAKPOINT = 1024;
const FEIRA_TARGET_SELECTOR = [
  "[data-work-intro] .work-header__marker",
  "[data-work-title-line]",
  "[data-work-summary]",
  "[data-work-metadata]",
  "[data-work-metadata] > div",
  "[data-work-lead] .editorial-picture",
  "[data-work-gallery] [data-work-figure]",
  "[data-work-gallery] .editorial-picture",
  "[data-work-gallery] [data-work-number]",
  "[data-work-contact-sheet]",
  "[data-work-contact-sheet] .contact-sheet__heading",
  "[data-work-credit] .credits",
  "[data-work-credit] .credits__item",
  "[data-work-related]",
  "[data-work-related] .related-works__heading",
  "[data-work-related] .related-works__item",
  "[data-work-continuity]",
  "[data-work-continuity] .work-continuity__link",
].join(",");

function restoreFeiraState(root: HTMLElement) {
  beginWorkRefreshGeneration(root);
  root
    .querySelectorAll<HTMLElement>(FEIRA_TARGET_SELECTOR)
    .forEach((element) => element.removeAttribute("style"));
}

function imageFromVars(distance: number, x = 0) {
  return {
    x,
    y: distance * 0.42,
    opacity: 0.74,
    scale: 1.018,
    clipPath: "inset(0 0 7% 0)",
  };
}

function imageToVars(duration: number) {
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
  compact: boolean,
  entryMode: NephillinEntryMode,
) {
  const marker = root.querySelector<HTMLElement>(
    "[data-work-intro] .work-header__marker",
  );
  const titleLine = root.querySelector<HTMLElement>("[data-work-title-line]");
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
        y: distance * 0.34,
        opacity: FEIRA_WORK_TIMELINES.intro.opacity.marker,
        duration: FEIRA_WORK_TIMELINES.intro.duration.marker,
        ease: MOTION_TOKENS.easing.editorial,
        clearProps: "transform,opacity",
      },
      FEIRA_WORK_TIMELINES.intro.at.marker,
    );
  }
  if (titleLine) {
    timeline.from(
      titleLine,
      {
        yPercent: compact
          ? MOTION_TOKENS.headline.yPercent.compact
          : MOTION_TOKENS.headline.yPercent.regular,
        duration: FEIRA_WORK_TIMELINES.intro.duration.title,
        ease: MOTION_TOKENS.easing.editorial,
        clearProps: "transform",
      },
      FEIRA_WORK_TIMELINES.intro.at.title,
    );
  }
  if (summary) {
    timeline.from(
      summary,
      {
        y: distance * 0.4,
        opacity: FEIRA_WORK_TIMELINES.intro.opacity.summary,
        duration: FEIRA_WORK_TIMELINES.intro.duration.summary,
        ease: MOTION_TOKENS.easing.editorial,
        clearProps: "transform,opacity",
      },
      FEIRA_WORK_TIMELINES.intro.at.summary,
    );
  }
  if (metadata) {
    timeline.fromTo(
      metadata,
      { "--work-metadata-rule-scale": 0 },
      {
        "--work-metadata-rule-scale": 1,
        duration: FEIRA_WORK_TIMELINES.intro.duration.rule,
        ease: MOTION_TOKENS.easing.line,
        clearProps: "--work-metadata-rule-scale",
      },
      FEIRA_WORK_TIMELINES.intro.at.rule,
    );
    timeline.from(
      metadataItems,
      {
        y: distance * 0.24,
        opacity: FEIRA_WORK_TIMELINES.intro.opacity.metadata,
        duration: FEIRA_WORK_TIMELINES.intro.duration.metadata,
        ease: MOTION_TOKENS.easing.editorial,
        stagger: 0.045,
        clearProps: "transform,opacity",
      },
      FEIRA_WORK_TIMELINES.intro.at.metadata,
    );
  }
  if (entryMode === "direct" && leadPicture) {
    timeline.fromTo(
      leadPicture,
      {
        scale: 1.022,
        clipPath: "inset(0 0 6% 0)",
      },
      {
        scale: 1,
        clipPath: MOTION_TOKENS.image.finalClip,
        duration: FEIRA_WORK_TIMELINES.intro.duration.lead,
        ease: MOTION_TOKENS.easing.image,
        clearProps: "transform,clipPath",
      },
      FEIRA_WORK_TIMELINES.intro.at.lead,
    );
  }

  return timeline;
}

function animateDiptych(
  root: HTMLElement,
  gsap: GsapInstance,
  ScrollTrigger: ScrollTriggerInstance,
  distance: number,
) {
  const diptych = root.querySelector<HTMLElement>(
    "[data-work-gallery] > .diptych",
  );
  const figures = Array.from(
    diptych?.querySelectorAll<HTMLElement>(":scope > [data-work-figure]") ?? [],
  );
  const [first, second] = figures;
  const firstPicture = first?.querySelector<HTMLElement>(".editorial-picture");
  const secondPicture =
    second?.querySelector<HTMLElement>(".editorial-picture");
  const numbers = figures.flatMap((figure) =>
    Array.from(figure.querySelectorAll<HTMLElement>("[data-work-number]")),
  );
  if (!diptych || !firstPicture || !secondPicture || isPastViewport(diptych)) {
    return;
  }

  ScrollTrigger.create({
    trigger: diptych,
    start: FEIRA_WORK_TIMELINES.trigger.diptych,
    once: true,
    onEnter: () => {
      const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });
      timeline.fromTo(
        firstPicture,
        imageFromVars(distance, distance * -0.22),
        imageToVars(FEIRA_WORK_TIMELINES.diptych.duration.first),
        FEIRA_WORK_TIMELINES.diptych.at.first,
      );
      timeline.fromTo(
        secondPicture,
        imageFromVars(distance * 0.82, distance * 0.2),
        imageToVars(FEIRA_WORK_TIMELINES.diptych.duration.second),
        FEIRA_WORK_TIMELINES.diptych.at.second,
      );
      timeline.from(
        numbers,
        {
          y: distance * 0.22,
          opacity: 0.78,
          duration: FEIRA_WORK_TIMELINES.diptych.duration.numbers,
          ease: MOTION_TOKENS.easing.editorial,
          stagger: 0.08,
          clearProps: "transform,opacity",
        },
        FEIRA_WORK_TIMELINES.diptych.at.numbers,
      );
    },
  });
}

function animateSheetStructure(
  sheet: HTMLElement,
  timeline: ReturnType<GsapInstance["timeline"]>,
  heading: HTMLElement | null,
  distance: number,
) {
  if (heading) {
    timeline.from(
      heading,
      {
        y: distance * 0.22,
        opacity: 0.82,
        duration: FEIRA_WORK_TIMELINES.sheet.duration.identification,
        ease: MOTION_TOKENS.easing.editorial,
        clearProps: "transform,opacity",
      },
      FEIRA_WORK_TIMELINES.sheet.at.identification,
    );
  }
  timeline.fromTo(
    sheet,
    {
      "--feira-sheet-inline-scale": 0,
      "--feira-sheet-block-scale": 0,
    },
    {
      "--feira-sheet-inline-scale": 1,
      "--feira-sheet-block-scale": 1,
      duration: FEIRA_WORK_TIMELINES.sheet.duration.frame,
      ease: MOTION_TOKENS.easing.line,
      clearProps: "--feira-sheet-inline-scale,--feira-sheet-block-scale",
    },
    FEIRA_WORK_TIMELINES.sheet.at.frame,
  );
}

function animateDesktopSheet(
  sheet: HTMLElement,
  gsap: GsapInstance,
  ScrollTrigger: ScrollTriggerInstance,
  figures: HTMLElement[],
  distance: number,
) {
  if (isPastViewport(sheet)) return;
  const heading = sheet.querySelector<HTMLElement>(".contact-sheet__heading");
  const pictures = figures.flatMap((figure) => {
    const picture = figure.querySelector<HTMLElement>(".editorial-picture");
    return picture ? [picture] : [];
  });
  const numbers = figures.flatMap((figure) =>
    Array.from(figure.querySelectorAll<HTMLElement>("[data-work-number]")),
  );

  ScrollTrigger.create({
    trigger: sheet,
    start: FEIRA_WORK_TIMELINES.trigger.sheet,
    once: true,
    onEnter: () => {
      const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });
      animateSheetStructure(sheet, timeline, heading, distance);
      timeline.fromTo(
        pictures,
        imageFromVars(distance * 0.58),
        {
          ...imageToVars(FEIRA_WORK_TIMELINES.sheet.duration.figure),
          stagger: FEIRA_WORK_TIMELINES.sheet.stagger,
        },
        FEIRA_WORK_TIMELINES.sheet.at.figures,
      );
      timeline.from(
        numbers,
        {
          y: distance * 0.18,
          opacity: 0.76,
          duration: FEIRA_WORK_TIMELINES.sheet.duration.number,
          ease: MOTION_TOKENS.easing.editorial,
          stagger: FEIRA_WORK_TIMELINES.sheet.stagger,
          clearProps: "transform,opacity",
        },
        FEIRA_WORK_TIMELINES.sheet.at.numbers,
      );
    },
  });
}

function animateSheetRows(
  sheet: HTMLElement,
  gsap: GsapInstance,
  ScrollTrigger: ScrollTriggerInstance,
  figures: HTMLElement[],
  distance: number,
) {
  const heading = sheet.querySelector<HTMLElement>(".contact-sheet__heading");
  if (!isPastViewport(sheet)) {
    ScrollTrigger.create({
      trigger: sheet,
      start: FEIRA_WORK_TIMELINES.trigger.sheet,
      once: true,
      onEnter: () => {
        const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });
        animateSheetStructure(sheet, timeline, heading, distance);
      },
    });
  }

  const rows = [figures.slice(0, 2), figures.slice(2, 4), figures.slice(4, 6)];
  for (const row of rows) {
    const trigger = row[0];
    if (!trigger || isPastViewport(trigger)) continue;
    const pictures = row.flatMap((figure) => {
      const picture = figure.querySelector<HTMLElement>(".editorial-picture");
      return picture ? [picture] : [];
    });
    const numbers = row.flatMap((figure) =>
      Array.from(figure.querySelectorAll<HTMLElement>("[data-work-number]")),
    );
    ScrollTrigger.create({
      trigger,
      start: FEIRA_WORK_TIMELINES.trigger.sheetRow,
      once: true,
      onEnter: () => {
        const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });
        timeline.fromTo(pictures, imageFromVars(distance * 0.46), {
          ...imageToVars(FEIRA_WORK_TIMELINES.sheet.duration.rowFigure),
          stagger: FEIRA_WORK_TIMELINES.sheet.stagger,
        });
        timeline.from(
          numbers,
          {
            y: distance * 0.16,
            opacity: 0.78,
            duration: FEIRA_WORK_TIMELINES.sheet.duration.number,
            ease: MOTION_TOKENS.easing.editorial,
            stagger: FEIRA_WORK_TIMELINES.sheet.stagger,
            clearProps: "transform,opacity",
          },
          0.14,
        );
      },
    });
  }
}

function animateContactSheet(
  root: HTMLElement,
  gsap: GsapInstance,
  ScrollTrigger: ScrollTriggerInstance,
  distance: number,
) {
  const sheet = root.querySelector<HTMLElement>("[data-work-contact-sheet]");
  if (!sheet) return;
  const figures = Array.from(
    sheet.querySelectorAll<HTMLElement>("[data-work-figure]"),
  );
  if (window.innerWidth < FEIRA_SHEET_ROW_BREAKPOINT) {
    animateSheetRows(sheet, gsap, ScrollTrigger, figures, distance);
  } else {
    animateDesktopSheet(sheet, gsap, ScrollTrigger, figures, distance);
  }
}

export function initializeFeiraWorkMotion(
  root: HTMLElement,
  documentRoot: Document = document,
) {
  const entryMode = resolveCurrentWorkEntryMode(documentRoot);

  if (entryMode === "restored" || prefersReducedMotion()) {
    root.dataset.workMotionPresented = "true";
  }

  const cleanup = initializeMotion({
    root,
    restoreFinalState: () => restoreFeiraState(root),
    setup: ({ engine, compact, distance }) => {
      if (root.dataset.workMotionPresented === "true") return;

      const { gsap, ScrollTrigger } = engine;
      const generation = currentWorkRefreshGeneration(root);

      root.dataset.workMotionPresented = "true";
      root.dataset.workEntryMode = entryMode;

      animateIntro(root, gsap, distance, compact, entryMode);
      animateDiptych(root, gsap, ScrollTrigger, distance);
      animateContactSheet(root, gsap, ScrollTrigger, distance);
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
