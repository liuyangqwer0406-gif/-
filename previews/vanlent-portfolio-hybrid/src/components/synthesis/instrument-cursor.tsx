"use client";

import { useEffect, useRef } from "react";

type CursorMode = "default" | "interactive" | "media" | "mail" | "select" | "native";

function readCursorMode(target: EventTarget | null): { mode: CursorMode; label: string } {
  if (!(target instanceof Element)) return { mode: "default", label: "" };
  if (target.closest(":disabled, [aria-disabled='true']")) return { mode: "native", label: "" };
  if (target.closest("iframe, input, textarea, select, [contenteditable='true'], [data-native-cursor]")) {
    return { mode: "native", label: "" };
  }
  if (target.closest(".case-figure button, [data-lightbox-src], button[data-lightbox]")) {
    return { mode: "media", label: "VIEW" };
  }
  if (target.closest(".synthesis-work__index button")) return { mode: "select", label: "SELECT" };
  if (target.closest("a[href^='mailto:']")) return { mode: "mail", label: "MAIL" };
  if (target.closest("a, button, summary, [role='button']")) return { mode: "interactive", label: "" };
  return { mode: "default", label: "" };
}

export function InstrumentCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const label = labelRef.current;
    if (!cursor || !label) return;

    const root = document.documentElement;
    const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let enabled = precisePointer.matches;
    const pointerOffset = cursor.getBoundingClientRect().width / 2;

    const hide = () => cursor.classList.remove("is-visible", "is-pressed");
    const setMode = (target: EventTarget | null) => {
      const next = readCursorMode(target);
      cursor.dataset.mode = next.mode;
      label.textContent = next.label;
      cursor.classList.toggle("is-interactive", next.mode === "interactive");
      cursor.classList.toggle("is-media", next.mode === "media");
      cursor.classList.toggle("is-mail", next.mode === "mail");
      cursor.classList.toggle("is-select", next.mode === "select");
      cursor.classList.toggle("is-native", next.mode === "native");
      if (next.mode === "native") hide();
    };
    const syncCapability = () => {
      enabled = precisePointer.matches;
      root.classList.toggle("has-syn-instrument-cursor", enabled);
      if (!enabled) hide();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!enabled || event.pointerType !== "mouse") return;
      cursor.style.transform = `translate3d(${event.clientX - pointerOffset}px, ${event.clientY - pointerOffset}px, 0)`;
      setMode(event.target);
      if (cursor.dataset.mode !== "native") cursor.classList.add("is-visible");
    };
    const onPointerDown = (event: PointerEvent) => {
      if (enabled && event.pointerType === "mouse" && event.button === 0 && cursor.dataset.mode !== "native") {
        cursor.classList.add("is-pressed");
      }
    };
    const onPointerUp = () => cursor.classList.remove("is-pressed");
    const onVisibilityChange = () => {
      if (document.hidden) hide();
    };

    syncCapability();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("blur", hide);
    document.addEventListener("mouseleave", hide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    precisePointer.addEventListener("change", syncCapability);

    return () => {
      root.classList.remove("has-syn-instrument-cursor");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("blur", hide);
      document.removeEventListener("mouseleave", hide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      precisePointer.removeEventListener("change", syncCapability);
    };
  }, []);

  return (
    <div ref={cursorRef} className="syn-instrument-cursor" data-mode="default" aria-hidden="true">
      <span className="syn-instrument-cursor__frame" />
      <span className="syn-instrument-cursor__core" />
      <span ref={labelRef} className="syn-instrument-cursor__label" />
    </div>
  );
}
