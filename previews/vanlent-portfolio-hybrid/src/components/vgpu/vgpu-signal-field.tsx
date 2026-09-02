"use client";

import { useEffect, useRef, useState } from "react";
import {
  createSignalField,
  type SignalFieldController,
  type SignalFieldSettings,
  type SignalFieldStats,
  type SignalFieldStatus,
} from "./signal-field-runtime";
import fieldCss from "./vgpu-signal-field.module.css";

type VgpuSignalFieldProps = {
  paused: boolean;
  settings: SignalFieldSettings;
  onStats: (stats: SignalFieldStats) => void;
  onStatus: (status: SignalFieldStatus, detail?: string) => void;
  className?: string;
  interactive?: boolean;
  pointer?: readonly [number, number];
  pulseKey?: number;
  pulseDuration?: number;
};

export function VgpuSignalField({
  paused,
  settings,
  onStats,
  onStatus,
  className,
  interactive = true,
  pointer,
  pulseKey = 0,
  pulseDuration = 0.74,
}: VgpuSignalFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<SignalFieldController | undefined>(undefined);
  const settingsRef = useRef(settings);
  const pausedRef = useRef(paused);
  const onStatsRef = useRef(onStats);
  const onStatusRef = useRef(onStatus);
  const pointerRef = useRef(pointer);
  const pulseKeyRef = useRef(pulseKey);
  const pulseDurationRef = useRef(pulseDuration);
  const triggeredPulseRef = useRef(0);
  const [status, setStatus] = useState<SignalFieldStatus>("initializing");

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    let cancelled = false;
    let intersecting = true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateActivity = () => {
      controllerRef.current?.setActive(!pausedRef.current && intersecting && !document.hidden);
    };
    const updateStatus = (nextStatus: SignalFieldStatus, detail?: string) => {
      if (cancelled) return;
      setStatus(nextStatus);
      onStatusRef.current(nextStatus, detail);
    };

    const observer = new IntersectionObserver(([entry]) => {
      intersecting = (entry?.intersectionRatio ?? 1) > 0.04;
      updateActivity();
    }, { threshold: [0, 0.04] });
    observer.observe(host);

    const onVisibilityChange = () => updateActivity();
    const onReducedMotionChange = () => controllerRef.current?.setReducedMotion(reducedMotion.matches);
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener("change", onReducedMotionChange);

    void createSignalField(canvas, settingsRef.current, {
      onStatus: updateStatus,
      onStats: (stats) => onStatsRef.current(stats),
    }).then((controller) => {
      if (cancelled) {
        controller.dispose();
        return;
      }
      controllerRef.current = controller;
      controller.setReducedMotion(reducedMotion.matches);
      const controlledPointer = pointerRef.current;
      if (controlledPointer) controller.setPointer(controlledPointer[0], controlledPointer[1]);
      if (pulseKeyRef.current > triggeredPulseRef.current) {
        triggeredPulseRef.current = pulseKeyRef.current;
        controller.triggerPulse(pulseDurationRef.current);
      }
      updateActivity();
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to initialize WebGPU.";
      updateStatus("fallback", message);
    });

    return () => {
      cancelled = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", onReducedMotionChange);
      controllerRef.current?.dispose();
      controllerRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
    controllerRef.current?.setSettings(settings);
  }, [settings]);

  useEffect(() => {
    pausedRef.current = paused;
    controllerRef.current?.setActive(!paused && !document.hidden);
  }, [paused]);

  useEffect(() => {
    onStatsRef.current = onStats;
    onStatusRef.current = onStatus;
  }, [onStats, onStatus]);

  useEffect(() => {
    pointerRef.current = pointer;
    if (pointer) controllerRef.current?.setPointer(pointer[0], pointer[1]);
  }, [pointer]);

  useEffect(() => {
    pulseKeyRef.current = pulseKey;
    if (pulseKey <= triggeredPulseRef.current || !controllerRef.current) return;
    triggeredPulseRef.current = pulseKey;
    controllerRef.current.triggerPulse(pulseDurationRef.current);
  }, [pulseKey]);

  useEffect(() => {
    pulseDurationRef.current = pulseDuration;
  }, [pulseDuration]);

  const setPointerFromEvent = (clientX: number, clientY: number) => {
    const rect = hostRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    controllerRef.current?.setPointer(
      (clientX - rect.left) / rect.width,
      (clientY - rect.top) / rect.height,
    );
  };

  return (
    <div
      ref={hostRef}
      className={`${fieldCss.field}${className ? ` ${className}` : ""}`}
      data-status={status}
      onPointerMove={interactive ? (event) => setPointerFromEvent(event.clientX, event.clientY) : undefined}
      onPointerDown={interactive ? (event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setPointerFromEvent(event.clientX, event.clientY);
        controllerRef.current?.triggerPulse();
      } : undefined}
      onDoubleClick={interactive ? () => controllerRef.current?.triggerPulse() : undefined}
    >
      <canvas ref={canvasRef} className={fieldCss.canvas} aria-label="Interactive orange WebGPU signal field" />
      <div className={fieldCss.fallback} aria-hidden="true"><span /><i /></div>
    </div>
  );
}
