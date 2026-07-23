import { responsiveMotionTokens } from "./config.ts";
import { getMotionEngine, type MotionEngine } from "./gsap.ts";
import { observeReducedMotion } from "./preferences.ts";

type Cleanup = () => void;

interface MotionSetupContext {
  engine: MotionEngine;
  root: HTMLElement;
  compact: boolean;
  distance: number;
  stagger: number;
}

interface MotionLifecycleOptions {
  root: HTMLElement;
  setup: (context: MotionSetupContext) => void;
  restoreFinalState: () => void;
}

const activeScopes = new WeakMap<HTMLElement, Cleanup>();

export function initializeMotion({
  root,
  setup,
  restoreFinalState,
}: MotionLifecycleOptions): Cleanup {
  activeScopes.get(root)?.();

  let disposed = false;
  let disposeContext: Cleanup = () => undefined;

  const render = (reduced: boolean) => {
    disposeContext();
    disposeContext = () => undefined;
    restoreFinalState();

    if (disposed || reduced) {
      root.dataset.motionState = "reduced";
      return;
    }

    let context: ReturnType<MotionEngine["gsap"]["context"]> | undefined;

    try {
      const engine = getMotionEngine();
      const responsive = responsiveMotionTokens(window.innerWidth);
      const activeContext = engine.gsap.context(() => undefined, root);
      context = activeContext;
      activeContext.add(() => setup({ engine, root, ...responsive }));
      root.dataset.motionState = "enhanced";
      disposeContext = () => activeContext.revert();
    } catch (error) {
      context?.revert();
      restoreFinalState();
      root.dataset.motionState = "fallback";
      console.error("Falha ao iniciar o movimento progressivo.", error);
    }
  };

  const stopPreferenceObserver = observeReducedMotion(render);

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    stopPreferenceObserver();
    disposeContext();
    restoreFinalState();
    root.removeAttribute("data-motion-state");
    activeScopes.delete(root);
  };

  activeScopes.set(root, cleanup);
  return cleanup;
}
