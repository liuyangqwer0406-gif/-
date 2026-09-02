"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { synthesisProjects } from "@/data/synthesis-projects";
import { LiquidLink } from "./liquid-link";
import { announceSynthesisRouteReady } from "./route-events";
import { createThreeUiDockController } from "./threeui-motion";
import { TransitionLink } from "./transition-link";

gsap.registerPlugin(useGSAP);

const capabilities = [
  ["BRAND SYSTEMS", "品牌视觉", "Identity, campaign and packaging built from one clear visual rule."],
  ["SPATIAL IMAGE", "三维视觉", "Material, light and modelling used to make the central idea visible."],
  ["INTERACTIVE STORY", "互动叙事", "Web, motion and AI-assisted prototypes shaped around sequence and participation."],
];

export function SynthesisHome() {
  const [active, setActive] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [entering, setEntering] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [criticalCoverReady, setCriticalCoverReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(() =>
    typeof document !== "undefined" && document.documentElement.dataset.sylvaSceneReady === "true"
  );
  const [sceneFallback, setSceneFallback] = useState(false);
  const routeReadyAnnounced = useRef(false);
  const activeRef = useRef(0);
  const workStage = useRef<HTMLDivElement>(null);
  const workIndex = useRef<HTMLDivElement>(null);
  const switchTimeline = useRef<gsap.core.Timeline | null>(null);
  const project = synthesisProjects[active];
  const outgoingProject = outgoing === null ? null : synthesisProjects[outgoing];
  const markSceneReady = useCallback(() => setSceneReady(true), []);

  useGSAP(() => {
    if (outgoing === null || !workStage.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const currentImage = workStage.current.querySelector<HTMLElement>(".synthesis-work__image-layer.is-current");
    const outgoingImage = workStage.current.querySelector<HTMLElement>(".synthesis-work__image-layer.is-outgoing");
    const currentCopy = workStage.current.querySelector<HTMLElement>(".synthesis-work__copy.is-current");
    const outgoingCopy = workStage.current.querySelector<HTMLElement>(".synthesis-work__copy.is-outgoing");
    if (!currentImage || !outgoingImage || !currentCopy || !outgoingCopy) return;

    switchTimeline.current?.kill();
    const sign = direction === "forward" ? 1 : -1;
    gsap.set(currentImage, {
      autoAlpha: 0,
      x: sign * 26,
      scale: 1.035,
      clipPath: sign > 0 ? "inset(0 0 0 12%)" : "inset(0 12% 0 0)",
    });
    gsap.set(outgoingImage, { autoAlpha: 1, x: 0, scale: 1, clipPath: "inset(0)" });
    gsap.set(currentCopy, { autoAlpha: 0, x: sign * 22 });
    gsap.set(outgoingCopy, { autoAlpha: 1, x: 0 });

    switchTimeline.current = gsap.timeline({
      defaults: { ease: "power3.out", overwrite: "auto" },
      onComplete: () => {
        switchTimeline.current = null;
        setEntering(false);
        setOutgoing(null);
      },
    });
    switchTimeline.current
      .to(outgoingImage, { autoAlpha: 0, x: -sign * 18, scale: .985, duration: .34 }, 0)
      .to(outgoingCopy, { autoAlpha: 0, x: -sign * 16, duration: .28 }, 0)
      .to(currentImage, { autoAlpha: 1, x: 0, scale: 1, clipPath: "inset(0)", duration: .54 }, .08)
      .to(currentCopy, { autoAlpha: 1, x: 0, duration: .42 }, .16);
  }, { scope: workStage, dependencies: [active, direction, outgoing], revertOnUpdate: false });

  useEffect(() => {
    window.addEventListener("sylva:ready", markSceneReady);
    return () => window.removeEventListener("sylva:ready", markSceneReady);
  }, [markSceneReady]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSceneFallback(true), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!criticalCoverReady || (!sceneReady && !sceneFallback && !reduced) || routeReadyAnnounced.current) return;
    routeReadyAnnounced.current = true;
    announceSynthesisRouteReady("/synthesis", !sceneReady);
  }, [criticalCoverReady, sceneReady, sceneFallback]);

  const selectProject = useCallback((index: number, animate = true) => {
    if (index === activeRef.current) return;

    switchTimeline.current?.kill();
    switchTimeline.current = null;

    const previous = activeRef.current;
    activeRef.current = index;
    const shouldAnimate = animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!shouldAnimate) {
      setOutgoing(null);
      setEntering(false);
      setCriticalCoverReady(false);
      setActive(index);
      return;
    }

    setOutgoing(previous);
    setDirection(index > previous ? "forward" : "backward");
    setEntering(true);
    setActive(index);
  }, []);

  useEffect(() => {
    const returnSlug = window.sessionStorage.getItem("synthesis:return-project");
    if (!returnSlug) return undefined;
    window.sessionStorage.removeItem("synthesis:return-project");
    const returnIndex = synthesisProjects.findIndex((item) => item.slug === returnSlug);
    if (returnIndex < 0) return undefined;
    const frame = window.requestAnimationFrame(() => selectProject(returnIndex, false));
    return () => window.cancelAnimationFrame(frame);
  }, [selectProject]);

  useEffect(() => () => {
    switchTimeline.current?.kill();
  }, []);

  useEffect(() => {
    const index = workIndex.current;
    if (!index) return undefined;
    return createThreeUiDockController(index);
  }, []);

  return (
    <main id="content" className="synthesis-main">
      <section className="synthesis-hero" aria-labelledby="synthesis-title">
        <div className="synthesis-hero__sticky">
          <div className="synthesis-hero__copy">
            <p>VISUAL DESIGN PORTFOLIO / 视觉设计作品集</p>
            <h1 id="synthesis-title"><span>VISUAL SYSTEMS</span><span>WITH A PULSE.</span></h1>
            <div className="synthesis-hero__foot">
              <p>Brand, packaging, spatial image and interactive work.<br />为真实内容建立清楚、可延展的视觉秩序。</p>
              <LiquidLink href="#work">VIEW SELECTED WORK</LiquidLink>
            </div>
          </div>
        </div>
      </section>

      <section className="synthesis-work" id="work" aria-labelledby="synthesis-work-title">
        <header className="synthesis-section-head">
          <h2 id="synthesis-work-title">SELECTED WORK</h2>
          <p>Seven cases across identity, production, spatial image and interactive experience.</p>
        </header>

        <div ref={workStage} className="synthesis-work__stage">
          <div className={`synthesis-work__image${entering ? " is-entering" : ""} is-${direction}`}>
            {outgoingProject && (
              <div className={`synthesis-work__image-layer is-outgoing${outgoingProject.cover.shape === "board" ? " is-board" : ""}`} key={outgoingProject.slug} aria-hidden="true">
                <Image src={outgoingProject.cover.src} alt="" fill sizes="(max-width: 800px) 100vw, 68vw" />
              </div>
            )}
            <div className={`synthesis-work__image-layer is-current${project.cover.shape === "board" ? " is-board" : ""}`} key={project.slug} data-transition-cover>
              <Image
                src={project.cover.src}
                alt={project.cover.alt}
                fill
                sizes="(max-width: 800px) 100vw, 68vw"
                priority={active === 0}
                onLoad={() => setCriticalCoverReady(true)}
                onError={() => setCriticalCoverReady(true)}
              />
            </div>
          </div>
          <div className="synthesis-work__card">
            <p>{project.discipline}<span>{project.year}</span></p>
            <div className={`synthesis-work__copy-stack${entering ? " is-entering" : ""} is-${direction}`}>
              {outgoingProject && (
                <div className="synthesis-work__copy is-outgoing" key={`${outgoingProject.slug}-copy`} aria-hidden="true">
                  <h3>{outgoingProject.title}</h3>
                  {outgoingProject.titleCn && <h4>{outgoingProject.titleCn}</h4>}
                  <p>{outgoingProject.intro}</p>
                </div>
              )}
              <div className="synthesis-work__copy is-current" key={`${project.slug}-copy`}>
                <h3>{project.title}</h3>
                {project.titleCn && <h4>{project.titleCn}</h4>}
                <p>{project.intro}</p>
              </div>
            </div>
            <div className="synthesis-work__action">
              <p><span>OPEN CASE STUDY</span><b>PROJECT {String(active + 1).padStart(2, "0")}</b></p>
              <LiquidLink
                href={`/synthesis/projects/${project.slug}`}
                variant="orb"
                ariaLabel={`Open case study: ${project.title}`}
              >
                OPEN CASE STUDY
              </LiquidLink>
            </div>
          </div>
        </div>

        <div ref={workIndex} className="synthesis-work__index" aria-label="Choose a project">
          {synthesisProjects.map((item, index) => (
            <button
              type="button"
              key={item.slug}
              data-threeui-dock-item
              className={active === index ? "is-active" : ""}
              aria-pressed={active === index}
              onPointerMove={(event) => {
                if (event.pointerType === "mouse") selectProject(index, true);
              }}
              onFocus={() => selectProject(index, false)}
              onClick={() => selectProject(index, true)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{item.title}</b>
              <em>{item.titleCn ?? item.discipline}</em>
              <i aria-hidden="true">↗</i>
            </button>
          ))}
        </div>
      </section>

      <section className="synthesis-capabilities" aria-labelledby="synthesis-capabilities-title">
        <header className="synthesis-section-head">
          <h2 id="synthesis-capabilities-title">CONNECTED PRACTICE</h2>
          <p>Three working fields, one visual method: reduce noise, define a rule, then test it across formats.</p>
        </header>
        <div className="synthesis-capabilities__grid">
          {capabilities.map(([title, cn, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <h4>{cn}</h4>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="synthesis-about" id="about" aria-labelledby="synthesis-about-title">
        <figure>
          <Image src="/portfolio-assets/about-portrait.webp" alt="Portrait of designer Wen Yifan" fill sizes="(max-width: 800px) 100vw, 44vw" />
          <figcaption>WEN YIFAN / HANGZHOU</figcaption>
        </figure>
        <div className="synthesis-about__copy">
          <p>ABOUT / 关于</p>
          <h2 id="synthesis-about-title">MAKE COMPLEX IDEAS CLEAR ENOUGH TO TRAVEL.</h2>
          <h3>让复杂的想法，清楚到可以继续生长。</h3>
          <div className="synthesis-about__body">
            <p>I work across brand identity, packaging, 3D image and interactive presentation. The goal is not more visual noise, but a system that stays coherent from the first image to the final application.</p>
            <p>我关注的是视觉如何跨越不同载体保持一致：从标志和排版，到包装、空间图像与网页节奏。</p>
          </div>
          <dl>
            <div><dt>BASE</dt><dd>Hangzhou, China</dd></div>
            <div><dt>FOCUS</dt><dd>Brand / Visual / 3D</dd></div>
            <div><dt>METHOD</dt><dd>System first, image led</dd></div>
          </dl>
          <TransitionLink className="synthesis-about__link" href="/synthesis/about">FULL PROFILE / 查看完整介绍 <span>↗</span></TransitionLink>
        </div>
      </section>

      <section className="synthesis-contact" id="contact" aria-labelledby="synthesis-contact-title">
        <div>
          <p>AVAILABLE FOR VISUAL DESIGN OPPORTUNITIES / 2026</p>
          <h2 id="synthesis-contact-title">LET&apos;S MAKE<br />THE IDEA VISIBLE.</h2>
          <h3>一起把想法做清楚。</h3>
        </div>
        <LiquidLink href="mailto:2742733283@qq.com" className="synthesis-contact__cta">START A CONVERSATION</LiquidLink>
        <footer>
          <span>WEN YIFAN © 2026</span>
          <TransitionLink href="/synthesis">BACK TO TOP ↑</TransitionLink>
        </footer>
      </section>
    </main>
  );
}
