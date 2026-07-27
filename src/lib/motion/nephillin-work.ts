import { MOTION_TOKENS, NEPHILLIN_WORK_TIMELINES } from "./config.ts";
import type { MotionEngine } from "./gsap.ts";
import { initializeMotion } from "./lifecycle.ts";
import { prefersReducedMotion } from "./preferences.ts";

type GsapInstance = MotionEngine["gsap"];
type ScrollTriggerInstance = MotionEngine["ScrollTrigger"];
type NavigationType = PerformanceNavigationTiming["type"];

export type NephillinEntryMode = "shared" | "direct" | "restored";

export interface NephillinEntryContext {
  activeViewTransition: boolean;
  navigationType?: NavigationType;
  scrollY: number;
}

const NEPHILLIN_TARGET_SELECTOR = [
  "[data-work-intro] .work-header__marker",
  "[data-work-title]",
  "[data-work-summary]",
  "[data-work-metadata]",
  "[data-work-metadata] > div",
  "[data-work-lead] .editorial-picture",
  "[data-work-gallery] [data-work-figure]",
  "[data-work-credit] .credits",
  "[data-work-credit] .credits__item",
  "[data-work-related]",
  "[data-work-related] .related-works__heading",
  "[data-work-related] .related-works__item",
  "[data-work-continuity]",
  "[data-work-continuity] .work-continuity__link",
].join(",");

const refreshGenerations = new WeakMap<HTMLElement, number>();

export function resolveNephillinEntryMode({
  activeViewTransition,
  navigationType,
  scrollY,
}: NephillinEntryContext): NephillinEntryMode {
  if (navigationType === "back_forward" || scrollY > 1) return "restored";
  return activeViewTransition ? "shared" : "direct";
}

function currentNavigationType(): NavigationType | undefined {
  const navigation = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  return navigation?.entryType === "navigation" ? navigation.type : undefined;
}

function hasActiveViewTransition(documentRoot: Document): boolean {
  return Boolean(
    (
      documentRoot as Document & {
        activeViewTransition?: unknown;
      }
    ).activeViewTransition,
  );
}

export function resolveCurrentWorkEntryMode(
  documentRoot: Document,
): NephillinEntryMode {
  return resolveNephillinEntryMode({
    activeViewTransition: hasActiveViewTransition(documentRoot),
    navigationType: currentNavigationType(),
    scrollY: window.scrollY,
  });
}

export function beginWorkRefreshGeneration(root: HTMLElement): number {
  const generation = (refreshGenerations.get(root) ?? 0) + 1;
  refreshGenerations.set(root, generation);
  return generation;
}

export function currentWorkRefreshGeneration(root: HTMLElement): number {
  return refreshGenerations.get(root) ?? 0;
}

function restoreNephillinState(root: HTMLElement) {
  beginWorkRefreshGeneration(root);
  root
    .querySelectorAll<HTMLElement>(NEPHILLIN_TARGET_SELECTOR)
    .forEach((element) => element.removeAttribute("style"));
}

export function isPastViewport(element: HTMLElement): boolean {
  return element.getBoundingClientRect().bottom <= 0;
}

export function scheduleStableRefresh(
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

function figureFromVars(distance: number) {
  return {
    y: distance * 0.72,
    opacity: 0.66,
    clipPath: "inset(0 0 8% 0)",
  };
}

function figureToVars(duration: number) {
  return {
    y: 0,
    opacity: 1,
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
        y: distance * 0.42,
        opacity: NEPHILLIN_WORK_TIMELINES.intro.opacity.marker,
        duration: NEPHILLIN_WORK_TIMELINES.intro.duration.marker,
        ease: MOTION_TOKENS.easing.editorial,
        clearProps: "transform,opacity",
      },
      NEPHILLIN_WORK_TIMELINES.intro.at.marker,
    );
  }
  if (title) {
    timeline.from(
      title,
      {
        y: distance * 0.78,
        duration: NEPHILLIN_WORK_TIMELINES.intro.duration.title,
        ease: MOTION_TOKENS.easing.editorial,
        clearProps: "transform",
      },
      NEPHILLIN_WORK_TIMELINES.intro.at.title,
    );
  }
  if (summary) {
    timeline.from(
      summary,
      {
        y: distance * 0.48,
        opacity: NEPHILLIN_WORK_TIMELINES.intro.opacity.summary,
        duration: NEPHILLIN_WORK_TIMELINES.intro.duration.summary,
        ease: MOTION_TOKENS.easing.editorial,
        clearProps: "transform,opacity",
      },
      NEPHILLIN_WORK_TIMELINES.intro.at.summary,
    );
  }
  if (metadata) {
    timeline.fromTo(
      metadata,
      { "--work-metadata-rule-scale": 0 },
      {
        "--work-metadata-rule-scale": 1,
        duration: NEPHILLIN_WORK_TIMELINES.intro.duration.rule,
        ease: MOTION_TOKENS.easing.line,
        clearProps: "--work-metadata-rule-scale",
      },
      NEPHILLIN_WORK_TIMELINES.intro.at.rule,
    );
    timeline.from(
      metadataItems,
      {
        y: distance * 0.3,
        opacity: NEPHILLIN_WORK_TIMELINES.intro.opacity.metadata,
        duration: NEPHILLIN_WORK_TIMELINES.intro.duration.metadata,
        ease: MOTION_TOKENS.easing.editorial,
        stagger: 0.055,
        clearProps: "transform,opacity",
      },
      NEPHILLIN_WORK_TIMELINES.intro.at.metadata,
    );
  }

  if (entryMode === "direct" && leadPicture) {
    timeline.fromTo(
      leadPicture,
      {
        opacity: NEPHILLIN_WORK_TIMELINES.intro.opacity.lead,
        scale: 1.025,
        clipPath: "inset(0 0 7% 0)",
      },
      {
        opacity: 1,
        scale: 1,
        clipPath: MOTION_TOKENS.image.finalClip,
        duration: NEPHILLIN_WORK_TIMELINES.intro.duration.lead,
        ease: MOTION_TOKENS.easing.image,
        clearProps: "opacity,transform,clipPath",
      },
      NEPHILLIN_WORK_TIMELINES.intro.at.lead,
    );
  }

  return timeline;
}

