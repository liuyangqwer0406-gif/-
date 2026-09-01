"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SYNTHESIS_NAVIGATION_START,
  SYNTHESIS_ROUTE_READY,
  type SynthesisNavigationDetail,
  type SynthesisRouteReadyDetail,
  type SynthesisTransitionCover,
} from "./route-events";
import { VgpuSignalField } from "@/components/vgpu/vgpu-signal-field";
import { SylvaLivingWorldScene } from "./sylva-living-world-scene";
import { TransitionLink } from "./transition-link";
import { InstrumentCursor } from "./instrument-cursor";
import { SmoothWheelScroll } from "./smooth-wheel-scroll";

type RoutePhase = "idle" | "leaving" | "loading" | "entering";

const ROUTE_ENTER_DURATION = 520;
const ROUTE_BUFFER_DELAY = 2400;
const ROUTE_RECOVERY_TIMEOUT = 8000;

const LOADER_PHASES = [
  { id: "01", primary: "INITIALIZING", secondary: "SCENE", cn: "初始化场景", status: "CREATING RENDER CONTEXT" },
  { id: "02", primary: "RESOLVING", secondary: "MATERIALS", cn: "解析材质与图像", status: "RESOLVING MATERIALS / IMAGES" },
  { id: "03", primary: "BINDING", secondary: "INPUT", cn: "绑定交互输入", status: "BINDING POINTER / TOUCH INPUT" },
  { id: "04", primary: "VIEW", secondary: "READY", cn: "视图准备完成", status: "3D SCENE / PORTFOLIO INDEX" },
] as const;

const ROUTE_FIELD_SETTINGS = {
  speed: 0.62,
  intensity: 0.78,
  grain: 0.018,
  pointerStrength: 0.94,
  density: 0.58,
} as const;

const ignoreRouteFieldStats = () => undefined;
const ignoreRouteFieldStatus = () => undefined;

