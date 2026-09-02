"use client";

import { useEffect, useState } from "react";
import { TransitionLink } from "@/components/synthesis/transition-link";
import { announceSynthesisRouteReady } from "@/components/synthesis/route-events";
import { VgpuSignalField } from "@/components/vgpu/vgpu-signal-field";
import type {
  SignalFieldSettings,
  SignalFieldStats,
  SignalFieldStatus,
} from "@/components/vgpu/signal-field-runtime";
import labCss from "./vgpu-lab.module.css";

type Preset = {
  id: string;
  label: string;
  cn: string;
  settings: SignalFieldSettings;
};

const PRESETS: Preset[] = [
  {
    id: "signal",
    label: "SIGNAL FIELD",
    cn: "信号场",
    settings: { speed: 0.52, intensity: 0.72, grain: 0.022, pointerStrength: 0.76, density: 0.48 },
  },
  {
    id: "contour",
    label: "CONTOUR MAP",
    cn: "等高线",
    settings: { speed: 0.28, intensity: 0.48, grain: 0.014, pointerStrength: 0.42, density: 0.82 },
  },
  {
    id: "impact",
    label: "IMPACT TRACE",
    cn: "冲击轨迹",
    settings: { speed: 0.84, intensity: 0.94, grain: 0.032, pointerStrength: 1, density: 0.34 },
  },
];

const STATUS_LABELS: Record<SignalFieldStatus, string> = {
  initializing: "INITIALIZING",
  ready: "WEBGPU READY",
  fallback: "STATIC FALLBACK",
  error: "GPU ERROR",
};

type RangeControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

function RangeControl({ label, value, min, max, step, onChange }: RangeControlProps) {
  return (
    <label className={labCss.rangeControl}>
      <span>{label}</span>
      <output>{value.toFixed(step < 0.01 ? 3 : 2)}</output>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

export function VgpuLab() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [settings, setSettings] = useState<SignalFieldSettings>(PRESETS[0].settings);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<SignalFieldStatus>("initializing");
  const [statusDetail, setStatusDetail] = useState("REQUESTING GPU ADAPTER");
  const [stats, setStats] = useState<SignalFieldStats>({ fps: 0, width: 0, height: 0, dpr: 1 });
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    announceSynthesisRouteReady("/synthesis/vgpu-lab");
  }, []);

  const applyPreset = (preset: Preset) => {
    setPresetId(preset.id);
    setSettings(preset.settings);
  };

  const resetPreset = () => {
    const activePreset = PRESETS.find((preset) => preset.id === presetId) ?? PRESETS[0];
    setSettings(activePreset.settings);
  };

  return (
    <main id="content" className={labCss.root} data-status={status}>
      <header className={labCss.labHeader}>
        <div>
          <span>VGPU / WGSL</span>
          <span>LOCAL WORKBENCH 01</span>
        </div>
        <div>
          <p>INTERACTIVE SIGNAL STUDY</p>
          <h1>SHADER<br />LAB.</h1>
        </div>
        <div className={labCss.liveStatus} role="status" aria-live="polite">
          <i />
          <span>{STATUS_LABELS[status]}</span>
        </div>
      </header>

      <section className={labCss.workspace} aria-label="vgpu shader workbench">
        <div className={labCss.viewport} key={pulseKey}>
          <VgpuSignalField
            paused={paused}
            settings={settings}
            onStats={setStats}
            onStatus={(nextStatus, detail) => {
              setStatus(nextStatus);
              if (detail) setStatusDetail(detail);
            }}
          />
          <div className={labCss.viewportMeta} aria-hidden="true">
            <span>CANVAS / WEBGPU</span>
            <span>{stats.width || "—"} × {stats.height || "—"}</span>
            <span>POINTER + TOUCH</span>
          </div>
          <div className={labCss.crosshair} aria-hidden="true"><i /><i /></div>
          <div className={labCss.viewportFooter}>
            <p>MOVE TO DISTORT · PRESS TO EMIT</p>
            <div>
              <span>{paused ? "PAUSED" : `${stats.fps || "—"} FPS`}</span>
              <span>DPR {stats.dpr.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <aside className={labCss.controls} aria-label="Tweaks">
          <div className={labCss.controlsHead}>
            <div><span>03</span><h2>TWEAKS</h2></div>
            <p>{statusDetail}</p>
          </div>

          <section className={labCss.controlSection}>
            <div className={labCss.sectionLabel}><span>01</span><p>PRESET</p></div>
            <div className={labCss.presets}>
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={preset.id === presetId}
                  onClick={() => applyPreset(preset)}
                >
                  <span>{preset.label}</span>
                  <em>{preset.cn}</em>
                </button>
              ))}
            </div>
          </section>

          <section className={labCss.controlSection}>
            <div className={labCss.sectionLabel}><span>02</span><p>PARAMETERS</p></div>
            <div className={labCss.ranges}>
              <RangeControl label="SPEED" value={settings.speed} min={0} max={1.2} step={0.01} onChange={(speed) => setSettings((current) => ({ ...current, speed }))} />
              <RangeControl label="INTENSITY" value={settings.intensity} min={0.2} max={1} step={0.01} onChange={(intensity) => setSettings((current) => ({ ...current, intensity }))} />
              <RangeControl label="POINTER" value={settings.pointerStrength} min={0} max={1.2} step={0.01} onChange={(pointerStrength) => setSettings((current) => ({ ...current, pointerStrength }))} />
              <RangeControl label="DENSITY" value={settings.density} min={0} max={1} step={0.01} onChange={(density) => setSettings((current) => ({ ...current, density }))} />
              <RangeControl label="GRAIN" value={settings.grain} min={0} max={0.06} step={0.001} onChange={(grain) => setSettings((current) => ({ ...current, grain }))} />
            </div>
          </section>

          <section className={labCss.actions} aria-label="Playback actions">
            <button type="button" aria-pressed={paused} onClick={() => setPaused((current) => !current)}>
              <span>{paused ? "RESUME" : "PAUSE"}</span><i>{paused ? "▶" : "Ⅱ"}</i>
            </button>
            <button type="button" onClick={() => setPulseKey((current) => current + 1)}>
              <span>RESTART</span><i>↻</i>
            </button>
            <button type="button" onClick={resetPreset}>
              <span>RESET</span><i>00</i>
            </button>
          </section>
        </aside>
      </section>

      <footer className={labCss.footer}>
        <div><span>LOCAL FOUNDATION / V0</span><span>VGPU 0.3.1</span></div>
        <p>一个独立的 WebGPU 实验层。这里验证通过的画面，才会进入正式作品集的 Hero、加载动画或项目转场。</p>
        <TransitionLink href="/synthesis"><span>RETURN TO PORTFOLIO</span><i>↗</i></TransitionLink>
      </footer>
    </main>
  );
}