function pairTimeline(
  gsap: GsapInstance,
  ScrollTrigger: ScrollTriggerInstance,
  figures: HTMLElement[],
  distance: number,
  duration: number,
  stagger: number,
): void {
  const trigger = figures[0]?.parentElement;
  if (!trigger || isPastViewport(trigger)) return;

  ScrollTrigger.create({
    trigger,
    start: NEPHILLIN_WORK_TIMELINES.trigger.group,
    once: true,
    onEnter: () => {
      gsap
        .timeline({ defaults: { overwrite: "auto" } })
        .fromTo(figures, figureFromVars(distance), {
          ...figureToVars(duration),
          stagger,
        });
    },
  });
}

function animateMobileFigures(
  gsap: GsapInstance,
  ScrollTrigger: ScrollTriggerInstance,
  figures: HTMLElement[],
  distance: number,
) {
  for (const figure of figures) {
    if (isPastViewport(figure)) continue;
    ScrollTrigger.create({
      trigger: figure,
      start: NEPHILLIN_WORK_TIMELINES.trigger.mobileFigure,
      once: true,
      onEnter: () => {
        gsap.fromTo(figure, figureFromVars(distance * 0.72), {
          ...figureToVars(NEPHILLIN_WORK_TIMELINES.pair.duration.compact),
        });
      },
    });
  }
}

function animateDesktopGallery(
  root: HTMLElement,
  gsap: GsapInstance,
  ScrollTrigger: ScrollTriggerInstance,
  distance: number,
) {
  const groups = Array.from(
    root.querySelectorAll<HTMLElement>("[data-work-gallery] > *"),
  );
  const openingPair = Array.from(
    groups[0]?.querySelectorAll<HTMLElement>("[data-work-figure]") ?? [],
  );
  const mosaic = Array.from(
    groups[1]?.querySelectorAll<HTMLElement>("[data-work-figure]") ?? [],
  );
  const closingPair = Array.from(
    groups[2]?.querySelectorAll<HTMLElement>("[data-work-figure]") ?? [],
  );

  pairTimeline(
    gsap,
    ScrollTrigger,
    openingPair,
    distance,
    NEPHILLIN_WORK_TIMELINES.pair.duration.regular,
    NEPHILLIN_WORK_TIMELINES.pair.stagger,
  );

  const [first, secondary, dominant] = mosaic;
  const mosaicTrigger = first?.parentElement;
  if (first && dominant && mosaicTrigger && !isPastViewport(mosaicTrigger)) {
    ScrollTrigger.create({
      trigger: mosaicTrigger,
      start: NEPHILLIN_WORK_TIMELINES.trigger.group,
      once: true,
      onEnter: () => {
        const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });
        timeline.fromTo(
          first,
          figureFromVars(distance * 0.62),
          figureToVars(NEPHILLIN_WORK_TIMELINES.mosaic.duration.first),
          NEPHILLIN_WORK_TIMELINES.mosaic.at.first,
        );
        timeline.fromTo(
          dominant,
          figureFromVars(distance * 0.78),
          figureToVars(NEPHILLIN_WORK_TIMELINES.mosaic.duration.dominant),
          NEPHILLIN_WORK_TIMELINES.mosaic.at.dominant,
        );
      },
    });
  }
  if (secondary && !isPastViewport(secondary)) {
    ScrollTrigger.create({
      trigger: secondary,
      start: NEPHILLIN_WORK_TIMELINES.trigger.mosaicSecondary,
      once: true,
      onEnter: () => {
        gsap.fromTo(secondary, figureFromVars(distance * 0.56), {
          ...figureToVars(NEPHILLIN_WORK_TIMELINES.mosaic.duration.secondary),
        });
      },
    });
  }

  pairTimeline(
    gsap,
    ScrollTrigger,
    closingPair,
    distance * 0.72,
    NEPHILLIN_WORK_TIMELINES.closing.duration.regular,
    NEPHILLIN_WORK_TIMELINES.closing.stagger,
  );
}

