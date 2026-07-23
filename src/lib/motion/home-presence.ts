import { HOME_PRESENCE_TIMELINES, MOTION_TOKENS } from "./config.ts";
import { initializeMotion } from "./lifecycle.ts";

const HOME_PRESENCE_TARGET_SELECTOR = [
  "[data-home-presence-heading-copy]",
  "[data-home-presence-heading-rule]",
  "[data-home-presence-heading-note]",
  "[data-home-presence-feature-title]",
  "[data-home-presence-feature-copy]",
  "[data-home-presence-feature-state]",
  "[data-home-presence-feature-cta]",
  "[data-home-presence-rule]",
  "[data-home-presence-item-title]",
  "[data-home-presence-item-copy]",
  "[data-home-presence-item-cta]",
].join(",");

const refreshGenerations = new WeakMap<HTMLElement, number>();

function restoreHomePresenceState(root: HTMLElement) {
  refreshGenerations.set(root, (refreshGenerations.get(root) ?? 0) + 1);
  root
    .querySelectorAll<HTMLElement>(HOME_PRESENCE_TARGET_SELECTOR)
    .forEach((element) => element.removeAttribute("style"));
}

function isPastViewport(element: HTMLElement): boolean {
  return element.getBoundingClientRect().bottom <= 0;
}

function scheduleStableRefresh(
  root: HTMLElement,
  refresh: () => void,
  generation: number,
) {
  const fontReadiness = document.fonts?.ready ?? Promise.resolve();
  void fontReadiness.then(() => {
    if (
      refreshGenerations.get(root) === generation &&
      root.isConnected &&
      root.dataset.motionState === "enhanced"
    ) {
      refresh();
    }
  });
}

function ruleInitialState(rule: HTMLElement) {
  const { width, height } = rule.getBoundingClientRect();
  return height > width
    ? { scaleY: 0, transformOrigin: "top center" }
    : { scaleX: 0, transformOrigin: "left center" };
}

function itemTargets(item: HTMLElement) {
  return {
    title: item.querySelector<HTMLElement>("[data-home-presence-item-title]"),
    support: item.querySelectorAll<HTMLElement>(
      "[data-home-presence-item-copy], [data-home-presence-item-cta]",
    ),
  };
}

