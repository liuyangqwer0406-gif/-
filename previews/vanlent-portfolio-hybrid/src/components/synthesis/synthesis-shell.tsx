"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
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

gsap.registerPlugin(useGSAP);

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
  const isAbout = pathname === "/synthesis/about";
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
  const loaderNode = useRef<HTMLDivElement>(null);
  const loaderIntroTimeline = useRef<gsap.core.Timeline | null>(null);
  const loaderExitTimeline = useRef<gsap.core.Timeline | null>(null);
  const loaderStartedAt = useRef(0);
  const primaryNav = useRef<HTMLElement>(null);
  const routeTransitionNode = useRef<HTMLDivElement>(null);
  const handoffNode = useRef<HTMLDivElement>(null);
  const handoffSource = useRef<SynthesisTransitionCover | null>(null);
  const handoffAnimation = useRef<gsap.core.Timeline | null>(null);
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
  const { contextSafe } = useGSAP({ scope: routeTransitionNode });

  const applyRoutePhase = useCallback((next: RoutePhase) => {
    phaseRef.current = next;
    setRoutePhase(next);
    const root = document.documentElement;
    root.dataset.routeState = next;
    root.classList.toggle("is-route-leaving", next === "leaving" || next === "loading");
    root.classList.toggle("is-route-loading", next === "loading");
    root.classList.toggle("is-route-entering", next === "entering");
  }, []);

  useGSAP(() => {
    const loader = loaderNode.current;
    if (!loader) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const verticalLine = loader.querySelector<HTMLElement>(".synthesis-loader__line--vertical");
    const horizontalLine = loader.querySelector<HTMLElement>(".synthesis-loader__line--horizontal");
    const meta = loader.querySelector<HTMLElement>(".synthesis-loader__meta");
    const axis = loader.querySelector<HTMLElement>(".synthesis-loader__axis");
    const status = loader.querySelector<HTMLElement>(".synthesis-loader__status");
    const footer = loader.querySelector<HTMLElement>(".synthesis-loader__footer");
    const scan = loader.querySelector<HTMLElement>(".synthesis-loader__rail i");
    const beacon = loader.querySelector<HTMLElement>(".synthesis-loader__meta i");
    const chrome = [meta, axis, status, footer].filter((item): item is HTMLElement => Boolean(item));

    loaderStartedAt.current = performance.now();
    gsap.set(loader, { autoAlpha: 1, clipPath: "inset(0 0 0% 0)" });

    if (reduced) {
      gsap.set(chrome, { autoAlpha: 1, y: 0 });
      if (verticalLine) gsap.set(verticalLine, { scaleY: 1 });
      if (horizontalLine) gsap.set(horizontalLine, { scaleX: 1 });
      return;
    }

    gsap.set(chrome, { autoAlpha: 0, y: 10 });
    if (verticalLine) gsap.set(verticalLine, { scaleY: 0, transformOrigin: "top center" });
    if (horizontalLine) gsap.set(horizontalLine, { scaleX: 0, transformOrigin: "left center" });
    if (scan) gsap.set(scan, { xPercent: -120 });

    loaderIntroTimeline.current = gsap.timeline({ defaults: { ease: "power3.out" } });
    if (verticalLine) loaderIntroTimeline.current.to(verticalLine, { scaleY: 1, duration: .72 }, 0);
    if (horizontalLine) loaderIntroTimeline.current.to(horizontalLine, { scaleX: 1, duration: .66 }, .06);
    if (meta) loaderIntroTimeline.current.to(meta, { autoAlpha: 1, y: 0, duration: .42 }, .1);
    loaderIntroTimeline.current
      .to([axis, status, footer].filter(Boolean), { autoAlpha: 1, y: 0, duration: .46, stagger: .055 }, .2)
      .call(() => setLoaderPhase(1), [], .56)
      .call(() => setLoaderPhase(2), [], 1.08);

    if (scan) gsap.to(scan, { xPercent: 520, duration: .9, ease: "none", repeat: -1 });
    if (beacon) gsap.to(beacon, { autoAlpha: .24, scale: .72, duration: .46, ease: "sine.inOut", repeat: -1, yoyo: true });

    return () => {
      loaderIntroTimeline.current?.kill();
      loaderIntroTimeline.current = null;
      gsap.killTweensOf([loader, ...loader.querySelectorAll("*")]);
    };
  }, { scope: loaderNode });

  useGSAP(() => {
    const loader = loaderNode.current;
    if (!loader) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const titleParts = Array.from(loader.querySelectorAll<HTMLElement>(".synthesis-loader__title b"));
    const titleNote = loader.querySelector<HTMLElement>(".synthesis-loader__title em");
    const statusValue = loader.querySelector<HTMLElement>(".synthesis-loader__status span:last-child");
    const progress = loader.querySelector<HTMLElement>(".synthesis-loader__rail b");
    const steps = Array.from(loader.querySelectorAll<HTMLElement>(".synthesis-loader__axis i"));
    const progressValue = (visibleLoaderPhase + 1) / LOADER_PHASES.length;

    if (reduced) {
      gsap.set(titleParts, { autoAlpha: 1, yPercent: 0 });
      if (titleNote) gsap.set(titleNote, { autoAlpha: 1, x: 0 });
      if (statusValue) gsap.set(statusValue, { autoAlpha: 1, x: 0 });
      if (progress) gsap.set(progress, { scaleX: progressValue });
      steps.forEach((step, index) => gsap.set(step, {
        scaleY: index <= visibleLoaderPhase ? 1 : .28,
        backgroundColor: index <= visibleLoaderPhase ? "var(--color-signal)" : "var(--color-line-dark)",
      }));
      return;
    }

    gsap.killTweensOf([...titleParts, titleNote, statusValue, progress, ...steps].filter(Boolean));
    const phaseTimeline = gsap.timeline({ defaults: { ease: "power3.out", overwrite: "auto" } });
    phaseTimeline.fromTo(titleParts,
      { autoAlpha: 0, yPercent: 112, rotate: .7 },
      { autoAlpha: 1, yPercent: 0, rotate: 0, duration: .5, stagger: .055 },
      0,
    );
    if (titleNote) phaseTimeline.fromTo(titleNote, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: .34 }, .16);
    if (statusValue) phaseTimeline.fromTo(statusValue, { autoAlpha: 0, x: 14 }, { autoAlpha: 1, x: 0, duration: .34 }, .12);
    if (progress) phaseTimeline.to(progress, { scaleX: progressValue, duration: .5, ease: "power2.inOut" }, 0);
    steps.forEach((step, index) => phaseTimeline.to(step, {
      scaleY: index <= visibleLoaderPhase ? 1 : .28,
      backgroundColor: index <= visibleLoaderPhase ? "var(--color-signal)" : "var(--color-line-dark)",
      duration: .38,
    }, index * .035));
  }, { scope: loaderNode, dependencies: [visibleLoaderPhase], revertOnUpdate: false });

  useGSAP(() => {
    if (!loaded) return;
    const loader = loaderNode.current;
    if (!loader) return;

    loaderIntroTimeline.current?.kill();
    loaderIntroTimeline.current = null;
    loaderExitTimeline.current?.kill();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(loader, { autoAlpha: 0, visibility: "hidden" });
      return;
    }

    const titleParts = Array.from(loader.querySelectorAll<HTMLElement>(".synthesis-loader__title b"));
    const titleNote = loader.querySelector<HTMLElement>(".synthesis-loader__title em");
    const meta = loader.querySelector<HTMLElement>(".synthesis-loader__meta");
    const status = loader.querySelector<HTMLElement>(".synthesis-loader__status");
    const footer = loader.querySelector<HTMLElement>(".synthesis-loader__footer");
    const progress = loader.querySelector<HTMLElement>(".synthesis-loader__rail b");
    const scan = loader.querySelector<HTMLElement>(".synthesis-loader__rail i");
    const beacon = loader.querySelector<HTMLElement>(".synthesis-loader__meta i");
    const verticalLine = loader.querySelector<HTMLElement>(".synthesis-loader__line--vertical");
    const horizontalLine = loader.querySelector<HTMLElement>(".synthesis-loader__line--horizontal");
    const supportingCopy = [titleNote, meta, status, footer].filter((item): item is HTMLElement => Boolean(item));
    const elapsed = (performance.now() - loaderStartedAt.current) / 1000;
    const hold = Math.max(0, .82 - elapsed);

    gsap.killTweensOf([scan, beacon].filter(Boolean));
    loaderExitTimeline.current = gsap.timeline({ delay: hold, defaults: { overwrite: "auto" } });
    if (progress) loaderExitTimeline.current.to(progress, { scaleX: 1, duration: .22, ease: "power2.inOut" }, 0);
    loaderExitTimeline.current
      .to(titleParts, { autoAlpha: 0, yPercent: -118, duration: .32, stagger: .035, ease: "power3.in" }, .14)
      .to(supportingCopy, { autoAlpha: 0, y: -9, duration: .24, stagger: .025, ease: "power2.in" }, .16);
    if (verticalLine) loaderExitTimeline.current.to(verticalLine, { scaleY: 0, transformOrigin: "bottom center", duration: .34, ease: "power2.inOut" }, .22);
    if (horizontalLine) loaderExitTimeline.current.to(horizontalLine, { scaleX: 0, transformOrigin: "right center", duration: .34, ease: "power2.inOut" }, .22);
    loaderExitTimeline.current
      .to(loader, { clipPath: "inset(0 0 100% 0)", duration: .68, ease: "expo.inOut" }, .34)
      .set(loader, { autoAlpha: 0, visibility: "hidden" });

    return () => {
      loaderExitTimeline.current?.kill();
      loaderExitTimeline.current = null;
    };
  }, { scope: loaderNode, dependencies: [loaded], revertOnUpdate: false });

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
    const finish = () => {
      setBufferVisible(false);
      setHandoffCover(null);
      setRouteFieldActive(false);
      handoffSource.current = null;
      handoffAnimation.current = null;
      applyRoutePhase("idle");
    };

    if (!reduced && source && node && target) {
      const rect = target.getBoundingClientRect();
      const scaleX = rect.width / source.width;
      const scaleY = rect.height / source.height;
      handoffAnimation.current?.kill();
      const playHandoff = contextSafe(() => {
        const transition = routeTransitionNode.current;
        if (!transition) return false;
        const meta = transition.querySelector<HTMLElement>(".route-transition__meta");
        const label = transition.querySelector<HTMLElement>(":scope > p");
        const buffer = transition.querySelector<HTMLElement>(".route-transition__buffer");
        const field = transition.querySelector<HTMLElement>(".route-transition__field");
        const signal = transition.querySelector<HTMLElement>(".route-transition__signal");
        const textNodes = [meta, label, buffer].filter((item): item is HTMLElement => Boolean(item));

        handoffAnimation.current = gsap.timeline({
          defaults: { ease: "power3.out", overwrite: "auto" },
          onComplete: () => {
            textNodes.forEach((element) => gsap.set(element, { clearProps: "all" }));
            if (field) gsap.set(field, { clearProps: "all" });
            if (signal) gsap.set(signal, { clearProps: "all" });
            finish();
          },
        });
        const timeline = handoffAnimation.current
          .fromTo(node, {
            opacity: 1,
            x: source.left,
            y: source.top,
            scale: 1.015,
          }, {
            opacity: 1,
            x: rect.left,
            y: rect.top,
            scaleX,
            scaleY,
            duration: ROUTE_ENTER_DURATION / 1000,
            ease: "expo.inOut",
          }, 0)
          .to(node, { opacity: 0, duration: .08, ease: "power2.out" }, .44);
        if (textNodes.length) timeline.fromTo(textNodes, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -8, duration: .2 }, .26);
        if (signal) timeline.fromTo(signal, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: .38, ease: "power2.inOut" }, .1);
        if (field) timeline.to(field, { autoAlpha: 0, scale: 1.018, duration: .35 }, .1);
        return true;
      });
      if (!playHandoff()) enterTimer.current = window.setTimeout(finish, ROUTE_ENTER_DURATION);
    } else {
      enterTimer.current = window.setTimeout(finish, reduced ? 140 : ROUTE_ENTER_DURATION);
    }
  }, [applyRoutePhase, contextSafe]);

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
      handoffAnimation.current?.kill();
      handoffAnimation.current = null;

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
      handoffAnimation.current?.kill();
      handoffAnimation.current = null;
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
    <div className={`synthesis-site${loaded ? " is-loaded" : " is-loading"}`} aria-busy={!loaded || routePhase === "loading"}>
      <InstrumentCursor />
      <SmoothWheelScroll />
      <a className="synthesis-skip" href="#content">Skip to content</a>
      <div ref={loaderNode} className="synthesis-loader" aria-hidden="true">
        <span className="synthesis-loader__line synthesis-loader__line--vertical" />
        <span className="synthesis-loader__line synthesis-loader__line--horizontal" />
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
          <div className="synthesis-loader__rail"><i /><b /></div>
          <div><span>LOADING / PHASE {loaderStage.id}</span><span>30.2741° N / 120.1551° E</span></div>
        </div>
      </div>
      <div
        ref={routeTransitionNode}
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
          <TransitionLink data-proximity-item href="/synthesis/about" aria-current={isAbout ? "page" : undefined}><span data-proximity-label>ABOUT</span></TransitionLink>
          <a data-proximity-item href="mailto:2742733283@qq.com"><span data-proximity-label>CONTACT</span></a>
        </nav>
      </header>
      <div className="synthesis-progress" aria-hidden="true"><i /></div>
      {children}
    </div>
  );
}
