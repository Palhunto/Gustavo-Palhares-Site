export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type MotionMediaQuery = Pick<
  MediaQueryList,
  "matches" | "addEventListener" | "removeEventListener"
>;

export function reducedMotionQuery(): MotionMediaQuery | undefined {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return undefined;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY);
}

export function prefersReducedMotion(query = reducedMotionQuery()): boolean {
  return query?.matches ?? true;
}

export function observeReducedMotion(
  callback: (reduced: boolean) => void,
  query = reducedMotionQuery(),
): () => void {
  if (!query) {
    callback(true);
    return () => undefined;
  }

  const onChange = () => callback(query.matches);
  query.addEventListener("change", onChange);
  callback(query.matches);

  return () => query.removeEventListener("change", onChange);
}
