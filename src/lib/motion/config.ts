export const MOTION_NAMES = {
  headline: "headline-lines",
  rule: "rule-growth",
  image: "editorial-image",
  block: "editorial-block",
  index: "active-index",
} as const;

export const MOTION_LIFECYCLE_EVENTS = {
  pageHide: "pagehide",
  astroBeforeSwap: "astro:before-swap",
  astroPageLoad: "astro:page-load",
} as const;

export const MOTION_TOKENS = {
  duration: {
    fast: 0.18,
    editorial: 0.68,
    slow: 1.05,
  },
  headline: {
    duration: 0.84,
    stagger: {
      compact: 0.14,
      regular: 0.15,
    },
    yPercent: {
      compact: 78,
      regular: 104,
    },
  },
  distance: {
    compact: 18,
    regular: 32,
  },
  stagger: {
    compact: 0.055,
    regular: 0.1,
  },
  easing: {
    editorial: "power3.out",
    line: "power1.inOut",
    image: "power2.out",
  },
  image: {
    initialOpacity: 0.58,
    initialScale: 1.035,
    initialClip: "inset(0 0 9% 0)",
    finalClip: "inset(0 0 0% 0)",
  },
  breakpoint: {
    compact: 768,
  },
  scroll: {
    entryStart: "top 78%",
    indexStart: "top 52%",
    indexEnd: "bottom 52%",
  },
} as const;

export function responsiveMotionTokens(viewportWidth: number) {
  const compact = viewportWidth < MOTION_TOKENS.breakpoint.compact;
  return {
    compact,
    distance: compact
      ? MOTION_TOKENS.distance.compact
      : MOTION_TOKENS.distance.regular,
    stagger: compact
      ? MOTION_TOKENS.stagger.compact
      : MOTION_TOKENS.stagger.regular,
  };
}
