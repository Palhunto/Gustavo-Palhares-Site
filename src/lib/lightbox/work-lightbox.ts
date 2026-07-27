import { WORK_LIGHTBOX_TIMELINE } from "../motion/config.ts";
import { getMotionEngine } from "../motion/gsap.ts";
import { prefersReducedMotion } from "../motion/preferences.ts";

interface LightboxActivation {
  altKey: boolean;
  button: number;
  ctrlKey: boolean;
  defaultPrevented: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

interface ScrollLockSnapshot {
  bodyStyle: string | null;
  hadRootClass: boolean;
  scrollX: number;
  scrollY: number;
}

const LINK_SELECTOR = "[data-work-lightbox-link]";
const activeLightboxes = new WeakMap<HTMLElement, () => void>();

export function isLightboxActivationEligible(
  activation: LightboxActivation,
): boolean {
  return (
    !activation.defaultPrevented &&
    activation.button === 0 &&
    !activation.altKey &&
    !activation.ctrlKey &&
    !activation.metaKey &&
    !activation.shiftKey
  );
}

export function lightboxNavigationState(
  index: number,
  total: number,
): { canGoPrevious: boolean; canGoNext: boolean } {
  return {
    canGoPrevious: index > 0,
    canGoNext: index >= 0 && index < total - 1,
  };
}

function restoreStyleAttribute(element: HTMLElement, value: string | null) {
  if (value === null) {
    element.removeAttribute("style");
    return;
  }
  element.setAttribute("style", value);
}

export function initializeWorkLightbox(
  root: HTMLElement,
  dialog: HTMLDialogElement,
): () => void {
  activeLightboxes.get(root)?.();

  const links = Array.from(
    root.querySelectorAll<HTMLAnchorElement>(LINK_SELECTOR),
  );
  const image = dialog.querySelector<HTMLImageElement>(
    "[data-work-lightbox-image]",
  );
  const current = dialog.querySelector<HTMLElement>(
    "[data-work-lightbox-current]",
  );
  const total = dialog.querySelector<HTMLElement>("[data-work-lightbox-total]");
  const caption = dialog.querySelector<HTMLElement>(
    "[data-work-lightbox-caption]",
  );
  const credit = dialog.querySelector<HTMLElement>(
    "[data-work-lightbox-credit]",
  );
  const previous = dialog.querySelector<HTMLButtonElement>(
    "[data-work-lightbox-previous]",
  );
  const next = dialog.querySelector<HTMLButtonElement>(
    "[data-work-lightbox-next]",
  );
  const close = dialog.querySelector<HTMLButtonElement>(
    "[data-work-lightbox-close]",
  );
  const stage = dialog.querySelector<HTMLElement>(".work-lightbox__stage");
  const chrome = Array.from(
    dialog.querySelectorAll<HTMLElement>("[data-work-lightbox-chrome]"),
  );

  if (
    links.length === 0 ||
    !image ||
    !current ||
    !total ||
    !caption ||
    !credit ||
    !previous ||
    !next ||
    !close ||
    !stage
  ) {
    return () => undefined;
  }

  let disposed = false;
  let closing = false;
  let currentIndex = -1;
  let renderGeneration = 0;
  let opener: HTMLAnchorElement | undefined;
  let scrollLock: ScrollLockSnapshot | undefined;
  let preloads: HTMLImageElement[] = [];

  const clearPreloads = () => {
    for (const preload of preloads) preload.removeAttribute("src");
    preloads = [];
  };

  const preloadAdjacent = () => {
    clearPreloads();
    const adjacent = [currentIndex - 1, currentIndex + 1].filter(
      (index) => index >= 0 && index < links.length,
    );
    preloads = adjacent.map((index) => {
      const preload = new Image();
      preload.decoding = "async";
      preload.src = links[index].href;
      return preload;
    });
  };

  const lockBackground = () => {
    if (scrollLock) return;
    const body = document.body;
    const rootElement = document.documentElement;
    scrollLock = {
      bodyStyle: body.getAttribute("style"),
      hadRootClass: rootElement.classList.contains("work-lightbox-open"),
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };
    rootElement.classList.add("work-lightbox-open");
    body.style.position = "fixed";
    body.style.insetInline = "0";
    body.style.top = `-${scrollLock.scrollY}px`;
    body.style.inlineSize = "100%";
    body.style.overflow = "hidden";
  };

  const unlockBackground = () => {
    if (!scrollLock) return;
    const snapshot = scrollLock;
    scrollLock = undefined;
    restoreStyleAttribute(document.body, snapshot.bodyStyle);
    if (!snapshot.hadRootClass) {
      document.documentElement.classList.remove("work-lightbox-open");
    }
    window.scrollTo(snapshot.scrollX, snapshot.scrollY);
  };

  const updateControls = () => {
    const state = lightboxNavigationState(currentIndex, links.length);
    previous.disabled = !state.canGoPrevious;
    next.disabled = !state.canGoNext;
    current.textContent =
      links[currentIndex]?.dataset.lightboxNumber ??
      String(currentIndex + 1).padStart(2, "0");
    total.textContent = String(links.length).padStart(2, "0");
  };

  const applyLinkContent = (link: HTMLAnchorElement) => {
    const sourceImage = link.querySelector<HTMLImageElement>("img");
    const nextCaption = link.dataset.lightboxCaption?.trim() ?? "";
    const nextCredit = link.dataset.lightboxCredit?.trim() ?? "";
    const width = link.dataset.lightboxWidth;
    const height = link.dataset.lightboxHeight;

    image.alt = link.dataset.lightboxAlt ?? sourceImage?.alt ?? "";
    if (width) image.setAttribute("width", width);
    if (height) image.setAttribute("height", height);
    image.src = link.href;

    caption.textContent = nextCaption;
    caption.hidden = nextCaption.length === 0;
    credit.textContent = nextCredit;
    credit.hidden = nextCredit.length === 0;
  };

  const animateSwapIn = async (generation: number) => {
    try {
      await image.decode();
    } catch {
      // A imagem ainda permanece disponível pelo comportamento nativo do img.
    }
    if (disposed || generation !== renderGeneration || !dialog.open) return;

    if (prefersReducedMotion()) {
      image.removeAttribute("style");
      return;
    }

    const { gsap } = getMotionEngine();
    gsap.fromTo(
      image,
      {
        autoAlpha: 0,
        scale: WORK_LIGHTBOX_TIMELINE.scale.swap,
      },
      {
        autoAlpha: 1,
        duration: WORK_LIGHTBOX_TIMELINE.duration.swapIn,
        ease: "power2.out",
        scale: 1,
        clearProps: "opacity,transform,visibility",
      },
    );
  };

  const showIndex = (index: number, initial = false) => {
    if (index < 0 || index >= links.length || index === currentIndex) return;
    currentIndex = index;
    renderGeneration += 1;
    const generation = renderGeneration;
    const link = links[index];
    updateControls();

    if (initial) {
      applyLinkContent(link);
      image.removeAttribute("style");
      preloadAdjacent();
      return;
    }

    if (prefersReducedMotion()) {
      applyLinkContent(link);
      image.removeAttribute("style");
      preloadAdjacent();
      return;
    }

    const { gsap } = getMotionEngine();
    gsap.killTweensOf(image);
    gsap.to(image, {
      autoAlpha: 0,
      duration: WORK_LIGHTBOX_TIMELINE.duration.swapOut,
      ease: "power1.in",
      scale: WORK_LIGHTBOX_TIMELINE.scale.swap,
      onComplete: () => {
        if (disposed || generation !== renderGeneration) return;
        applyLinkContent(link);
        void animateSwapIn(generation);
        preloadAdjacent();
      },
    });
  };

  const finishClose = (restoreFocus: boolean) => {
    if (dialog.open) dialog.close();
    closing = false;
    renderGeneration += 1;
    clearPreloads();
    image.removeAttribute("src");
    image.removeAttribute("style");
    unlockBackground();
    if (restoreFocus && opener?.isConnected) opener.focus();
    opener = undefined;
    currentIndex = -1;
  };

  const requestClose = (restoreFocus = true) => {
    if (!dialog.open || closing) return;
    closing = true;

    if (prefersReducedMotion()) {
      finishClose(restoreFocus);
      return;
    }

    const { gsap } = getMotionEngine();
    gsap.killTweensOf([dialog, image, ...chrome]);
    gsap.to(dialog, {
      autoAlpha: 0,
      duration: WORK_LIGHTBOX_TIMELINE.duration.exit,
      ease: "power1.in",
      onComplete: () => {
        dialog.removeAttribute("style");
        finishClose(restoreFocus);
      },
    });
  };

  const openAt = (index: number, link: HTMLAnchorElement) => {
    if (disposed || dialog.open) return;
    opener = link;
    closing = false;
    lockBackground();
    showIndex(index, true);
    dialog.showModal();
    close.focus();

    if (prefersReducedMotion()) {
      dialog.removeAttribute("style");
      image.removeAttribute("style");
      for (const element of chrome) element.removeAttribute("style");
      return;
    }

    const { gsap } = getMotionEngine();
    const timeline = gsap.timeline();
    timeline.fromTo(
      dialog,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: WORK_LIGHTBOX_TIMELINE.duration.backdropIn,
        ease: "power1.out",
      },
      0,
    );
    timeline.fromTo(
      image,
      {
        autoAlpha: 0,
        scale: WORK_LIGHTBOX_TIMELINE.scale.imageIn,
      },
      {
        autoAlpha: 1,
        duration: WORK_LIGHTBOX_TIMELINE.duration.imageIn,
        ease: "power2.out",
        scale: 1,
        clearProps: "opacity,transform,visibility",
      },
      0.03,
    );
    timeline.fromTo(
      chrome,
      { autoAlpha: 0, y: 6 },
      {
        autoAlpha: 1,
        duration: WORK_LIGHTBOX_TIMELINE.duration.controlsIn,
        ease: "power2.out",
        stagger: 0.035,
        y: 0,
        clearProps: "opacity,transform,visibility",
      },
      0.11,
    );
  };

