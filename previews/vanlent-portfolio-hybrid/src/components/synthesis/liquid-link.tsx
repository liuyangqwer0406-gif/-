"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { TransitionLink } from "./transition-link";

type LiquidLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "pill" | "orb";
  ariaLabel?: string;
};

type ShaderMessage = {
  type: "hover" | "move" | "press" | "cancel" | "activity" | "probe";
  value?: boolean;
  x?: number;
  y?: number;
  pointerId?: number;
  pointerType?: string;
  buttons?: number;
};

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function LiquidLink({
  href,
  children,
  className = "",
  variant = "pill",
  ariaLabel,
}: LiquidLinkProps) {
  const host = useRef<HTMLAnchorElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const hovered = useRef(false);
  const focused = useRef(false);
  const intersects = useRef(true);
  const active = useRef(false);
  const activityTimer = useRef(0);
  const [ready, setReady] = useState(false);

  const send = useCallback((message: ShaderMessage) => {
    frame.current?.contentWindow?.postMessage({ liquidMetalLink: message }, "*");
  }, []);

  const syncActivity = useCallback((deferInactive = false) => {
    window.clearTimeout(activityTimer.current);
    const nextActive = !reducedMotion() && intersects.current && document.visibilityState !== "hidden" && (hovered.current || focused.current);
    const apply = () => {
      active.current = nextActive;
      send({ type: "activity", value: nextActive });
    };
    if (!nextActive && deferInactive) {
      activityTimer.current = window.setTimeout(apply, 320);
    } else {
      apply();
    }
  }, [send]);

  const pointerData = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      buttons: event.buttons,
    };
  };

  useEffect(() => {
    const anchor = host.current;
    if (!anchor) return;

    const observer = new IntersectionObserver(([entry]) => {
      intersects.current = entry.isIntersecting;
      syncActivity();
    }, { rootMargin: "120px" });
    const onVisibilityChange = () => syncActivity();

    observer.observe(anchor);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearTimeout(activityTimer.current);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [syncActivity]);

  useEffect(() => {
    let probes = 0;
    let probeTimer = 0;
    const receiveReady = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      if (event.data?.liquidMetalLink?.type !== "ready") return;
      window.clearInterval(probeTimer);
      setReady(true);
      send({ type: "activity", value: active.current });
    };

    window.addEventListener("message", receiveReady);
    send({ type: "probe" });
    probeTimer = window.setInterval(() => {
      probes += 1;
      send({ type: "probe" });
      if (probes >= 20) window.clearInterval(probeTimer);
    }, 160);
    return () => {
      window.clearInterval(probeTimer);
      window.removeEventListener("message", receiveReady);
    };
  }, [send]);

  const handlePointerEnter = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    hovered.current = event.pointerType === "mouse";
    syncActivity();
    if (!reducedMotion() && event.pointerType === "mouse") {
      send({ type: "hover", value: true, ...pointerData(event) });
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (!reducedMotion() && event.pointerType === "mouse") {
      send({ type: "move", ...pointerData(event) });
    }
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    hovered.current = false;
    if (!reducedMotion() && !focused.current && event.pointerType === "mouse") {
      send({ type: "hover", value: false });
    }
    syncActivity(true);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (reducedMotion()) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    send({ type: "press", value: true, ...pointerData(event) });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (!reducedMotion()) send({ type: "press", value: false, ...pointerData(event) });
  };

  const handlePointerCancel = () => {
    if (!reducedMotion()) {
      send({ type: "cancel" });
      send({ type: "hover", value: false });
    }
  };

  const handleFocus = () => {
    focused.current = true;
    syncActivity();
    if (!reducedMotion()) send({ type: "hover", value: true });
  };

  const handleBlur = () => {
    focused.current = false;
    if (!reducedMotion() && !hovered.current) send({ type: "hover", value: false });
    syncActivity(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (reducedMotion() || event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
    send({ type: "press", value: true });
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (!reducedMotion() && (event.key === "Enter" || event.key === " ")) {
      send({ type: "press", value: false });
    }
  };

  return (
    <TransitionLink
      ref={host}
      className={`liquid-link liquid-link--${variant} ${ready ? "is-shader-ready" : ""} ${className}`}
      href={href}
      aria-label={ariaLabel}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <iframe
        ref={frame}
        className="liquid-link__shader"
        src={`/synthesis/liquid-metal-button.html?v=signal-orange-3${variant === "orb" ? "&shape=orb" : ""}`}
        title=""
        aria-hidden="true"
        tabIndex={-1}
        sandbox="allow-scripts"
        loading="lazy"
        onLoad={() => {
          setReady(true);
          send({ type: "activity", value: active.current });
          if (!reducedMotion() && (hovered.current || focused.current)) {
            send({ type: "hover", value: true });
          }
        }}
      />
      <span className="liquid-link__icon" aria-hidden="true"><i /><i /><i /></span>
      <span className="liquid-link__label">{children}</span>
      <span className="liquid-link__arrow" aria-hidden="true">↗</span>
    </TransitionLink>
  );
}
