(() => {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const baseLerp = 0.1;
  const settleDistance = 0.35;
  const precisionThreshold = 40;
  const lineStep = 16;

  let frame = 0;
  let previousTime = 0;
  let current = window.scrollY;
  let target = window.scrollY;
  let running = false;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const scrollLimit = () => Math.max(0, root.scrollHeight - window.innerHeight);
  const enabled = () => finePointer.matches && !reduceMotion.matches;

  const pageIsLocked = () => {
    const body = document.body;
    if (!body) return false;
    return body.classList.contains("locked")
      || body.classList.contains("menu-open")
      || body.classList.contains("drawer-open")
      || root.classList.contains("intro-pending")
      || root.classList.contains("no-scroll")
      || Boolean(document.querySelector(".lightbox.open, .project-drawer.open"));
  };

  const nestedScrollerCanMove = (origin, delta) => {
    let element = origin instanceof Element ? origin : null;
    while (element && element !== document.body) {
      const style = window.getComputedStyle(element);
      const scrollable = /(auto|scroll)/.test(style.overflowY)
        && element.scrollHeight > element.clientHeight;
      if (scrollable) {
        const canMoveUp = delta < 0 && element.scrollTop > 0;
        const canMoveDown = delta > 0
          && element.scrollTop + element.clientHeight < element.scrollHeight;
        if (canMoveUp || canMoveDown) return true;
      }
      element = element.parentElement;
    }
    return false;
  };

  const stop = (sync = true) => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    running = false;
    previousTime = 0;
    if (sync) current = target = window.scrollY;
    root.dataset.scrollState = "idle";
  };

  const render = (time) => {
    frame = 0;
    if (!running || !enabled() || pageIsLocked() || document.hidden) {
      stop();
      return;
    }

    const elapsed = previousTime ? Math.min(64, time - previousTime) : 16.667;
    previousTime = time;
    const alpha = 1 - Math.pow(1 - baseLerp, elapsed / 16.667);
    current += (target - current) * alpha;

    if (Math.abs(target - current) <= settleDistance) {
      current = target;
      window.scrollTo(0, current);
      stop(false);
      return;
    }

    window.scrollTo(0, current);
    frame = window.requestAnimationFrame(render);
  };

  const wake = () => {
    if (running || !enabled() || pageIsLocked()) return;
    running = true;
    root.dataset.scrollState = "moving";
    frame = window.requestAnimationFrame(render);
  };

  const moveTo = (destination, options = {}) => {
    const nextTarget = clamp(Number(destination) || 0, 0, scrollLimit());
    if (options.immediate || !enabled()) {
      stop(false);
      window.scrollTo(0, nextTarget);
      current = target = window.scrollY;
      return;
    }
    if (pageIsLocked()) return;
    if (!running) current = window.scrollY;
    target = nextTarget;
    wake();
  };

  const onWheel = (event) => {
    if (!enabled() || event.defaultPrevented || event.ctrlKey) return;
    if (pageIsLocked()) {
      if (!nestedScrollerCanMove(event.target, event.deltaY)) event.preventDefault();
      return;
    }
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (event.target instanceof Element
      && event.target.closest("input, textarea, select, [contenteditable='true'], [data-scroll-native], [data-lenis-prevent]")) return;
    if (nestedScrollerCanMove(event.target, event.deltaY)) return;

    const isPrecisionInput = event.deltaMode === WheelEvent.DOM_DELTA_PIXEL
      && Math.abs(event.deltaY) < precisionThreshold;
    if (isPrecisionInput) {
      if (running) stop();
      return;
    }

    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? lineStep
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? window.innerHeight
        : 1;
    event.preventDefault();
    moveTo(target + event.deltaY * unit);
  };

  const onAnchorClick = (event) => {
    if (!enabled() || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;

    const anchor = event.target.closest("a[href*='#']");
    if (!anchor || anchor.hasAttribute("data-scroll-special")) return;
    const url = new URL(anchor.href, window.location.href);
    const sameDocument = url.origin === window.location.origin
      && url.pathname === window.location.pathname
      && url.search === window.location.search;
    if (!sameDocument || !url.hash) return;

    const id = decodeURIComponent(url.hash.slice(1));
    const destination = id ? document.getElementById(id) : root;
    if (!destination) return;

    event.preventDefault();
    const padding = Number.parseFloat(window.getComputedStyle(root).scrollPaddingTop) || 0;
    const destinationY = destination === root
      ? 0
      : destination.getBoundingClientRect().top + window.scrollY - padding;
    moveTo(destinationY);
    window.history.pushState(null, "", url.hash);
  };

  const syncNativeScroll = () => {
    if (running) return;
    current = target = window.scrollY;
  };

  const syncCapability = () => {
    stop();
    root.dataset.scrollEngine = enabled() ? "inertia" : "native";
    root.style.scrollBehavior = enabled() || reduceMotion.matches ? "auto" : "";
  };

  window.__siteScrollTo = moveTo;
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", syncNativeScroll, { passive: true });
  window.addEventListener("resize", stop, { passive: true });
  window.addEventListener("pointerdown", () => stop(), { passive: true });
  window.addEventListener("touchstart", () => stop(), { passive: true });
  window.addEventListener("keydown", () => stop(), { passive: true });
  document.addEventListener("click", onAnchorClick, { capture: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  reduceMotion.addEventListener("change", syncCapability);
  finePointer.addEventListener("change", syncCapability);
  syncCapability();
})();