export function SynthesisShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/synthesis";
  const [loaded, setLoaded] = useState(false);
  const [loaderPhase, setLoaderPhase] = useState(0);
  const [routePhase, setRoutePhase] = useState<RoutePhase>("idle");
  const [bufferVisible, setBufferVisible] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState("NEXT VIEW");
  const [handoffCover, setHandoffCover] = useState<SynthesisTransitionCover | null>(null);
  const [routeFieldMounted, setRouteFieldMounted] = useState(false);
  const [routeFieldActive, setRouteFieldActive] = useState(false);
  const [routeFieldOrigin, setRouteFieldOrigin] = useState<readonly [number, number]>([0.5, 0.5]);
  const [routeFieldPulse, setRouteFieldPulse] = useState(0);
  const [homeSceneActive, setHomeSceneActive] = useState(isHome);
  const primaryNav = useRef<HTMLElement>(null);
  const handoffNode = useRef<HTMLDivElement>(null);
  const handoffSource = useRef<SynthesisTransitionCover | null>(null);
  const handoffAnimation = useRef<Animation | null>(null);
  const pathnameRef = useRef(pathname);
  const previousPathname = useRef(pathname);
  const phaseRef = useRef<RoutePhase>("idle");
  const targetPathname = useRef<string | null>(null);
  const readyPathname = useRef<string | null>(null);
  const bufferTimer = useRef(0);
  const recoveryTimer = useRef(0);
  const enterTimer = useRef(0);
  const visibleLoaderPhase = loaded ? LOADER_PHASES.length - 1 : loaderPhase;
  const loaderStage = LOADER_PHASES[visibleLoaderPhase];

  const applyRoutePhase = useCallback((next: RoutePhase) => {
    phaseRef.current = next;
    setRoutePhase(next);
    const root = document.documentElement;
    root.dataset.routeState = next;
    root.classList.toggle("is-route-leaving", next === "leaving" || next === "loading");
    root.classList.toggle("is-route-loading", next === "loading");
    root.classList.toggle("is-route-entering", next === "entering");
  }, []);

  const finishRouteTransition = useCallback(() => {
    window.clearTimeout(bufferTimer.current);
    window.clearTimeout(recoveryTimer.current);
    window.clearTimeout(enterTimer.current);
    targetPathname.current = null;
    applyRoutePhase("entering");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const source = handoffSource.current;
    const node = handoffNode.current;
    const target = document.querySelector<HTMLElement>("[data-transition-cover]");
    if (!reduced && source && node && target) {
      const rect = target.getBoundingClientRect();
      const scaleX = rect.width / source.width;
      const scaleY = rect.height / source.height;
      handoffAnimation.current?.cancel();
      handoffAnimation.current = node.animate([
        {
          opacity: 1,
          transform: `translate3d(${source.left}px, ${source.top}px, 0) scale(1.015)`,
        },
        {
          opacity: 1,
          offset: 0.76,
          transform: `translate3d(${rect.left}px, ${rect.top}px, 0) scale(${scaleX}, ${scaleY})`,
        },
        {
          opacity: 0,
          transform: `translate3d(${rect.left}px, ${rect.top}px, 0) scale(${scaleX}, ${scaleY})`,
        },
      ], {
        duration: ROUTE_ENTER_DURATION,
        easing: "cubic-bezier(0.77, 0, 0.175, 1)",
        fill: "forwards",
      });
    }

    enterTimer.current = window.setTimeout(() => {
      setBufferVisible(false);
      setHandoffCover(null);
      setRouteFieldActive(false);
      handoffSource.current = null;
      handoffAnimation.current = null;
      applyRoutePhase("idle");
    }, reduced ? 140 : ROUTE_ENTER_DURATION);
  }, [applyRoutePhase]);

  useEffect(() => {
    const fallback = window.setTimeout(() => setLoaded(true), 2600);
    return () => window.clearTimeout(fallback);
  }, []);

  useEffect(() => {
    if (!loaded || routeFieldMounted || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const mount = () => setRouteFieldMounted(true);
    if ("requestIdleCallback" in window) {
      const idle = window.requestIdleCallback(mount, { timeout: 1800 });
      return () => window.cancelIdleCallback(idle);
    }
    const timer = setTimeout(mount, 500);
    return () => clearTimeout(timer);
  }, [loaded, routeFieldMounted]);

  useEffect(() => {
    if (!isHome) return;

    const hero = document.querySelector(".synthesis-hero");
    if (!hero || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      setHomeSceneActive(entry?.isIntersecting ?? true);
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [isHome]);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setLoaderPhase(1), 360),
      window.setTimeout(() => setLoaderPhase(2), 920),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    const onNavigationStart = (event: Event) => {
      const detail = (event as CustomEvent<SynthesisNavigationDetail>).detail;
      targetPathname.current = detail.pathname;
      readyPathname.current = null;
      setTransitionLabel(detail.label);
      handoffSource.current = detail.cover ?? null;
      setHandoffCover(detail.cover ?? null);
      const useRouteField = !detail.reducedMotion && Boolean(detail.origin);
      setRouteFieldActive(useRouteField);
      if (useRouteField) {
        setRouteFieldMounted(true);
        setRouteFieldOrigin([detail.origin?.x ?? 0.5, detail.origin?.y ?? 0.5]);
        setRouteFieldPulse((current) => current + 1);
      }
      setBufferVisible(false);
      applyRoutePhase("leaving");
      window.clearTimeout(bufferTimer.current);
      window.clearTimeout(recoveryTimer.current);
      window.clearTimeout(enterTimer.current);
      handoffAnimation.current?.cancel();

      bufferTimer.current = window.setTimeout(() => {
        if (phaseRef.current === "leaving" || phaseRef.current === "loading") setBufferVisible(true);
      }, ROUTE_BUFFER_DELAY);
      recoveryTimer.current = window.setTimeout(() => {
        console.warn(`Route transition recovered after readiness timeout: ${detail.href}`);
        setLoaded(true);
        finishRouteTransition();
      }, ROUTE_RECOVERY_TIMEOUT);
    };

    const onRouteReady = (event: Event) => {
      const detail = (event as CustomEvent<SynthesisRouteReadyDetail>).detail;
      readyPathname.current = detail.pathname;
      if (detail.pathname !== pathnameRef.current) return;
      setLoaded(true);
      if (phaseRef.current === "loading") finishRouteTransition();
    };

    window.addEventListener(SYNTHESIS_NAVIGATION_START, onNavigationStart);
    window.addEventListener(SYNTHESIS_ROUTE_READY, onRouteReady);
    const primedPathname = document.documentElement.dataset.routeReadyPath;
    if (primedPathname === pathnameRef.current) {
      readyPathname.current = primedPathname;
      setLoaded(true);
    }
    return () => {
      window.removeEventListener(SYNTHESIS_NAVIGATION_START, onNavigationStart);
      window.removeEventListener(SYNTHESIS_ROUTE_READY, onRouteReady);
      window.clearTimeout(bufferTimer.current);
      window.clearTimeout(recoveryTimer.current);
      window.clearTimeout(enterTimer.current);
      handoffAnimation.current?.cancel();
      const root = document.documentElement;
      delete root.dataset.routeState;
      root.classList.remove("is-route-leaving", "is-route-loading", "is-route-entering");
    };
  }, [applyRoutePhase, finishRouteTransition]);

  useEffect(() => {
    pathnameRef.current = pathname;
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (document.documentElement.dataset.routeReadyPath === pathname) readyPathname.current = pathname;

    if (!targetPathname.current) {
      setBufferVisible(false);
      applyRoutePhase("idle");
      return;
    }

    applyRoutePhase("loading");
    window.clearTimeout(bufferTimer.current);
    bufferTimer.current = window.setTimeout(() => {
      if (phaseRef.current === "loading") setBufferVisible(true);
    }, 180);

    if (readyPathname.current === pathname) {
      const frame = window.requestAnimationFrame(finishRouteTransition);
      return () => window.cancelAnimationFrame(frame);
    }
  }, [pathname, applyRoutePhase, finishRouteTransition]);

  useEffect(() => {
    const nav = primaryNav.current;
    if (!nav) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const precise = window.matchMedia("(hover: hover) and (pointer: fine)");
    const items = Array.from(nav.querySelectorAll<HTMLElement>("[data-proximity-item]")).map((element) => ({
      element,
      label: element.querySelector<HTMLElement>("[data-proximity-label]"),
      center: 0,
      width: 0,
      value: 0,
      velocity: 0,
      target: 0,
    }));
    let frame = 0;

    const canAnimate = () => precise.matches && !reduced.matches && window.innerWidth > 800;
    const clearTransforms = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      items.forEach((item) => {
        item.value = 0;
        item.velocity = 0;
        item.target = 0;
        if (item.label) item.label.style.transform = "";
      });
    };
    const measure = () => {
      clearTransforms();
      if (!canAnimate()) return;
      items.forEach((item) => {
        const rect = item.element.getBoundingClientRect();
        item.center = rect.left + rect.width * 0.5;
        item.width = rect.width;
      });
    };
    const draw = () => {
      frame = 0;
      if (!canAnimate()) {
        clearTransforms();
        return;
      }

      let moving = false;
      items.forEach((item) => {
        item.velocity += (item.target - item.value) * 0.19;
        item.velocity *= 0.7;
        item.value += item.velocity;
        if (Math.abs(item.target - item.value) < 0.001 && Math.abs(item.velocity) < 0.001) {
          item.value = item.target;
          item.velocity = 0;
        } else {
          moving = true;
        }

        const influence = Math.min(1.08, Math.max(0, item.value));
        const extraWidth = Math.min(6, item.width * 0.08);
        const scaleX = item.width > 0 ? (item.width + extraWidth * influence) / item.width : 1;
        if (item.label) {
          item.label.style.transform = `translateY(${(influence * 3.5).toFixed(2)}px) scaleX(${scaleX.toFixed(4)})`;
        }
      });

      if (moving) frame = window.requestAnimationFrame(draw);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(draw);
    };
    const reset = () => {
      items.forEach((item) => { item.target = 0; });
      schedule();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !canAnimate()) return;
      items.forEach((item) => {
        const proximity = Math.min(1, Math.max(0, 1 - Math.abs(event.clientX - item.center) / 122));
        item.target = proximity * proximity * (3 - 2 * proximity);
      });
      schedule();
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(nav);
    nav.addEventListener("pointermove", onPointerMove);
    nav.addEventListener("pointerleave", reset);
    reduced.addEventListener("change", measure);
    precise.addEventListener("change", measure);
    measure();

    return () => {
      clearTransforms();
      resizeObserver.disconnect();
      nav.removeEventListener("pointermove", onPointerMove);
      nav.removeEventListener("pointerleave", reset);
      reduced.removeEventListener("change", measure);
      precise.removeEventListener("change", measure);
    };
  }, []);

  return (
    <div className={`synthesis-site${loaded ? " is-loaded" : " is-loading"}`} aria-busy={routePhase === "loading"}>
      <InstrumentCursor />
      <SmoothWheelScroll />
      <a className="synthesis-skip" href="#content">Skip to content</a>
      <div className="synthesis-loader" aria-hidden="true">
        <div className="synthesis-loader__meta">
          <span><i />WEN YIFAN / 026</span>
          <span>VISUAL ARCHIVE / 2026</span>
        </div>
        <div className="synthesis-loader__field">
          <div className="synthesis-loader__title" key={loaderStage.id} aria-label={`${loaderStage.primary} ${loaderStage.secondary}`}>
            <span><b>{loaderStage.primary}</b></span>
            <span><b>{loaderStage.secondary}</b><em>{loaderStage.cn}</em></span>
          </div>
          <div className="synthesis-loader__axis">
            <span>{loaderStage.id}</span>
            <div aria-hidden="true">
              {LOADER_PHASES.map((phase, index) => <i key={phase.id} data-complete={index <= visibleLoaderPhase || undefined} />)}
            </div>
            <span>04</span>
          </div>
          <div className="synthesis-loader__status">
            <span>3D SCENE / PORTFOLIO INDEX</span>
            <span>{loaderStage.status}</span>
          </div>
        </div>
        <div className="synthesis-loader__footer">
          <div className="synthesis-loader__rail"><i /><b style={{ transform: `scaleX(${(visibleLoaderPhase + 1) / LOADER_PHASES.length})` }} /></div>
          <div><span>LOADING / PHASE {loaderStage.id}</span><span>30.2741° N / 120.1551° E</span></div>
        </div>
      </div>
      <div
        className="route-transition"
        data-phase={routePhase}
        data-buffer-visible={bufferVisible || undefined}
        data-signal-field={routeFieldActive || undefined}
        aria-hidden={routePhase === "idle"}
      >
        {routeFieldMounted && (
          <div className="route-transition__field" aria-hidden="true">
            <VgpuSignalField
              paused={routePhase === "idle" || !routeFieldActive}
              settings={ROUTE_FIELD_SETTINGS}
              pointer={routeFieldOrigin}
              pulseKey={routeFieldPulse}
              pulseDuration={2.2}
              interactive={false}
              onStats={ignoreRouteFieldStats}
              onStatus={ignoreRouteFieldStatus}
            />
          </div>
        )}
        {handoffCover && (
          <div
            ref={handoffNode}
            className="route-transition__cover"
            style={{
              width: handoffCover.width,
              height: handoffCover.height,
              backgroundImage: `url("${handoffCover.src}")`,
              backgroundPosition: handoffCover.objectPosition,
              backgroundSize: handoffCover.objectFit === "contain" ? "contain" : "cover",
              backgroundColor: handoffCover.backgroundColor,
              transform: `translate3d(${handoffCover.left}px, ${handoffCover.top}px, 0)`,
            }}
            aria-hidden="true"
          >
            <span className="route-transition__corners"><i /><i /><i /><i /></span>
          </div>
        )}
        <div className="route-transition__meta">
          <span>WEN YIFAN / 026</span>
          <span>{routePhase === "loading" ? "ASSEMBLING VIEW" : routePhase === "entering" ? "VIEW READY" : "OPENING"}</span>
        </div>
        <p>{transitionLabel}</p>
        <div className="route-transition__buffer" role="status" aria-live="polite">
          <span>{bufferVisible ? "PREPARING THE NEXT VIEW" : ""}</span>
          <i aria-hidden="true" />
        </div>
        <b className="route-transition__signal" aria-hidden="true" />
      </div>
      <div className={`synthesis-persistent-scene${isHome ? " is-active" : ""}`} aria-hidden="true">
        {isHome ? <SylvaLivingWorldScene variant="black-ember" active={homeSceneActive} /> : null}
      </div>
      <header className="synthesis-header">
        <TransitionLink className="synthesis-brand" href="/synthesis" aria-label="Wen Yifan synthesis portfolio home"><span>WEN</span> YIFAN<sup>026</sup></TransitionLink>
        <nav ref={primaryNav} aria-label="Primary navigation">
          <TransitionLink data-proximity-item href={isHome ? "#work" : "/synthesis#work"}><span data-proximity-label>WORK</span></TransitionLink>
          <TransitionLink data-proximity-item href={isHome ? "#about" : "/synthesis#about"}><span data-proximity-label>ABOUT</span></TransitionLink>
          <a data-proximity-item href="mailto:2742733283@qq.com"><span data-proximity-label>CONTACT</span></a>
        </nav>
      </header>
      <div className="synthesis-progress" aria-hidden="true"><i /></div>
      {children}
    </div>
  );
}