export function animateWorkEnding(
  root: HTMLElement,
  gsap: GsapInstance,
  ScrollTrigger: ScrollTriggerInstance,
  distance: number,
) {
  const credit = root.querySelector<HTMLElement>("[data-work-credit]");
  const credits = credit?.querySelector<HTMLElement>(".credits");
  const creditCopy = credit?.querySelector<HTMLElement>(".credits__item");
  if (credit && credits && !isPastViewport(credit)) {
    ScrollTrigger.create({
      trigger: credit,
      start: NEPHILLIN_WORK_TIMELINES.trigger.credit,
      once: true,
      onEnter: () => {
        const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });
        timeline.fromTo(
          credits,
          { "--work-credit-rule-scale": 0 },
          {
            "--work-credit-rule-scale": 1,
            duration: NEPHILLIN_WORK_TIMELINES.ending.creditDuration,
            ease: MOTION_TOKENS.easing.line,
            clearProps: "--work-credit-rule-scale",
          },
        );
        if (creditCopy) {
          timeline.from(
            creditCopy,
            {
              y: distance * 0.28,
              opacity: 0.8,
              duration: 0.48,
              ease: MOTION_TOKENS.easing.editorial,
              clearProps: "transform,opacity",
            },
            0.12,
          );
        }
      },
    });
  }

  const continuity = root.querySelector<HTMLElement>("[data-work-continuity]");
  const continuityLinks =
    continuity?.querySelectorAll<HTMLElement>(".work-continuity__link") ?? [];
  if (continuity && !isPastViewport(continuity)) {
    ScrollTrigger.create({
      trigger: continuity,
      start: NEPHILLIN_WORK_TIMELINES.trigger.continuity,
      once: true,
      onEnter: () => {
        const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });
        timeline.fromTo(
          continuity,
          { "--work-continuity-rule-scale": 0 },
          {
            "--work-continuity-rule-scale": 1,
            duration: NEPHILLIN_WORK_TIMELINES.ending.continuityDuration,
            ease: MOTION_TOKENS.easing.line,
            clearProps: "--work-continuity-rule-scale",
          },
        );
        timeline.from(
          continuityLinks,
          {
            y: distance * 0.24,
            opacity: 0.82,
            duration: 0.46,
            ease: MOTION_TOKENS.easing.editorial,
            clearProps: "transform,opacity",
          },
          0.1,
        );
      },
    });
  }

  const related = root.querySelector<HTMLElement>("[data-work-related]");
  const relatedHeading = related?.querySelector<HTMLElement>(
    ".related-works__heading",
  );
  const relatedItems =
    related?.querySelectorAll<HTMLElement>(".related-works__item") ?? [];
  if (related && !isPastViewport(related)) {
    ScrollTrigger.create({
      trigger: related,
      start: NEPHILLIN_WORK_TIMELINES.trigger.continuity,
      once: true,
      onEnter: () => {
        const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });
        timeline.fromTo(
          related,
          { "--work-related-rule-scale": 0 },
          {
            "--work-related-rule-scale": 1,
            duration: NEPHILLIN_WORK_TIMELINES.ending.continuityDuration,
            ease: MOTION_TOKENS.easing.line,
            clearProps: "--work-related-rule-scale",
          },
        );
        if (relatedHeading) {
          timeline.from(
            relatedHeading,
            {
              y: distance * 0.2,
              opacity: 0.84,
              duration: 0.44,
              ease: MOTION_TOKENS.easing.editorial,
              clearProps: "transform,opacity",
            },
            0.08,
          );
        }
        timeline.from(
          relatedItems,
          {
            y: distance * 0.24,
            opacity: 0.82,
            duration: 0.46,
            ease: MOTION_TOKENS.easing.editorial,
            stagger: 0.06,
            clearProps: "transform,opacity",
          },
          0.12,
        );
      },
    });
  }
}

export function initializeNephillinWorkMotion(
  root: HTMLElement,
  documentRoot: Document = document,
) {
  const entryMode = resolveCurrentWorkEntryMode(documentRoot);

  if (entryMode === "restored" || prefersReducedMotion()) {
    root.dataset.workMotionPresented = "true";
  }

  const cleanup = initializeMotion({
    root,
    restoreFinalState: () => restoreNephillinState(root),
    setup: ({ engine, compact, distance }) => {
      if (root.dataset.workMotionPresented === "true") return;

      const { gsap, ScrollTrigger } = engine;
      const generation = currentWorkRefreshGeneration(root);
      const figures = Array.from(
        root.querySelectorAll<HTMLElement>(
          "[data-work-gallery] [data-work-figure]",
        ),
      );

      root.dataset.workMotionPresented = "true";
      root.dataset.workEntryMode = entryMode;

      animateIntro(root, gsap, distance, entryMode);
      if (compact) {
        animateMobileFigures(gsap, ScrollTrigger, figures, distance);
      } else {
        animateDesktopGallery(root, gsap, ScrollTrigger, distance);
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
