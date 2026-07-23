import { HOME_INDEX_TIMELINES, MOTION_TOKENS } from "./config.ts";
import { initializeMotion } from "./lifecycle.ts";

type Cleanup = () => void;

const HOME_INDEX_TARGET_SELECTOR = [
  "[data-home-index-heading-copy]",
  "[data-home-index-heading-rule]",
  "[data-home-index-heading-note]",
  "[data-home-index-rule]",
  "[data-home-index-item-title]",
  "[data-home-index-work]",
  "[data-home-index-item-state]",
  "[data-home-index-item-sublink]",
  "[data-home-index-item-action]",
].join(",");

const HOME_FOOTER_TARGET_SELECTOR = [
  "[data-home-footer-rule]",
  "[data-home-footer-group]",
].join(",");

const refreshGenerations = new WeakMap<HTMLElement, number>();

function restoreState(root: HTMLElement, selector: string) {
  refreshGenerations.set(root, (refreshGenerations.get(root) ?? 0) + 1);
  root
    .querySelectorAll<HTMLElement>(selector)
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

function visibleRules(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>("[data-home-index-rule]"),
  ).filter((rule) => getComputedStyle(rule).display !== "none");
}

function ruleInitialState(rule: HTMLElement) {
  const { width, height } = rule.getBoundingClientRect();
  return height > width
    ? { scaleY: 0, transformOrigin: "top center" }
    : { scaleX: 0, transformOrigin: "left center" };
}

function visualOrder(items: HTMLElement[]): HTMLElement[] {
  return items.toSorted((left, right) => {
    const leftRect = left.getBoundingClientRect();
    const rightRect = right.getBoundingClientRect();
    const rowDifference = leftRect.top - rightRect.top;

    return Math.abs(rowDifference) > 2
      ? rowDifference
      : leftRect.left - rightRect.left;
  });
}

function itemTargets(item: HTMLElement) {
  return {
    title: item.querySelector<HTMLElement>("[data-home-index-item-title]"),
    support: item.querySelectorAll<HTMLElement>(
      [
        "[data-home-index-work]",
        "[data-home-index-item-state]",
        "[data-home-index-item-sublink]",
        "[data-home-index-item-action]",
      ].join(","),
    ),
  };
}

