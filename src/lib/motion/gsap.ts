import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function getMotionEngine() {
  if (typeof window === "undefined") {
    throw new Error("O motor de movimento só pode ser iniciado no navegador.");
  }

  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }

  return { gsap, ScrollTrigger };
}

export type MotionEngine = ReturnType<typeof getMotionEngine>;
