import { effect, frame, frameLoop, init, surface } from "vgpu";
import type { FrameLoopHandle } from "vgpu";
import signalFieldShader from "@/shaders/vgpu/signal-field.wgsl";

export type SignalFieldStatus = "initializing" | "ready" | "fallback" | "error";

export type SignalFieldSettings = {
  speed: number;
  intensity: number;
  grain: number;
  pointerStrength: number;
  density: number;
};

export type SignalFieldStats = {
  fps: number;
  width: number;
  height: number;
  dpr: number;
};

type SignalFieldCallbacks = {
  onStatus?: (status: SignalFieldStatus, detail?: string) => void;
  onStats?: (stats: SignalFieldStats) => void;
};

export type SignalFieldController = {
  setActive(active: boolean): void;
  setPointer(x: number, y: number): void;
  setReducedMotion(reduced: boolean): void;
  setSettings(settings: SignalFieldSettings): void;
  triggerPulse(durationSeconds?: number): void;
  dispose(): void;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export async function createSignalField(
  canvas: HTMLCanvasElement,
  initialSettings: SignalFieldSettings,
  callbacks: SignalFieldCallbacks = {},
): Promise<SignalFieldController> {
  if (!("gpu" in navigator)) {
    callbacks.onStatus?.("fallback", "WEBGPU UNAVAILABLE");
    throw new Error("WebGPU is not available in this browser.");
  }

  callbacks.onStatus?.("initializing", "REQUESTING GPU ADAPTER");
  const gpu = await init({ powerPreference: "high-performance", label: "portfolio-signal-field" });
  let disposed = false;
  let requestedActive = true;
  let reducedMotion = false;
  let loop: FrameLoopHandle | undefined;
  let settings = { ...initialSettings };
  let pointerTarget: [number, number] = [0.5, 0.5];
  let pointerCurrent: [number, number] = [0.5, 0.5];
  let elapsed = 0;
  let pulseAge = -1;
  let pulseDuration = 0.74;
  let staticFrameRequest = 0;
  let lastTime = performance.now();
  let statsStarted = lastTime;
  let statsFrames = 0;
  let reportedReady = false;

  const output = surface(gpu, canvas, {
    alphaMode: "opaque",
    clearColor: [0.022, 0.018, 0.015, 1],
    dpr: [1, 1.6],
    label: "portfolio-signal-field-surface",
  });

  const shader = effect(gpu, signalFieldShader, {
    label: "portfolio-signal-field-effect",
    set: {
      params: {
        resolution: output.size,
        pointer: pointerCurrent,
        time: 0,
        speed: settings.speed,
        intensity: settings.intensity,
        grain: settings.grain,
        pointerStrength: settings.pointerStrength,
        density: settings.density,
        pulse: -1,
        motion: 1,
      },
    },
  });

  const reportStats = (now: number) => {
    statsFrames += 1;
    const duration = now - statsStarted;
    if (duration < 550) return;
    callbacks.onStats?.({
      fps: Math.round((statsFrames * 1000) / duration),
      width: output.size[0],
      height: output.size[1],
      dpr: output.dpr,
    });
    statsFrames = 0;
    statsStarted = now;
  };

  const updateShader = (motion: number) => {
    shader.set({
      params: {
        resolution: output.size,
        pointer: pointerCurrent,
        time: elapsed,
        speed: settings.speed,
        intensity: settings.intensity,
        grain: settings.grain,
        pointerStrength: settings.pointerStrength,
        density: settings.density,
        pulse: pulseAge,
        motion,
      },
    });
  };

  const markReady = () => {
    if (reportedReady) return;
    reportedReady = true;
    callbacks.onStatus?.("ready", "WEBGPU / WGSL ACTIVE");
  };

  const drawStaticFrame = () => {
    if (disposed) return;
    pointerCurrent = [...pointerTarget];
    updateShader(0);
    frame(gpu, (currentFrame) => currentFrame.pass(output, shader));
    markReady();
  };

  const scheduleStaticFrame = () => {
    if (disposed || staticFrameRequest) return;
    staticFrameRequest = window.requestAnimationFrame(() => {
      staticFrameRequest = 0;
      if (!loop) drawStaticFrame();
    });
  };

  const stopLoop = () => {
    loop?.stop();
    loop = undefined;
  };

  const startLoop = () => {
    if (disposed || loop || reducedMotion || !requestedActive) return;
    lastTime = performance.now();
    statsStarted = lastTime;
    statsFrames = 0;
    loop = frameLoop(gpu, (currentFrame) => {
      const now = performance.now();
      const delta = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;
      elapsed += delta;
      pointerCurrent = [
        pointerCurrent[0] + (pointerTarget[0] - pointerCurrent[0]) * 0.14,
        pointerCurrent[1] + (pointerTarget[1] - pointerCurrent[1]) * 0.14,
      ];
      if (pulseAge >= 0) pulseAge = pulseAge >= 1 ? -1 : Math.min(1, pulseAge + delta / pulseDuration);
      updateShader(1);
      currentFrame.pass(output, shader);
      reportStats(now);
      markReady();
    }, { fps: 60 });
  };

  const syncLoop = () => {
    if (requestedActive && !reducedMotion) startLoop();
    else {
      stopLoop();
      scheduleStaticFrame();
    }
  };

  const unsubscribeError = gpu.onError((error) => {
    callbacks.onStatus?.("error", error.message);
  });
  void gpu.gpu.lost.then((info: GPUDeviceLostInfo) => {
    if (!disposed) callbacks.onStatus?.("error", `GPU DEVICE LOST / ${info.message || info.reason}`);
  });
  output.onResize(() => {
    if (!loop) scheduleStaticFrame();
  });

  startLoop();

  return {
    setActive(active) {
      requestedActive = active;
      syncLoop();
    },
    setPointer(x, y) {
      pointerTarget = [clamp01(x), clamp01(y)];
      if (!loop) scheduleStaticFrame();
    },
    setReducedMotion(reduced) {
      reducedMotion = reduced;
      syncLoop();
    },
    setSettings(nextSettings) {
      settings = { ...nextSettings };
      if (!loop) scheduleStaticFrame();
    },
    triggerPulse(durationSeconds = 0.74) {
      pulseDuration = Math.max(0.2, durationSeconds);
      pulseAge = 0;
      if (!loop) scheduleStaticFrame();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stopLoop();
      window.cancelAnimationFrame(staticFrameRequest);
      unsubscribeError();
      gpu.dispose();
    },
  };
}