function initializeIndexMotion(root: HTMLElement): Cleanup {
  return initializeMotion({
    root,
    restoreFinalState: () => restoreState(root, HOME_INDEX_TARGET_SELECTOR),
    setup: ({ engine, compact, distance }) => {
      const { gsap, ScrollTrigger } = engine;
      const generation = refreshGenerations.get(root) ?? 0;
      const heading = root.querySelector<HTMLElement>(
        "[data-home-index-header]",
      );
      const headingCopy = root.querySelectorAll<HTMLElement>(
        "[data-home-index-heading-copy]",
      );
      const headingRule = root.querySelector<HTMLElement>(
        "[data-home-index-heading-rule]",
      );
      const headingNote = root.querySelector<HTMLElement>(
        "[data-home-index-heading-note]",
      );
      const list = root.querySelector<HTMLElement>("[data-home-index-list]");
      const items = Array.from(
        root.querySelectorAll<HTMLElement>("[data-home-index-item]"),
      );

      if (heading && !isPastViewport(heading)) {
        const timeline = gsap.timeline({
          defaults: { overwrite: "auto" },
          scrollTrigger: {
            trigger: heading,
            start: HOME_INDEX_TIMELINES.trigger.heading,
            once: true,
          },
        });

        timeline.from(
          headingCopy,
          {
            y: distance * 0.4,
            opacity: HOME_INDEX_TIMELINES.initialOpacity,
            duration: HOME_INDEX_TIMELINES.heading.duration.copy,
            ease: MOTION_TOKENS.easing.editorial,
            stagger: HOME_INDEX_TIMELINES.heading.stagger,
            clearProps: "transform,opacity",
          },
          HOME_INDEX_TIMELINES.heading.at.copy,
        );
        if (headingRule) {
          timeline.from(
            headingRule,
            {
              scaleX: 0,
              duration: HOME_INDEX_TIMELINES.heading.duration.rule,
              ease: MOTION_TOKENS.easing.line,
              clearProps: "transform",
            },
            HOME_INDEX_TIMELINES.heading.at.rule,
          );
        }
        if (headingNote) {
          timeline.from(
            headingNote,
            {
              y: distance * 0.28,
              opacity: HOME_INDEX_TIMELINES.initialOpacity,
              duration: HOME_INDEX_TIMELINES.heading.duration.note,
              ease: MOTION_TOKENS.easing.editorial,
              clearProps: "transform,opacity",
            },
            HOME_INDEX_TIMELINES.heading.at.note,
          );
        }
      }

      if (compact) {
        items.forEach((item) => {
          if (isPastViewport(item)) return;
          const rules = visibleRules(item);
          const targets = itemTargets(item);
          const timeline = gsap.timeline({
            defaults: { overwrite: "auto" },
            scrollTrigger: {
              trigger: item,
              start: HOME_INDEX_TIMELINES.trigger.mobileItem,
              once: true,
            },
          });

          rules.forEach((rule) => {
            timeline.from(
              rule,
              {
                ...ruleInitialState(rule),
                duration: HOME_INDEX_TIMELINES.mobileItem.duration.rule,
                ease: MOTION_TOKENS.easing.line,
                clearProps: "transform,transformOrigin",
              },
              HOME_INDEX_TIMELINES.mobileItem.at.rule,
            );
          });
          if (targets.title) {
            timeline.from(
              targets.title,
              {
                y: distance * 0.34,
                opacity: HOME_INDEX_TIMELINES.initialOpacity,
                duration: HOME_INDEX_TIMELINES.mobileItem.duration.title,
                ease: MOTION_TOKENS.easing.editorial,
                clearProps: "transform,opacity",
              },
              HOME_INDEX_TIMELINES.mobileItem.at.title,
            );
          }
          timeline.from(
            targets.support,
            {
              y: distance * 0.24,
              opacity: HOME_INDEX_TIMELINES.initialOpacity,
              duration: HOME_INDEX_TIMELINES.mobileItem.duration.support,
              ease: MOTION_TOKENS.easing.editorial,
              stagger: HOME_INDEX_TIMELINES.mobileItem.supportStagger,
              clearProps: "transform,opacity",
            },
            HOME_INDEX_TIMELINES.mobileItem.at.support,
          );
        });
      } else if (list && !isPastViewport(list)) {
        const orderedItems = visualOrder(items);
        const rules = visibleRules(list);
        const timeline = gsap.timeline({
          defaults: { overwrite: "auto" },
          scrollTrigger: {
            trigger: list,
            start: HOME_INDEX_TIMELINES.trigger.list,
            once: true,
          },
        });

        rules.forEach((rule, index) => {
          timeline.from(
            rule,
            {
              ...ruleInitialState(rule),
              duration: HOME_INDEX_TIMELINES.list.duration.rule,
              ease: MOTION_TOKENS.easing.line,
              clearProps: "transform,transformOrigin",
            },
            HOME_INDEX_TIMELINES.list.at.rules +
              index * HOME_INDEX_TIMELINES.list.ruleStagger,
          );
        });

        orderedItems.forEach((item, index) => {
          const targets = itemTargets(item);
          const itemStart =
            HOME_INDEX_TIMELINES.list.at.firstItem +
            index * HOME_INDEX_TIMELINES.list.areaStagger;

          if (targets.title) {
            timeline.from(
              targets.title,
              {
                y: distance * 0.3,
                opacity: HOME_INDEX_TIMELINES.initialOpacity,
                duration: HOME_INDEX_TIMELINES.list.duration.title,
                ease: MOTION_TOKENS.easing.editorial,
                clearProps: "transform,opacity",
              },
              itemStart,
            );
          }
          timeline.from(
            targets.support,
            {
              y: distance * 0.22,
              opacity: HOME_INDEX_TIMELINES.initialOpacity,
              duration: HOME_INDEX_TIMELINES.list.duration.support,
              ease: MOTION_TOKENS.easing.editorial,
              stagger: HOME_INDEX_TIMELINES.list.supportStagger,
              clearProps: "transform,opacity",
            },
            itemStart + HOME_INDEX_TIMELINES.list.supportOffset,
          );
        });
      }

      scheduleStableRefresh(root, () => ScrollTrigger.refresh(), generation);
    },
  });
}

function initializeFooterMotion(root: HTMLElement): Cleanup {
  return initializeMotion({
    root,
    restoreFinalState: () => restoreState(root, HOME_FOOTER_TARGET_SELECTOR),
    setup: ({ engine, distance }) => {
      const { gsap, ScrollTrigger } = engine;
      const generation = refreshGenerations.get(root) ?? 0;
      const rule = root.querySelector<HTMLElement>("[data-home-footer-rule]");
      const groups = root.querySelectorAll<HTMLElement>(
        "[data-home-footer-group]",
      );

      if (!isPastViewport(root)) {
        const timeline = gsap.timeline({
          defaults: { overwrite: "auto" },
          scrollTrigger: {
            trigger: root,
            start: HOME_INDEX_TIMELINES.trigger.footer,
            once: true,
          },
        });

        if (rule) {
          timeline.from(
            rule,
            {
              scaleX: 0,
              duration: HOME_INDEX_TIMELINES.footer.duration.rule,
              ease: MOTION_TOKENS.easing.line,
              clearProps: "transform",
            },
            HOME_INDEX_TIMELINES.footer.at.rule,
          );
        }
        timeline.from(
          groups,
          {
            y: distance * 0.22,
            opacity: HOME_INDEX_TIMELINES.initialOpacity,
            duration: HOME_INDEX_TIMELINES.footer.duration.groups,
            ease: MOTION_TOKENS.easing.editorial,
            stagger: HOME_INDEX_TIMELINES.footer.groupStagger,
            clearProps: "transform,opacity",
          },
          HOME_INDEX_TIMELINES.footer.at.groups,
        );
      }

      scheduleStableRefresh(root, () => ScrollTrigger.refresh(), generation);
    },
  });
}

export function initializeHomeIndexEndMotion(
  indexRoot: HTMLElement,
  footerRoot?: HTMLElement,
): Cleanup {
  const cleanups = [initializeIndexMotion(indexRoot)];
  if (footerRoot) cleanups.push(initializeFooterMotion(footerRoot));

  return () => {
    cleanups
      .splice(0)
      .reverse()
      .forEach((cleanup) => cleanup());
  };
}
