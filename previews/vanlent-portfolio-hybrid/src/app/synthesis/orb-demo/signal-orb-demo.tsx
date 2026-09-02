"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { announceSynthesisRouteReady } from "@/components/synthesis/route-events";
import orbCss from "./signal-orb-demo.module.css";

type BotMode = "idle" | "curious" | "focus";

type BotSettings = {
  tension: number;
  inertia: number;
  magnetism: number;
  signal: number;
};

type SpringValue = { value: number; velocity: number };

type BotPhysics = {
  radii: number[];
  radiusVelocities: number[];
  x: SpringValue;
  y: SpringValue;
  rotation: SpringValue;
  squash: SpringValue;
  gazeX: SpringValue;
  gazeY: SpringValue;
  blink: SpringValue;
  confirmUntil: number;
  nextBlinkAt: number;
  blinkUntil: number;
  nextTrickAt: number;
  trickUntil: number;
  trickDirection: number;
};

const VIEWBOX_SIZE = 600;
const BOT_CENTER = VIEWBOX_SIZE / 2;
const BASE_RADII = [
  166, 161, 174, 168, 158, 171, 165, 160,
  169, 164, 173, 159, 168, 176, 162, 170,
];

const CONTROL_DEFINITIONS: Array<{
  key: keyof BotSettings;
  label: string;
  labelCn: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "tension", label: "TENSION", labelCn: "张力", min: 0.05, max: 0.22, step: 0.005 },
  { key: "inertia", label: "INERTIA", labelCn: "惯性", min: 0.68, max: 0.94, step: 0.01 },
  { key: "magnetism", label: "GAZE", labelCn: "注视", min: 0, max: 1, step: 0.01 },
  { key: "signal", label: "SIGNAL", labelCn: "信号", min: 0, max: 1, step: 0.01 },
];

const DEFAULT_SETTINGS: BotSettings = {
  tension: 0.12,
  inertia: 0.82,
  magnetism: 0.84,
  signal: 0.42,
};

const MODE_LABELS: Record<BotMode, string> = {
  idle: "IDLE / 待机",
  curious: "CURIOUS / 好奇",
  focus: "FOCUS / 专注",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function smoothClosedPath(radii: number[]) {
  const points = radii.map((radius, index) => {
    const angle = -Math.PI / 2 + (index / radii.length) * Math.PI * 2;
    return {
      x: BOT_CENTER + Math.cos(angle) * radius,
      y: BOT_CENTER + Math.sin(angle) * radius,
    };
  });

  const last = points.at(-1)!;
  const first = points[0];
  let path = `M ${((last.x + first.x) / 2).toFixed(2)} ${((last.y + first.y) / 2).toFixed(2)}`;

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    path += ` Q ${point.x.toFixed(2)} ${point.y.toFixed(2)} ${((point.x + next.x) / 2).toFixed(2)} ${((point.y + next.y) / 2).toFixed(2)}`;
  });

  return `${path} Z`;
}

function eyePath(cx: number, cy: number, width: number, height: number, slant: number) {
  const halfW = width / 2;
  const halfH = Math.max(1.8, height / 2);
  const inset = Math.min(halfW * 0.26, 9);
  return [
    `M ${(cx - halfW + inset + slant).toFixed(2)} ${(cy - halfH).toFixed(2)}`,
    `Q ${(cx - halfW + slant).toFixed(2)} ${(cy - halfH).toFixed(2)} ${(cx - halfW).toFixed(2)} ${(cy - halfH + inset).toFixed(2)}`,
    `L ${(cx - halfW - slant).toFixed(2)} ${(cy + halfH - inset).toFixed(2)}`,
    `Q ${(cx - halfW - slant).toFixed(2)} ${(cy + halfH).toFixed(2)} ${(cx - halfW + inset - slant).toFixed(2)} ${(cy + halfH).toFixed(2)}`,
    `L ${(cx + halfW - inset - slant).toFixed(2)} ${(cy + halfH).toFixed(2)}`,
    `Q ${(cx + halfW - slant).toFixed(2)} ${(cy + halfH).toFixed(2)} ${(cx + halfW).toFixed(2)} ${(cy + halfH - inset).toFixed(2)}`,
    `L ${(cx + halfW + slant).toFixed(2)} ${(cy - halfH + inset).toFixed(2)}`,
    `Q ${(cx + halfW + slant).toFixed(2)} ${(cy - halfH).toFixed(2)} ${(cx + halfW - inset + slant).toFixed(2)} ${(cy - halfH).toFixed(2)}`,
    "Z",
  ].join(" ");
}