export function initializeHomePresenceMotion(root: HTMLElement) {
  return initializeMotion({
    root,
    restoreFinalState: () => restoreHomePresenceState(root),
    setup: ({ engine, compact, distance }) => {
      const { gsap, ScrollTrigger } = engine;
      const generation = refreshGenerations.get(root) ?? 0;
      const heading = root.querySelector<HTMLElement>(
        "[data-home-presence-header]",
      );
      const headingCopy = root.querySelectorAll<HTMLElement>(
        "[data-home-presence-heading-copy]",
      );
      const headingRule = root.querySelector<HTMLElement>(
        "[data-home-presence-heading-rule]",
      );
      const headingNote = root.querySelector<HTMLElement>(
        "[data-home-presence-heading-note]",
      );
      const feature = root.querySelector<HTMLElement>(
        "[data-home-presence-feature]",
      );
      const grid = root.querySelector<HTMLElement>("[data-home-presence-grid]");
      const mainRule = root.querySelector<HTMLElement>(
        '[data-home-presence-rule="main"]',
      );
      const gridVerticalRule = root.querySelector<HTMLElement>(
        '[data-home-presence-rule="grid-vertical"]',
      );
      const gridHorizontalRule = root.querySelector<HTMLElement>(
        '[data-home-presence-rule="grid-horizontal"]',
      );
      const items = Array.from(
        root.querySelectorAll<HTMLElement>("[data-home-presence-item]"),
      );

      if (heading && !isPastViewport(heading)) {
        const timeline = gsap.timeline({
          defaults: { overwrite: "auto" },
          scrollTrigger: {
            trigger: heading,
            start: HOME_PRESENCE_TIMELINES.trigger.heading,
            once: true,
          },
        });

        timeline.from(
          headingCopy,
          {
            y: distance * 0.4,
            opacity: HOME_PRESENCE_TIMELINES.initialOpacity,
            duration: HOME_PRESENCE_TIMELINES.heading.duration.copy,
            ease: MOTION_TOKENS.easing.editorial,
            stagger: HOME_PRESENCE_TIMELINES.heading.stagger,
            clearProps: "transform,opacity",
          },
          HOME_PRESENCE_TIMELINES.heading.at.copy,
        );
        if (headingRule) {
          timeline.from(
            headingRule,
            {
              scaleX: 0,
              duration: HOME_PRESENCE_TIMELINES.heading.duration.rule,
              ease: MOTION_TOKENS.easing.line,
              clearProps: "transform",
            },
            HOME_PRESENCE_TIMELINES.heading.at.rule,
          );
        }
        if (headingNote) {
          timeline.from(
            headingNote,
            {
              y: distance * 0.28,
              opacity: HOME_PRESENCE_TIMELINES.initialOpacity,
              duration: HOME_PRESENCE_TIMELINES.heading.duration.note,
              ease: MOTION_TOKENS.easing.editorial,
              clearProps: "transform,opacity",
            },
            HOME_PRESENCE_TIMELINES.heading.at.note,
          );
        }
      }

      if (feature && !isPastViewport(feature)) {
        const title = feature.querySelector<HTMLElement>(
          "[data-home-presence-feature-title]",
        );
        const support = feature.querySelectorAll<HTMLElement>(
          "[data-home-presence-feature-copy], [data-home-presence-feature-state]",
        );
        const cta = feature.querySelector<HTMLElement>(
          "[data-home-presence-feature-cta]",
        );
        const timeline = gsap.timeline({
          defaults: { overwrite: "auto" },
          scrollTrigger: {
            trigger: feature,
            start: HOME_PRESENCE_TIMELINES.trigger.feature,
            once: true,
          },
        });

        if (title) {
          timeline.from(
            title,
            {
              yPercent: compact ? 52 : 72,
              duration: HOME_PRESENCE_TIMELINES.feature.duration.title,
              ease: MOTION_TOKENS.easing.editorial,
              clearProps: "transform",
            },
            HOME_PRESENCE_TIMELINES.feature.at.title,
          );
        }
        timeline.from(
          support,
          {
            y: distance * 0.34,
            opacity: HOME_PRESENCE_TIMELINES.initialOpacity,
            duration: HOME_PRESENCE_TIMELINES.feature.duration.support,
            ease: MOTION_TOKENS.easing.editorial,
            stagger: HOME_PRESENCE_TIMELINES.feature.supportStagger,
            clearProps: "transform,opacity",
          },
          HOME_PRESENCE_TIMELINES.feature.at.support,
        );
        if (cta) {
          timeline.from(
            cta,
            {
              y: distance * 0.24,
              opacity: HOME_PRESENCE_TIMELINES.initialOpacity,
              duration: HOME_PRESENCE_TIMELINES.feature.duration.cta,
              ease: MOTION_TOKENS.easing.editorial,
              clearProps: "transform,opacity",
            },
            HOME_PRESENCE_TIMELINES.feature.at.cta,
          );
        }
      }

      if (compact) {
        if (mainRule && !isPastViewport(mainRule)) {
          gsap.from(mainRule, {
            ...ruleInitialState(mainRule),
            duration: HOME_PRESENCE_TIMELINES.grid.duration.mainRule,
            ease: MOTION_TOKENS.easing.line,
            clearProps: "transform,transformOrigin",
            scrollTrigger: {
              trigger: mainRule,
              start: HOME_PRESENCE_TIMELINES.trigger.mobileRule,
              once: true,
            },
          });
        }

        items.forEach((item) => {
          if (isPastViewport(item)) return;
          const targets = itemTargets(item);
          const timeline = gsap.timeline({
            defaults: { overwrite: "auto" },
            scrollTrigger: {
              trigger: item,
              start: HOME_PRESENCE_TIMELINES.trigger.mobileItem,
              once: true,
            },
          });

          if (targets.title) {
            timeline.from(
              targets.title,
              {
                y: distance * 0.38,
                opacity: HOME_PRESENCE_TIMELINES.initialOpacity,
                duration: HOME_PRESENCE_TIMELINES.mobileItem.duration.title,
                ease: MOTION_TOKENS.easing.editorial,
                clearProps: "transform,opacity",
              },
              HOME_PRESENCE_TIMELINES.mobileItem.at.title,
            );
          }
          timeline.from(
            targets.support,
            {
              y: distance * 0.28,
              opacity: HOME_PRESENCE_TIMELINES.initialOpacity,
              duration: HOME_PRESENCE_TIMELINES.mobileItem.duration.support,
              ease: MOTION_TOKENS.easing.editorial,
              stagger: HOME_PRESENCE_TIMELINES.mobileItem.supportStagger,
              clearProps: "transform,opacity",
            },
            HOME_PRESENCE_TIMELINES.mobileItem.at.support,
          );
        });
      } else if (grid && !isPastViewport(grid)) {
        const timeline = gsap.timeline({
          defaults: { overwrite: "auto" },
          scrollTrigger: {
            trigger: grid,
            start: HOME_PRESENCE_TIMELINES.trigger.grid,
            once: true,
          },
        });

        if (mainRule) {
          timeline.from(
            mainRule,
            {
              ...ruleInitialState(mainRule),
              duration: HOME_PRESENCE_TIMELINES.grid.duration.mainRule,
              ease: MOTION_TOKENS.easing.line,
              clearProps: "transform,transformOrigin",
            },
            HOME_PRESENCE_TIMELINES.grid.at.mainRule,
          );
        }
        if (gridVerticalRule) {
          timeline.from(
            gridVerticalRule,
            {
              scaleY: 0,
              duration: HOME_PRESENCE_TIMELINES.grid.duration.verticalRule,
              ease: MOTION_TOKENS.easing.line,
              clearProps: "transform",
            },
            HOME_PRESENCE_TIMELINES.grid.at.verticalRule,
          );
        }
        if (gridHorizontalRule) {
          timeline.from(
            gridHorizontalRule,
            {
              scaleX: 0,
              duration: HOME_PRESENCE_TIMELINES.grid.duration.horizontalRule,
              ease: MOTION_TOKENS.easing.line,
              clearProps: "transform",
            },
            HOME_PRESENCE_TIMELINES.grid.at.horizontalRule,
          );
        }

        items.forEach((item, index) => {
          const targets = itemTargets(item);
          const itemStart =
            HOME_PRESENCE_TIMELINES.grid.at.firstItem +
            index * HOME_PRESENCE_TIMELINES.grid.areaStagger;

          if (targets.title) {
            timeline.from(
              targets.title,
              {
                y: distance * 0.32,
                opacity: HOME_PRESENCE_TIMELINES.initialOpacity,
                duration: HOME_PRESENCE_TIMELINES.grid.duration.title,
                ease: MOTION_TOKENS.easing.editorial,
                clearProps: "transform,opacity",
              },
              itemStart,
            );
          }
          timeline.from(
            targets.support,
            {
              y: distance * 0.24,
              opacity: HOME_PRESENCE_TIMELINES.initialOpacity,
              duration: HOME_PRESENCE_TIMELINES.grid.duration.support,
              ease: MOTION_TOKENS.easing.editorial,
              stagger: HOME_PRESENCE_TIMELINES.grid.supportStagger,
              clearProps: "transform,opacity",
            },
            itemStart + HOME_PRESENCE_TIMELINES.grid.supportOffset,
          );
        });
      }

      scheduleStableRefresh(root, () => ScrollTrigger.refresh(), generation);
    },
  });
}
