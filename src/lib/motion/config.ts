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

export const HOME_WORKS_TIMELINES = {
  trigger: {
    heading: "top 84%",
    work: "top 80%",
    divider: "top 82%",
  },
  heading: {
    at: {
      copy: 0,
      rule: 0.1,
      note: 0.32,
    },
    duration: {
      copy: 0.5,
      rule: 0.68,
      note: 0.42,
    },
    stagger: 0.055,
    totalDuration: 0.78,
  },
  lead: {
    at: {
      image: 0,
      eyebrow: 0.14,
      title: 0.28,
      support: 0.45,
    },
    imageDuration: {
      compact: 0.9,
      regular: 1.05,
    },
    totalDuration: 1.11,
  },
  reverse: {
    at: {
      eyebrow: 0,
      image: 0.08,
      title: 0.22,
      support: 0.42,
    },
    imageDuration: {
      compact: 0.9,
      regular: 1.05,
    },
    initialClip: "inset(0 7% 0 0)",
    initialScale: 1.028,
    totalDuration: 1.13,
  },
  text: {
    duration: 0.52,
    titleDuration: 0.68,
    stagger: 0.07,
    initialOpacity: 0.68,
  },
  dividerDuration: 0.68,
} as const;

export const HOME_PRESENCE_TIMELINES = {
  trigger: {
    heading: "top 84%",
    feature: "top 80%",
    grid: "top 82%",
    mobileRule: "top 90%",
    mobileItem: "top 88%",
  },
  heading: {
    at: {
      copy: 0,
      rule: 0.1,
      note: 0.33,
    },
    duration: {
      copy: 0.5,
      rule: 0.68,
      note: 0.42,
    },
    stagger: 0.055,
    totalDuration: 0.78,
  },
  feature: {
    at: {
      title: 0,
      support: 0.2,
      cta: 0.46,
    },
    duration: {
      title: 0.68,
      support: 0.52,
      cta: 0.48,
    },
    supportStagger: 0.07,
    totalDuration: 0.94,
  },
  grid: {
    at: {
      mainRule: 0,
      verticalRule: 0.08,
      horizontalRule: 0.18,
      firstItem: 0.22,
    },
    duration: {
      mainRule: 0.72,
      verticalRule: 0.72,
      horizontalRule: 0.68,
      title: 0.58,
      support: 0.52,
    },
    areaStagger: 0.11,
    supportOffset: 0.14,
    supportStagger: 0.055,
    totalDuration: 1.24,
  },
  mobileItem: {
    at: {
      title: 0,
      support: 0.14,
    },
    duration: {
      title: 0.5,
      support: 0.46,
    },
    supportStagger: 0.05,
    totalDuration: 0.65,
  },
  initialOpacity: 0.68,
} as const;

export const HOME_INDEX_TIMELINES = {
  trigger: {
    heading: "top 84%",
    list: "top 82%",
    mobileItem: "top 88%",
    footer: "top 94%",
  },
  heading: {
    at: {
      copy: 0,
      rule: 0.1,
      note: 0.34,
    },
    duration: {
      copy: 0.52,
      rule: 0.7,
      note: 0.42,
    },
    stagger: 0.055,
    totalDuration: 0.8,
  },
  list: {
    at: {
      rules: 0,
      firstItem: 0.15,
    },
    duration: {
      rule: 0.72,
      title: 0.56,
      support: 0.5,
    },
    ruleStagger: 0.035,
    areaStagger: 0.1,
    supportOffset: 0.14,
    supportStagger: 0.055,
    totalDuration: 1.19,
  },
  mobileItem: {
    at: {
      rule: 0,
      title: 0.04,
      support: 0.17,
    },
    duration: {
      rule: 0.54,
      title: 0.48,
      support: 0.44,
    },
    supportStagger: 0.045,
    totalDuration: 0.62,
  },
  footer: {
    at: {
      rule: 0,
      groups: 0.12,
    },
    duration: {
      rule: 0.62,
      groups: 0.48,
    },
    groupStagger: 0.08,
    totalDuration: 0.84,
  },
  initialOpacity: 0.7,
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
