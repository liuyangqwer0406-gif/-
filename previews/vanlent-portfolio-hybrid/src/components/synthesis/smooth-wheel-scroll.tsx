"use client";

import { useEffect } from "react";

const TRACKPAD_DELTA_LIMIT = 36;
const RAPID_WHEEL_WINDOW = 160;

function normalizeWheelDelta(event: WheelEvent) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

function hasScrollableAncestor(target: EventTarget | null, deltaY: number) {
  if (!(target instanceof Element)) return false;

  for (let node: Element | null = target; node && node !== document.body; node = node.parentElement) {
    const style = window.getComputedStyle(node);
    if (!/(auto|scroll)/.test(style.overflowY) || node.scrollHeight <= node.clientHeight) continue;

    const canScrollDown = deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1;
    const canScrollUp = deltaY < 0 && node.scrollTop > 1;
    if (canScrollDown || canScrollUp) return true;
  }

  return false;
}

function scrollImmediately(top: number) {
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo({ top, behavior: "auto" });
  root.style.scrollBehavior = previousBehavior;
}

export function SmoothWheelScroll() {
  useEffect(() => {
    const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let targetY = window.scrollY;
    let settling = false;
    let settleTimer = 0;
    let lastWheelAt = 0;

    const syncTarget = () => {
      if (!settling) targetY = window.scrollY;
    };

    const onWheel = (event: WheelEvent) => {
      const routeState = document.documentElement.dataset.routeState;
      if (
        !precisePointer.matches ||
        reducedMotion.matches ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
        document.body.classList.contains("has-lightbox") ||
        Boolean(routeState && routeState !== "idle")
      ) return;

      const target = event.target;
      if (target instanceof Element && target.closest("iframe, input, textarea, select, [contenteditable='true'], [data-native-scroll]")) return;

      const deltaY = normalizeWheelDelta(event);
      if (Math.abs(deltaY) < TRACKPAD_DELTA_LIMIT || hasScrollableAncestor(target, deltaY)) return;

      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const nextTarget = Math.min(maxScroll, Math.max(0, targetY + deltaY));
      if (Math.abs(nextTarget - window.scrollY) < 1) return;

      event.preventDefault();
      targetY = nextTarget;
      const now = performance.now();
      const rapidInput = now - lastWheelAt < RAPID_WHEEL_WINDOW;
      lastWheelAt = now;
      settling = !rapidInput;
      if (rapidInput) scrollImmediately(targetY);
      else window.scrollTo({ top: targetY, behavior: "smooth" });

      window.clearTimeout(settleTimer);
      if (rapidInput) {
        targetY = window.scrollY;
        return;
      }
      settleTimer = window.setTimeout(() => {
        settling = false;
        targetY = window.scrollY;
      }, 420);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", syncTarget, { passive: true });

    return () => {
      window.clearTimeout(settleTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", syncTarget);
    };
  }, []);

  return null;
}
