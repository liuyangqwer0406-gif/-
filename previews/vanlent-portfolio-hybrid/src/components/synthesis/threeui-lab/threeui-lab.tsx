"use client";

import { useEffect, useRef, useState } from "react";
import { LiquidLink } from "../liquid-link";
import { announceSynthesisRouteReady } from "../route-events";
import labCss from "./threeui-lab.module.css";
import {
  createThreeUiDockController,
  startThreeUiDecode,
  THREEUI_DOCK_DEFAULTS,
} from "../threeui-motion";

const DOCK_ITEMS = ["SYSTEM", "WORK", "PROCESS", "ABOUT", "CONTACT"] as const;
const LOADER_PHASES = [
  ["01", "INITIALIZING SCENE", "建立渲染环境"],
  ["02", "RESOLVING MATERIALS", "解析材质与图像"],
  ["03", "BINDING INPUT", "绑定交互输入"],
  ["04", "VIEW READY", "视图准备完成"],
] as const;

function DecodeSpecimen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    return startThreeUiDecode(root);
  }, [run]);

  return (
    <section ref={rootRef} className={`${labCss.specimen} ${labCss.decodeSpecimen}`} aria-labelledby="threeui-decode-heading">
      <div className={labCss.specimenMeta}>
        <span>01 / TEXT DECODE</span>
        <button type="button" onClick={() => setRun((value) => value + 1)}>REPLAY</button>
      </div>
      <div className={labCss.decodeField}>
        <h1 id="threeui-decode-heading" aria-label="Motion, with restraint.">
          <span data-threeui-decode aria-hidden="true">MOTION, WITH RESTRAINT.</span>
        </h1>
        <div className={labCss.decodeAside}>
          <span data-threeui-decode>THREEUI / ADAPTED</span>
          <p>Interaction should explain state, preserve orientation and then disappear.</p>
          <p>动效用于解释状态、保持方向感，然后安静退场。</p>
        </div>
      </div>
    </section>
  );
}

function DockSpecimen() {
  const dockRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<(typeof DOCK_ITEMS)[number]>("WORK");

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return undefined;
    return createThreeUiDockController(dock, () => THREEUI_DOCK_DEFAULTS);
  }, []);

  return (
    <section className={`${labCss.specimen} ${labCss.dockSpecimen}`} aria-labelledby="threeui-dock-heading">
      <div className={labCss.specimenMeta}>
        <span>02 / PROXIMITY DOCK</span>
        <span>RAF / ON DEMAND</span>
      </div>
      <div className={labCss.dockCopy}>
        <h2 id="threeui-dock-heading">MOVE ACROSS THE INDEX.</h2>
        <p>经过项目时产生轻微的邻近弹簧；离开后停止渲染循环。</p>
      </div>
      <nav ref={dockRef} className={labCss.dock} aria-label="ThreeUI proximity dock demo">
        {DOCK_ITEMS.map((item, index) => (
          <button
            key={item}
            type="button"
            data-threeui-dock-item
            data-active={active === item || undefined}
            aria-pressed={active === item}
            onClick={() => setActive(item)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item}</strong>
            <i aria-hidden="true">↗</i>
          </button>
        ))}
      </nav>
    </section>
  );
}

function LoaderSpecimen() {
  const [phase, setPhase] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = window.requestAnimationFrame(() => {
        setPhase(LOADER_PHASES.length - 1);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const timers = LOADER_PHASES.slice(1).map((_, index) => window.setTimeout(() => {
      setPhase(index + 1);
    }, 760 * (index + 1)));
    return () => timers.forEach(window.clearTimeout);
  }, [run]);

  const restart = () => {
    setPhase(0);
    setRun((value) => value + 1);
  };

  return (
    <section className={`${labCss.specimen} ${labCss.loaderSpecimen}`} aria-labelledby="threeui-loader-heading">
      <div className={labCss.specimenMeta}>
        <span>03 / PHASE LOADER</span>
        <button type="button" onClick={restart}>RESTART</button>
      </div>
      <div className={labCss.loaderField}>
        <div>
          <span className={labCss.loaderIndex}>{LOADER_PHASES[phase][0]} / 04</span>
          <h2 id="threeui-loader-heading">{LOADER_PHASES[phase][1]}</h2>
          <p>{LOADER_PHASES[phase][2]}</p>
        </div>
        <div className={labCss.loaderAxis} aria-hidden="true">
          {LOADER_PHASES.map((item, index) => (
            <i key={item[0]} data-complete={index <= phase || undefined} />
          ))}
        </div>
      </div>
      <div className={labCss.loaderRail} aria-hidden="true">
        <i style={{ transform: `scaleX(${(phase + 1) / LOADER_PHASES.length})` }} />
      </div>
    </section>
  );
}

function LiquidSpecimen() {
  return (
    <section className={`${labCss.specimen} ${labCss.liquidSpecimen}`} aria-labelledby="threeui-liquid-heading">
      <div className={labCss.specimenMeta}>
        <span>04 / LIQUID METAL</span>
        <span>ONE ACTIVE WEBGL CTA</span>
      </div>
      <div className={labCss.liquidField}>
        <div>
          <h2 id="threeui-liquid-heading">SPECTRAL RESPONSE,<br />SIGNAL ORANGE.</h2>
          <p>保留 ThreeUI 的指针光场和按压波纹，只使用现有作品集色系。</p>
        </div>
        <div className={labCss.liquidActions}>
          <LiquidLink href="/synthesis#work" className={labCss.liquidPill}>VIEW SELECTED WORK</LiquidLink>
          <LiquidLink
            href="/synthesis/projects/jiangkou"
            variant="orb"
            className={labCss.liquidOrb}
            ariaLabel="Open Jiangkou project"
          >
            OPEN
          </LiquidLink>
        </div>
      </div>
    </section>
  );
}

export function ThreeUiLab() {
  useEffect(() => {
    document.documentElement.dataset.threeuiLab = "ready";
    announceSynthesisRouteReady("/synthesis/lab/threeui");
    return () => {
      delete document.documentElement.dataset.threeuiLab;
    };
  }, []);

  return (
    <main id="content" className={labCss.root}>
      <header className={labCss.labHeader}>
        <div>
          <span>THREEUI COMMUNITY / LOCAL ADAPTATION</span>
          <span>MIT SOURCE STUDY</span>
        </div>
        <p>BLACK / PAPER / SIGNAL ORANGE</p>
      </header>

      <DecodeSpecimen />
      <DockSpecimen />
      <div className={labCss.lowerGrid}>
        <LoaderSpecimen />
        <LiquidSpecimen />
      </div>

      <footer className={labCss.labFooter}>
        <span>THREEUI LAB / V0.1</span>
        <span>ARTICLE DECODE · PROXIMITY SPRING · PHASE LOADER · LIQUID METAL</span>
        <span>WEN YIFAN / 026</span>
      </footer>
    </main>
  );
}