function stepSpring(
  spring: SpringValue,
  target: number,
  stiffness: number,
  damping: number,
  delta: number,
) {
  spring.velocity += (target - spring.value) * stiffness * delta;
  spring.velocity *= Math.pow(damping, delta);
  spring.value += spring.velocity * delta;
}

const INITIAL_PATH = smoothClosedPath(BASE_RADII);

export function SignalOrbDemo() {
  const [settings, setSettings] = useState<BotSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<BotMode>("curious");
  const [pulseKey, setPulseKey] = useState(0);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isEngaged, setIsEngaged] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const bodyGroupRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGPathElement>(null);
  const clipRef = useRef<SVGPathElement>(null);
  const contourRef = useRef<SVGPathElement>(null);
  const leftEyeRef = useRef<SVGPathElement>(null);
  const rightEyeRef = useRef<SVGPathElement>(null);
  const leftGlintRef = useRef<SVGCircleElement>(null);
  const rightGlintRef = useRef<SVGCircleElement>(null);
  const badgeRef = useRef<SVGCircleElement>(null);
  const settingsRef = useRef(settings);
  const modeRef = useRef(mode);
  const pointerRef = useRef({
    x: BOT_CENTER,
    y: BOT_CENTER,
    inside: false,
    dragging: false,
    pointerId: -1,
    downX: BOT_CENTER,
    downY: BOT_CENTER,
  });
  const physicsRef = useRef<BotPhysics>({
    radii: [...BASE_RADII],
    radiusVelocities: BASE_RADII.map(() => 0),
    x: { value: 0, velocity: 0 },
    y: { value: 0, velocity: 0 },
    rotation: { value: 0, velocity: 0 },
    squash: { value: 1, velocity: 0 },
    gazeX: { value: 0, velocity: 0 },
    gazeY: { value: 0, velocity: 0 },
    blink: { value: 1, velocity: 0 },
    confirmUntil: 0,
    nextBlinkAt: 1500,
    blinkUntil: 0,
    nextTrickAt: 4300,
    trickUntil: 0,
    trickDirection: 1,
  });

  useEffect(() => {
    announceSynthesisRouteReady("/synthesis/orb-demo");
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "120px 0px", threshold: 0.02 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    const group = bodyGroupRef.current;
    const body = bodyRef.current;
    const clip = clipRef.current;
    const contour = contourRef.current;
    const leftEye = leftEyeRef.current;
    const rightEye = rightEyeRef.current;
    const leftGlint = leftGlintRef.current;
    const rightGlint = rightGlintRef.current;
    const badge = badgeRef.current;
    if (!group || !body || !clip || !contour || !leftEye || !rightEye || !leftGlint || !rightGlint || !badge) {
      return undefined;
    }

    if (reducedMotion || !inView || !pageVisible) {
      body.setAttribute("d", INITIAL_PATH);
      clip.setAttribute("d", INITIAL_PATH);
      contour.setAttribute("d", INITIAL_PATH);
      group.setAttribute("transform", "translate(0 0)");
      leftEye.setAttribute("d", eyePath(253, 276, 48, modeRef.current === "focus" ? 18 : 54, -5));
      rightEye.setAttribute("d", eyePath(347, 276, 48, modeRef.current === "focus" ? 18 : 54, 5));
      return undefined;
    }

    const physics = physicsRef.current;
    const now = performance.now();
    physics.nextBlinkAt = now + 900;
    physics.nextTrickAt = now + 3400;
    let animationFrame = 0;
    let previousTime = now;

    const tick = (time: number) => {
      const delta = clamp((time - previousTime) / 16.667, 0.35, 2.2);
      previousTime = time;

      const activeSettings = settingsRef.current;
      const activeMode = modeRef.current;
      const pointer = pointerRef.current;
      const rawX = pointer.x - BOT_CENTER;
      const rawY = pointer.y - BOT_CENTER;
      const pointerDistance = Math.hypot(rawX, rawY) || 1;
      const proximity = pointer.inside ? clamp(1 - pointerDistance / 430, 0, 1) : 0;
      const pointerUnitX = rawX / pointerDistance;
      const pointerUnitY = rawY / pointerDistance;
      const modeEnergy = activeMode === "idle" ? 0.34 : activeMode === "focus" ? 0.72 : 1;

      if (time >= physics.nextBlinkAt && !pointer.dragging) {
        physics.blinkUntil = time + (activeMode === "focus" ? 92 : 118);
        physics.nextBlinkAt = time + 2300 + Math.random() * 3600;
      }
      const blinkTarget = time < physics.blinkUntil ? 0.035 : 1;
      stepSpring(physics.blink, blinkTarget, 0.42, 0.58, delta);

      if (time >= physics.nextTrickAt && !pointer.inside && activeMode !== "focus") {
        physics.trickUntil = time + 760;
        physics.trickDirection *= -1;
        physics.nextTrickAt = time + 5200 + Math.random() * 4800;
      }
      const trickProgress = time < physics.trickUntil
        ? clamp(1 - (physics.trickUntil - time) / 760, 0, 1)
        : 1;
      const trickWave = time < physics.trickUntil
        ? Math.sin(trickProgress * Math.PI) * physics.trickDirection
        : 0;
      const confirmProgress = physics.confirmUntil > time
        ? clamp((physics.confirmUntil - time) / 620, 0, 1)
        : 0;
      const confirmWave = confirmProgress > 0 ? Math.sin((1 - confirmProgress) * Math.PI) : 0;

      const targetX = pointer.dragging
        ? clamp(rawX * 0.42, -92, 92)
        : pointer.inside
          ? clamp(rawX * activeSettings.magnetism * 0.052, -31, 31)
          : 0;
      const targetY = pointer.dragging
        ? clamp(rawY * 0.42, -92, 92)
        : pointer.inside
          ? clamp(rawY * activeSettings.magnetism * 0.038, -24, 24)
          : trickWave * -12;
      const targetRotation = pointer.dragging
        ? clamp(rawX * 0.055, -16, 16)
        : pointer.inside
          ? clamp(rawX * 0.018, -7, 7)
          : trickWave * 14;
      const targetSquash = pointer.dragging
        ? 0.83
        : confirmProgress > 0
          ? 1 - confirmWave * 0.17
          : 1 + Math.sin(time * 0.0017) * 0.018 * modeEnergy;

      stepSpring(physics.x, targetX, activeSettings.tension * 0.72, activeSettings.inertia, delta);
      stepSpring(physics.y, targetY, activeSettings.tension * 0.72, activeSettings.inertia, delta);
      stepSpring(physics.rotation, targetRotation, activeSettings.tension * 0.6, activeSettings.inertia, delta);
      stepSpring(physics.squash, targetSquash, activeSettings.tension * 1.45, activeSettings.inertia * 0.94, delta);

      const gazeTargetX = pointer.inside
        ? clamp(rawX / 12, -21, 21) * activeSettings.magnetism
        : activeMode === "idle" ? Math.sin(time * 0.0007) * 3 : trickWave * 8;
      const gazeTargetY = pointer.inside
        ? clamp(rawY / 16, -14, 14) * activeSettings.magnetism
        : activeMode === "idle" ? 3 : 0;
      stepSpring(physics.gazeX, gazeTargetX, 0.15, 0.72, delta);
      stepSpring(physics.gazeY, gazeTargetY, 0.15, 0.72, delta);

      physics.radii.forEach((radius, index) => {
        const angle = -Math.PI / 2 + (index / physics.radii.length) * Math.PI * 2;
        const alignment = Math.cos(angle) * pointerUnitX + Math.sin(angle) * pointerUnitY;
        const pull = Math.pow(Math.max(alignment, 0), 3)
          * activeSettings.magnetism
          * proximity
          * (pointer.dragging ? 48 : 15);
        const press = Math.pow(Math.max(-alignment, 0), 2)
          * activeSettings.magnetism
          * proximity
          * (pointer.dragging ? 17 : 5);
        const breath = Math.sin(time * 0.0014 + index * 0.68) * 2.3 * modeEnergy;
        const reaction = confirmWave * Math.sin(index * 1.34 + time * 0.004) * 7;
        const target = BASE_RADII[index] + pull - press + breath + reaction;
        physics.radiusVelocities[index] += (target - radius) * activeSettings.tension * 0.72 * delta;
        physics.radiusVelocities[index] *= Math.pow(activeSettings.inertia, delta);
        physics.radii[index] += physics.radiusVelocities[index] * delta;
      });

      const bodyPath = smoothClosedPath(physics.radii);
      const scaleY = clamp(physics.squash.value, 0.78, 1.16);
      const scaleX = clamp(1 / Math.sqrt(scaleY), 0.92, 1.14);
      group.setAttribute(
        "transform",
        `translate(${physics.x.value.toFixed(2)} ${physics.y.value.toFixed(2)}) rotate(${physics.rotation.value.toFixed(2)} ${BOT_CENTER} ${BOT_CENTER}) translate(${BOT_CENTER} ${BOT_CENTER}) scale(${scaleX.toFixed(4)} ${scaleY.toFixed(4)}) translate(${-BOT_CENTER} ${-BOT_CENTER})`,
      );
      body.setAttribute("d", bodyPath);
      clip.setAttribute("d", bodyPath);
      contour.setAttribute("d", bodyPath);

      const modeEyeHeight = activeMode === "focus" ? 22 : activeMode === "idle" ? 46 : 58;
      const modeEyeWidth = activeMode === "focus" ? 52 : activeMode === "idle" ? 43 : 50;
      const eyeHeight = Math.max(2.4, modeEyeHeight * clamp(physics.blink.value, 0.03, 1));
      const eyeY = 276 + physics.gazeY.value;
      const leftX = 253 + physics.gazeX.value;
      const rightX = 347 + physics.gazeX.value;
      leftEye.setAttribute("d", eyePath(leftX, eyeY, modeEyeWidth, eyeHeight, -6));
      rightEye.setAttribute("d", eyePath(rightX, eyeY, modeEyeWidth, eyeHeight, 6));

      const glintOpacity = clamp((physics.blink.value - 0.3) * 1.5, 0, 1);
      leftGlint.setAttribute("cx", String(leftX + 8));
      leftGlint.setAttribute("cy", String(eyeY - Math.min(9, eyeHeight * 0.18)));
      leftGlint.style.opacity = String(glintOpacity);
      rightGlint.setAttribute("cx", String(rightX + 8));
      rightGlint.setAttribute("cy", String(eyeY - Math.min(9, eyeHeight * 0.18)));
      rightGlint.style.opacity = String(glintOpacity);

      const activeSignal = clamp(
        activeSettings.signal + (activeMode === "focus" ? 0.25 : 0) + confirmWave * 0.5,
        0,
        1,
      );
      contour.style.strokeOpacity = String(0.14 + activeSignal * 0.58);
      badge.setAttribute("r", String(8 + activeSignal * 5 + confirmWave * 8));
      badge.style.opacity = String(0.46 + activeSignal * 0.54);

      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [inView, pageVisible, reducedMotion]);

  const mapPointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * VIEWBOX_SIZE;
    pointerRef.current.y = ((event.clientY - rect.top) / rect.height) * VIEWBOX_SIZE;
    pointerRef.current.inside = true;
    setIsEngaged(true);
  };

  const triggerSignal = () => {
    physicsRef.current.confirmUntil = performance.now() + 620;
    physicsRef.current.squash.velocity -= 0.028;
    setPulseKey((current) => current + 1);
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (pointerRef.current.dragging) return;
    mapPointer(event);
    pointerRef.current.dragging = true;
    pointerRef.current.pointerId = event.pointerId;
    pointerRef.current.downX = pointerRef.current.x;
    pointerRef.current.downY = pointerRef.current.y;
    physicsRef.current.squash.velocity -= 0.045;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (pointerRef.current.pointerId !== event.pointerId) return;
    const dragX = pointerRef.current.x - pointerRef.current.downX;
    physicsRef.current.x.velocity += clamp(dragX * 0.028, -2.8, 2.8);
    pointerRef.current.dragging = false;
    pointerRef.current.pointerId = -1;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    triggerSignal();
  };

  const handlePointerCancel = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (pointerRef.current.pointerId !== event.pointerId) return;
    pointerRef.current.dragging = false;
    pointerRef.current.pointerId = -1;
    pointerRef.current.inside = false;
    setIsEngaged(false);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<SVGSVGElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    triggerSignal();
  };

  const runtimeState = reducedMotion
    ? "REDUCED"
    : inView && pageVisible
      ? isEngaged ? "ENGAGED" : "ALIVE"
      : "SLEEP";

  return (
    <main className={orbCss.root}>
      <header className={orbCss.header}>
        <div>
          <p>INTERACTION SPECIMEN 02 / SPRING BOT</p>
          <span>ORIGINAL GEOMETRY / REFERENCE-MATCHED PHYSICS</span>
        </div>
        <h1>SIGNAL BOT</h1>
        <p>A living interface character driven by independent body, gaze, blink and pose springs.<br />由身体、注视、眨眼与姿态弹簧共同驱动的交互角色。</p>
      </header>

      <section className={orbCss.lab} aria-labelledby="signal-bot-lab-title">
        <div ref={stageRef} className={orbCss.stage}>
          <div className={orbCss.stageMeta}>
            <span id="signal-bot-lab-title">LIVE CHARACTER / 600 × 600</span>
            <span>RUNTIME / {runtimeState}</span>
          </div>

          <div className={orbCss.orbField}>
            <span className={orbCss.axisX} aria-hidden="true" />
            <span className={orbCss.axisY} aria-hidden="true" />
            <svg
              className={orbCss.orb}
              viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
              role="button"
              tabIndex={0}
              aria-label="Interactive signal bot. Move to guide its gaze, press and drag its body, or use Enter to trigger a reaction."
              onPointerMove={mapPointer}
              onPointerEnter={mapPointer}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onPointerLeave={() => {
                if (!pointerRef.current.dragging) {
                  pointerRef.current.inside = false;
                  setIsEngaged(false);
                }
              }}
              onKeyDown={handleKeyDown}
            >
              <defs>
                <clipPath id="signal-bot-clip">
                  <path ref={clipRef} d={INITIAL_PATH} />
                </clipPath>
                <filter id="signal-bot-shadow" x="-40%" y="-40%" width="180%" height="190%">
                  <feDropShadow dx="0" dy="24" stdDeviation="18" floodColor="#211812" floodOpacity=".28" />
                </filter>
              </defs>
              <circle className={orbCss.orbitOuter} cx={BOT_CENTER} cy={BOT_CENTER} r="238" />
              <circle className={orbCss.orbitInner} cx={BOT_CENTER} cy={BOT_CENTER} r="208" />
              <circle key={pulseKey} className={orbCss.pulse} cx={BOT_CENTER} cy={BOT_CENTER} r="178" />

              <g ref={bodyGroupRef} className={orbCss.bodyGroup}>
                <path ref={bodyRef} className={orbCss.body} d={INITIAL_PATH} />
                <g clipPath="url(#signal-bot-clip)" aria-hidden="true">
                  <path className={orbCss.surfaceLight} d="M 178 231 C 210 155 320 117 411 170" />
                  <path className={orbCss.surfaceShade} d="M 154 392 C 241 450 386 446 452 355" />
                  <path ref={leftEyeRef} className={orbCss.eye} d={eyePath(253, 276, 50, 58, -6)} />
                  <path ref={rightEyeRef} className={orbCss.eye} d={eyePath(347, 276, 50, 58, 6)} />
                  <circle ref={leftGlintRef} className={orbCss.eyeGlint} cx="261" cy="267" r="4.5" />
                  <circle ref={rightGlintRef} className={orbCss.eyeGlint} cx="355" cy="267" r="4.5" />
                </g>
                <path ref={contourRef} className={orbCss.contour} d={INITIAL_PATH} />
                <circle ref={badgeRef} className={orbCss.badge} cx="416" cy="398" r="11" />
              </g>
            </svg>
          </div>

          <div className={orbCss.stageFooter}>
            <span>MOVE / 注视</span>
            <span>PRESS + DRAG / 挤压拖拽</span>
            <span>RELEASE / 回弹</span>
          </div>
        </div>

        <aside className={orbCss.controls} aria-label="Signal bot controls">
          <header>
            <p>BEHAVIOUR FIELD / 行为控制</p>
            <button
              type="button"
              onClick={() => {
                setSettings(DEFAULT_SETTINGS);
                setMode("curious");
                triggerSignal();
              }}
            >
              RESET
            </button>
          </header>

          <div className={orbCss.presets}>
            <p>MOOD / 情绪</p>
            <div>
              {(Object.keys(MODE_LABELS) as BotMode[]).map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={mode === value}
                  onClick={() => {
                    setMode(value);
                    triggerSignal();
                  }}
                >
                  {MODE_LABELS[value]}
                </button>
              ))}
            </div>
          </div>

          <div className={orbCss.sliders}>
            {CONTROL_DEFINITIONS.map((control) => (
              <label key={control.key}>
                <span><b>{control.label}</b><em>{control.labelCn}</em></span>
                <output>{settings[control.key].toFixed(2)}</output>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={settings[control.key]}
                  onChange={(event) => {
                    const nextValue = Number(event.currentTarget.value);
                    setSettings((current) => ({ ...current, [control.key]: nextValue }));
                  }}
                />
              </label>
            ))}
          </div>

          <dl className={orbCss.readout}>
            <div><dt>BODY</dt><dd>16-POINT SOFT SURFACE</dd></div>
            <div><dt>FACE</dt><dd>GAZE / BLINK / MOOD MORPH</dd></div>
            <div><dt>POSE</dt><dd>TRANSLATE / ROTATE / SQUASH</dd></div>
            <div><dt>LOOP</dt><dd>VIEWPORT + VISIBILITY GATED</dd></div>
          </dl>
        </aside>
      </section>

      <footer className={orbCss.footer}>
        <div>
          <p>APPLICATION DIRECTION / 应用方向</p>
          <h2>A BOT WITH<br />A POINT OF VIEW.</h2>
        </div>
        <p>The interaction model follows the reference’s layered spring principles. Geometry, facial design, palette and implementation remain original to this portfolio study.</p>
        <Link href="/synthesis">RETURN TO CURRENT HOME <span aria-hidden="true">↗</span></Link>
      </footer>
    </main>
  );
}
