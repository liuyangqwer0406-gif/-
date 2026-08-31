"use client";

import { useEffect, useRef } from "react";
import type { SiteMode } from "./site-types";

type ParticleOrbProps = { mode: SiteMode; phase?: number; className?: string; label?: string };
type Dot = { x: number; y: number; z: number; jitter: number };

function fibonacciSphere(count: number): Dot[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - (index / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = golden * index;
    return { x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius, jitter: Math.sin(index * 12.43) };
  });
}

export function ParticleOrb({ mode, phase = 0, className = "", label }: ParticleOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const dots = fibonacciSphere(1500);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    let frame = 0;
    let width = 0;
    let height = 0;
    let pointerX = 0;
    let pointerY = 0;
    let scrollRotation = 0;

    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: "120px" });
    observer.observe(wrap);
    const resize = () => {
      const bounds = wrap.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const onPointer = (event: PointerEvent) => {
      const bounds = wrap.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / Math.max(bounds.width, 1) - .5) * .45;
      pointerY = ((event.clientY - bounds.top) / Math.max(bounds.height, 1) - .5) * .35;
    };
    const onScroll = () => { scrollRotation = window.scrollY * .0007; };
    const draw = (time: number) => {
      if (visible && !document.hidden) {
        context.clearRect(0, 0, width, height);
        const t = reduced ? phase : time * .00028 + phase;
        const size = Math.min(width, height) * .39;
        const cx = width / 2;
        const cy = height / 2;
        const ay = t + scrollRotation + pointerX;
        const ax = -.22 + pointerY + Math.sin(t * .7) * .08;
        const cosY = Math.cos(ay); const sinY = Math.sin(ay);
        const cosX = Math.cos(ax); const sinX = Math.sin(ax);
        const color = mode === "hybrid" ? "255,90,31" : "250,250,250";
        for (const dot of dots) {
          const pulse = 1 + Math.sin(t * 3 + dot.jitter * 2) * .018 + dot.jitter * .025;
          const x1 = dot.x * cosY - dot.z * sinY;
          const z1 = dot.x * sinY + dot.z * cosY;
          const y1 = dot.y * cosX - z1 * sinX;
          const z2 = dot.y * sinX + z1 * cosX;
          const perspective = 1 / (1.9 - z2 * .55);
          context.fillStyle = `rgba(${color},${.16 + (z2 + 1) * .28})`;
          context.beginPath();
          context.arc(cx + x1 * size * pulse * perspective, cy + y1 * size * pulse * perspective, .45 + perspective * .72, 0, Math.PI * 2);
          context.fill();
        }
      }
      if (!reduced) frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    wrap.addEventListener("pointermove", onPointer);
    draw(0);
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize); window.removeEventListener("scroll", onScroll); wrap.removeEventListener("pointermove", onPointer);
    };
  }, [mode, phase]);

  return <div ref={wrapRef} className={`particle-orb ${className}`} aria-label={label} aria-hidden={label ? undefined : true}><canvas ref={canvasRef} /></div>;
}
