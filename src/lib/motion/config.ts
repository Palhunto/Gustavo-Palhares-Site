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

export const HOME_COVER_TIMELINE = {
  at: {
    identification: 0,
    statusRule: 0.04,
    image: 0.1,
    headline: 0.18,
    support: 0.76,
    rail: 0.82,
    scroll: 1.16,
  },
  duration: {
    identification: 0.38,
    statusRule: 0.52,
    image: 1.02,
    titleRule: 0.44,
    support: 0.45,
    rail: 0.42,
    scroll: 0.28,
  },
  offset: {
    titleRule: 0.28,
  },
  stagger: {
    support: 0.06,
    rail: 0.045,
  },
  opacity: {
    auxiliary: 0.68,
    scroll: 0.76,
  },
  distanceFactor: {
    identification: 0.32,
    auxiliary: 0.42,
    scroll: 0.24,
  },
  totalDuration: 1.44,
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
