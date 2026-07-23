export const WORK_COVER_VIEW_TRANSITIONS = {
  "nephillin-uma-cobertura-sem-credencial": "work-nephillin-cover",
  "feira-do-rolo": "work-feira-do-rolo-cover",
} as const;

export type WorkCoverViewTransitionName =
  (typeof WORK_COVER_VIEW_TRANSITIONS)[keyof typeof WORK_COVER_VIEW_TRANSITIONS];

export const WORK_COVER_VIEW_TRANSITION_NAMES = Object.values(
  WORK_COVER_VIEW_TRANSITIONS,
);

export function workCoverViewTransitionName(
  slug: string,
): WorkCoverViewTransitionName | undefined {
  return WORK_COVER_VIEW_TRANSITIONS[
    slug as keyof typeof WORK_COVER_VIEW_TRANSITIONS
  ];
}