  const onRootClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>(LINK_SELECTOR);
    if (!link || !root.contains(link) || !isLightboxActivationEligible(event)) {
      return;
    }
    const index = links.indexOf(link);
    if (index < 0) return;
    event.preventDefault();
    openAt(index, link);
  };

  const onDialogClick = (event: MouseEvent) => {
    if (event.target === dialog || event.target === stage) requestClose();
  };

  const onCancel = (event: Event) => {
    event.preventDefault();
    requestClose();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showIndex(currentIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showIndex(currentIndex + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      showIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      showIndex(links.length - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      requestClose();
    }
  };

  const onPrevious = () => showIndex(currentIndex - 1);
  const onNext = () => showIndex(currentIndex + 1);
  const onClose = () => requestClose();

  root.addEventListener("click", onRootClick);
  dialog.addEventListener("click", onDialogClick);
  dialog.addEventListener("cancel", onCancel);
  dialog.addEventListener("keydown", onKeyDown);
  previous.addEventListener("click", onPrevious);
  next.addEventListener("click", onNext);
  close.addEventListener("click", onClose);
  root.dataset.workLightboxState = "ready";

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    root.removeEventListener("click", onRootClick);
    dialog.removeEventListener("click", onDialogClick);
    dialog.removeEventListener("cancel", onCancel);
    dialog.removeEventListener("keydown", onKeyDown);
    previous.removeEventListener("click", onPrevious);
    next.removeEventListener("click", onNext);
    close.removeEventListener("click", onClose);
    root.removeAttribute("data-work-lightbox-state");
    renderGeneration += 1;
    if (!prefersReducedMotion()) {
      const { gsap } = getMotionEngine();
      gsap.killTweensOf([dialog, image, ...chrome]);
    }
    finishClose(false);
    dialog.removeAttribute("style");
    for (const element of chrome) element.removeAttribute("style");
    activeLightboxes.delete(root);
  };

  activeLightboxes.set(root, cleanup);
  return cleanup;
}
