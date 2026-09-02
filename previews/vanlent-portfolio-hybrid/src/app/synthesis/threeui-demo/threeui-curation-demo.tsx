"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { synthesisProjects } from "@/data/synthesis-projects";
import { announceSynthesisRouteReady } from "@/components/synthesis/route-events";
import { LiquidLink } from "@/components/synthesis/liquid-link";
import { SylvaLivingWorldScene } from "@/components/synthesis/sylva-living-world-scene";
import { TransitionLink } from "@/components/synthesis/transition-link";
import demoCss from "./threeui-curation-demo.module.css";

const practices = [
  {
    id: "brand",
    index: "01",
    title: "BRAND SYSTEMS",
    titleCn: "品牌系统",
    body: "Identity, packaging and campaign images held together by one repeatable visual rule.",
  },
  {
    id: "image",
    index: "02",
    title: "SPATIAL IMAGE",
    titleCn: "三维视觉",
    body: "Material, modelling and controlled light used to make the central idea physically legible.",
  },
  {
    id: "interaction",
    index: "03",
    title: "INTERACTIVE STORY",
    titleCn: "互动叙事",
    body: "Motion and participation arranged as a reading sequence instead of decorative interface noise.",
  },
] as const;

const filmstripProjects = synthesisProjects.slice(0, 6);

export function ThreeUiCurationDemo() {
  const revealRoot = useRef<HTMLElement>(null);
  const filmstrip = useRef<HTMLDivElement>(null);
  const orbField = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, scrollLeft: 0, moved: false });
  const scrollFrame = useRef(0);
  const [activeFrame, setActiveFrame] = useState(0);
  const [activePractice, setActivePractice] = useState<(typeof practices)[number]["id"]>("brand");

  useEffect(() => {
    announceSynthesisRouteReady("/synthesis/threeui-demo");
  }, []);

  useEffect(() => {
    const root = revealRoot.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (typeof IntersectionObserver === "undefined") {
      nodes.forEach((node) => { node.dataset.visible = "true"; });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).dataset.visible = "true";
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12%", threshold: 0.08 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const updateActiveFrame = () => {
    const rail = filmstrip.current;
    if (!rail) return;
    const cards = Array.from(rail.querySelectorAll<HTMLElement>("[data-film-frame]"));
    if (!cards.length) return;
    const center = rail.scrollLeft + rail.clientWidth * 0.5;
    let next = 0;
    let distance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth * 0.5;
      const nextDistance = Math.abs(center - cardCenter);
      if (nextDistance < distance) {
        distance = nextDistance;
        next = index;
      }
    });
    setActiveFrame(next);
  };

  const handleFilmstripScroll = () => {
    if (scrollFrame.current) return;
    scrollFrame.current = window.requestAnimationFrame(() => {
      scrollFrame.current = 0;
      updateActiveFrame();
    });
  };

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0 || !filmstrip.current) return;
    dragStart.current = { x: event.clientX, scrollLeft: filmstrip.current.scrollLeft, moved: false };
    filmstrip.current.dataset.dragging = "true";
    filmstrip.current.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rail = filmstrip.current;
    if (!rail?.hasPointerCapture(event.pointerId)) return;
    const distance = event.clientX - dragStart.current.x;
    if (Math.abs(distance) > 5) dragStart.current.moved = true;
    rail.scrollLeft = dragStart.current.scrollLeft - distance;
  };

  const handleDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rail = filmstrip.current;
    if (!rail?.hasPointerCapture(event.pointerId)) return;
    rail.releasePointerCapture(event.pointerId);
    delete rail.dataset.dragging;
  };

  const shiftFilmstrip = (direction: -1 | 1) => {
    const rail = filmstrip.current;
    const card = rail?.querySelector<HTMLElement>("[data-film-frame]");
    if (!rail || !card) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({
      left: rail.scrollLeft + direction * (card.offsetWidth + 16),
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const handleOrbMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !orbField.current) return;
    const rect = orbField.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    orbField.current.style.setProperty("--orb-x", `${(x * 14).toFixed(2)}px`);
    orbField.current.style.setProperty("--orb-y", `${(y * 14).toFixed(2)}px`);
  };

  const resetOrb = () => {
    orbField.current?.style.setProperty("--orb-x", "0px");
    orbField.current?.style.setProperty("--orb-y", "0px");
  };

  const selectedPractice = practices.find((practice) => practice.id === activePractice) ?? practices[0];

  return (
    <main ref={revealRoot} className={demoCss.root} id="content">
      <aside className={demoCss.demoFlag} aria-label="Independent preview">
        <span>THREEUI CURATION</span>
        <span>INDEPENDENT DEMO / NOT LIVE</span>
      </aside>

      <section className={demoCss.hero} aria-labelledby="threeui-demo-title">
        <div className={demoCss.heroSticky}>
          <SylvaLivingWorldScene
            className={demoCss.heroScene}
            variant="living-green"
          />
          <div className={demoCss.heroCoordinates} aria-hidden="true">
            <span>30.2741° N</span>
            <span>POINTER / TOUCH ENABLED</span>
            <span>120.1551° E</span>
          </div>
          <div className={demoCss.heroCopy}>
            <p>VISUAL DESIGN / 3D IMAGE / INTERACTION</p>
            <h1 id="threeui-demo-title"><span>SYSTEMS THAT</span><span>RESPOND.</span></h1>
            <div>
              <p>Selected interaction studies rebuilt around an existing portfolio language.<br />从已有作品出发，让界面回应内容，而不是盖过内容。</p>
              <LiquidLink
                href="#editorial-intro"
                className={demoCss.heroLiquidButton}
                ariaLabel="Enter the ThreeUI study"
              >
                ENTER THE STUDY
              </LiquidLink>
            </div>
          </div>
        </div>
      </section>

      <section className={demoCss.editorial} id="editorial-intro" aria-labelledby="editorial-title">
        <header data-reveal>
          <span>01 / EDITORIAL INTRO</span>
          <span>THREEUI PATTERN / ADAPTED</span>
        </header>
        <div className={demoCss.editorialStatement}>
          <p id="editorial-title" data-reveal>THE WORK BEGINS<br />WITH A RULE,</p>
          <p data-reveal>THEN MOVES THROUGH<br />IMAGE, MATERIAL</p>
          <p data-reveal>AND INTERACTION.</p>
        </div>
        <div className={demoCss.editorialFoot} data-reveal>
          <p>我的工作横跨品牌、包装、三维视觉与网页原型，但目标始终一致：先建立清晰的视觉规则，再让它进入不同媒介。</p>
          <p>The interface stays quiet so hierarchy, process and finished images can carry the argument.</p>
        </div>
      </section>

      <section className={demoCss.filmSection} aria-labelledby="filmstrip-title">
        <header className={demoCss.sectionHeader} data-reveal>
          <div><span>02 / CHARACTER FILMSTRIP</span><span>DRAG / SWIPE / USE ARROWS</span></div>
          <h2 id="filmstrip-title">THE ARCHIVE<br />IN MOTION.</h2>
          <div className={demoCss.filmControls}>
            <span>{String(activeFrame + 1).padStart(2, "0")} / {String(filmstripProjects.length).padStart(2, "0")}</span>
            <button type="button" onClick={() => shiftFilmstrip(-1)} aria-label="Previous project">←</button>
            <button type="button" onClick={() => shiftFilmstrip(1)} aria-label="Next project">→</button>
          </div>
        </header>

        <div
          ref={filmstrip}
          className={demoCss.filmstrip}
          onScroll={handleFilmstripScroll}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          onClickCapture={(event) => {
            if (dragStart.current.moved) event.preventDefault();
            dragStart.current.moved = false;
          }}
        >
          {filmstripProjects.map((project, index) => (
            <article key={project.slug} data-film-frame data-active={index === activeFrame || undefined}>
              <TransitionLink href={`/synthesis/projects/${project.slug}`} aria-label={`Open case study: ${project.title}`}>
                <figure data-transition-cover>
                  <Image
                    src={project.cover.src}
                    alt={project.cover.alt}
                    fill
                    sizes="(max-width: 720px) 82vw, 68vw"
                    priority={index === 0}
                    draggable={false}
                  />
                  <figcaption><span>{project.cover.caption}</span><span>{project.cover.note}</span></figcaption>
                </figure>
                <div className={demoCss.frameCopy}>
                  <span>{String(index + 1).padStart(2, "0")} / {project.year}</span>
                  <div><h3>{project.title}</h3>{project.titleCn && <p>{project.titleCn}</p>}</div>
                  <span>OPEN ↗</span>
                </div>
              </TransitionLink>
            </article>
          ))}
        </div>
      </section>

      <section className={demoCss.orbs} aria-labelledby="orbs-title">
        <header className={demoCss.sectionHeader} data-reveal>
          <div><span>03 / BRAND ORBS</span><span>CSS / EVENT-DRIVEN / NO EXTRA WEBGL</span></div>
          <h2 id="orbs-title">CONNECTED<br />PRACTICE.</h2>
        </header>
        <div className={demoCss.orbGrid}>
          <div
            ref={orbField}
            className={demoCss.orbField}
            onPointerMove={handleOrbMove}
            onPointerLeave={resetOrb}
            aria-label="Choose a design practice"
          >
            <div className={demoCss.orbitStage} aria-hidden="true">
              <i className={demoCss.orbitOuter} /><i className={demoCss.orbitMid} /><i className={demoCss.orbitInner} />
              <b className={demoCss.orbitCore}>WYF<small>026</small></b>
            </div>
            {practices.map((practice) => (
              <button
                key={practice.id}
                type="button"
                className={demoCss[`orbNode${practice.index}`]}
                data-active={practice.id === activePractice || undefined}
                onClick={() => setActivePractice(practice.id)}
              >
                <span>{practice.index}</span>{practice.title}
              </button>
            ))}
          </div>
          <article className={demoCss.orbCopy} aria-live="polite">
            <span>{selectedPractice.index} / 03</span>
            <div key={selectedPractice.id}>
              <h3>{selectedPractice.title}</h3>
              <h4>{selectedPractice.titleCn}</h4>
              <p>{selectedPractice.body}</p>
            </div>
            <p>SELECT A NODE / 点击节点切换</p>
          </article>
        </div>
      </section>

      <footer className={demoCss.contact} aria-labelledby="contact-demo-title">
        <div className={demoCss.contactMeta} data-reveal>
          <span>04 / CONTACT FOOTER</span>
          <span>HANGZHOU / CN</span>
        </div>
        <h2 id="contact-demo-title" data-reveal>MAKE THE NEXT<br />IDEA VISIBLE.</h2>
        <div className={demoCss.contactFoot} data-reveal>
          <p>Available for visual identity, packaging, 3D image and interactive portfolio collaborations.<br />开放视觉设计、包装、三维视觉与互动作品合作。</p>
          <a href="mailto:2742733283@qq.com">2742733283@QQ.COM <span aria-hidden="true">↗</span></a>
        </div>
        <div className={demoCss.contactEnd}>
          <TransitionLink href="/synthesis">RETURN TO CURRENT HOME</TransitionLink>
          <span>THREEUI CURATION DEMO / 2026</span>
        </div>
      </footer>
    </main>
  );
}
