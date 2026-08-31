"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectImage, SynthesisProject } from "@/data/synthesis-projects";
import { synthesisProjects } from "@/data/synthesis-projects";
import { LiquidLink } from "./liquid-link";
import { announceSynthesisRouteReady } from "./route-events";
import { TransitionLink } from "./transition-link";

const CASE_TITLE_DECODE = {
  duration: 560,
  scrambleLength: 10,
  preserveChance: 0.3,
  tailChance: 0.18,
} as const;
const CASE_TITLE_DECODE_POOL = "#%&@$/\\<>*+=~ABCDEFGHKMNPRSTUVWXYZ0123456789";

function DecodedCaseTitle({ text }: { text: string }) {
  const root = useRef<HTMLHeadingElement>(null);
  const revealed = useRef<HTMLSpanElement>(null);
  const noise = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const heading = root.current;
    const revealedText = revealed.current;
    const noiseText = noise.current;
    if (!heading || !revealedText || !noiseText) return;

    let frame = 0;
    let started = false;
    let loadObserver: MutationObserver | null = null;
    let routeObserver: MutationObserver | null = null;

    const renderFinal = () => {
      revealedText.textContent = text;
      noiseText.textContent = "";
    };

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealedText.textContent = "";
      noiseText.textContent = text;
    }

    const start = () => {
      if (started) return;
      started = true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        renderFinal();
        return;
      }

      const startTime = performance.now();
      const draw = (now: number) => {
        const progress = Math.min(1, Math.max(0, (now - startTime) / CASE_TITLE_DECODE.duration));
        const eased = 1 - Math.pow(1 - progress, 2);
        const visibleLength = Math.floor(eased * text.length);
        const scrambleEnd = Math.min(text.length, visibleLength + CASE_TITLE_DECODE.scrambleLength);
        let unsettled = "";

        for (let index = visibleLength; index < text.length; index += 1) {
          const character = text[index];
          if (character === " " || Math.random() < CASE_TITLE_DECODE.preserveChance) {
            unsettled += character;
          } else if (index < scrambleEnd || Math.random() < CASE_TITLE_DECODE.tailChance) {
            unsettled += CASE_TITLE_DECODE_POOL[(Math.random() * CASE_TITLE_DECODE_POOL.length) | 0];
          } else {
            unsettled += character;
          }
        }

        revealedText.textContent = text.slice(0, visibleLength);
        noiseText.textContent = unsettled;
        if (progress < 1) frame = window.requestAnimationFrame(draw);
        else renderFinal();
      };

      frame = window.requestAnimationFrame(draw);
    };

    const waitForRoute = () => {
      const routeState = document.documentElement.dataset.routeState;
      if (!routeState || routeState === "idle") {
        frame = window.requestAnimationFrame(start);
        return;
      }
      routeObserver = new MutationObserver(() => {
        if (document.documentElement.dataset.routeState !== "idle") return;
        routeObserver?.disconnect();
        routeObserver = null;
        frame = window.requestAnimationFrame(start);
      });
      routeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-route-state"] });
    };

    const site = heading.closest(".synthesis-site");
    if (!site || site.classList.contains("is-loaded")) {
      waitForRoute();
    } else {
      loadObserver = new MutationObserver(() => {
        if (!site.classList.contains("is-loaded")) return;
        loadObserver?.disconnect();
        loadObserver = null;
        waitForRoute();
      });
      loadObserver.observe(site, { attributes: true, attributeFilter: ["class"] });
    }

    return () => {
      window.cancelAnimationFrame(frame);
      loadObserver?.disconnect();
      routeObserver?.disconnect();
    };
  }, [text]);

  return (
    <h1 ref={root} id="case-title" aria-label={text}>
      <span className="case-title-decode" aria-hidden="true">
        <span ref={revealed}>{text}</span>
        <span ref={noise} className="case-title-decode__noise" />
      </span>
    </h1>
  );
}

function ProjectFigure({ item, onOpen }: { item: ProjectImage; onOpen: (item: ProjectImage, trigger: HTMLButtonElement) => void }) {
  const shapeClass = item.shape && item.shape !== "wide" ? ` case-figure--${item.shape}` : "";
  return (
    <figure className={`case-figure${shapeClass}`}>
      <button type="button" onClick={(event) => onOpen(item, event.currentTarget)} aria-label={`Enlarge image: ${item.caption}`}>
        <span className="case-figure__media">
          <Image src={item.src} alt={item.alt} fill sizes="(max-width: 800px) 100vw, 50vw" />
        </span>
        <span className="case-figure__open" aria-hidden="true">VIEW ↗</span>
      </button>
      <figcaption><b>{item.caption}</b><span>{item.note}</span></figcaption>
    </figure>
  );
}

export function ProjectDetail({ project }: { project: SynthesisProject }) {
  const [lightbox, setLightbox] = useState<ProjectImage | null>(null);
  const [lightboxClosing, setLightboxClosing] = useState(false);
  const [lightboxOpening, setLightboxOpening] = useState(false);
  const lightboxClose = useRef<HTMLButtonElement>(null);
  const lightboxTrigger = useRef<HTMLButtonElement | null>(null);
  const lightboxCloseTimer = useRef<number | null>(null);
  const lightboxOpenFrame = useRef(0);
  const readySlug = useRef<string | null>(null);
  const currentIndex = synthesisProjects.findIndex((item) => item.slug === project.slug);
  const previous = synthesisProjects[(currentIndex - 1 + synthesisProjects.length) % synthesisProjects.length];
  const next = synthesisProjects[(currentIndex + 1) % synthesisProjects.length];
  const hasLightbox = Boolean(lightbox);
  const markRouteReady = useCallback((degraded = false) => {
    if (readySlug.current === project.slug) return;
    readySlug.current = project.slug;
    announceSynthesisRouteReady(`/synthesis/projects/${project.slug}`, degraded);
  }, [project.slug]);

  const closeLightbox = useCallback(() => {
    if (!lightbox || lightboxClosing) return;
    if (lightboxCloseTimer.current !== null) window.clearTimeout(lightboxCloseTimer.current);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLightboxOpening(false);
      setLightboxClosing(false);
      setLightbox(null);
      return;
    }

    setLightboxClosing(true);
    lightboxCloseTimer.current = window.setTimeout(() => {
      setLightbox(null);
      setLightboxClosing(false);
      lightboxCloseTimer.current = null;
    }, 220);
  }, [lightbox, lightboxClosing]);

  const closeLightboxRef = useRef(closeLightbox);
  useEffect(() => {
    closeLightboxRef.current = closeLightbox;
  }, [closeLightbox]);

  useEffect(() => {
    if (!hasLightbox) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightboxRef.current();
      if (event.key === "Tab") {
        event.preventDefault();
        lightboxClose.current?.focus();
      }
    };
    document.body.classList.add("has-lightbox");
    window.addEventListener("keydown", onKey);
    const focusFrame = requestAnimationFrame(() => lightboxClose.current?.focus());
    return () => {
      cancelAnimationFrame(focusFrame);
      cancelAnimationFrame(lightboxOpenFrame.current);
      document.body.classList.remove("has-lightbox");
      window.removeEventListener("keydown", onKey);
      lightboxTrigger.current?.focus();
    };
  }, [hasLightbox]);

  useEffect(() => () => {
    if (lightboxCloseTimer.current !== null) window.clearTimeout(lightboxCloseTimer.current);
    window.cancelAnimationFrame(lightboxOpenFrame.current);
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".case-page .case-chapter, .case-page .case-closing"));
    if (!nodes.length) return;

    nodes.forEach((node) => { node.dataset.reveal = "true"; });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => { node.dataset.visible = "true"; });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute("data-visible", "true");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "-12% 0px -12% 0px", threshold: 0.05 });

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [project.slug]);

  const openLightbox = (item: ProjectImage, trigger: HTMLButtonElement) => {
    if (lightboxCloseTimer.current !== null) window.clearTimeout(lightboxCloseTimer.current);
    lightboxTrigger.current = trigger;
    setLightboxClosing(false);
    setLightboxOpening(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setLightbox(item);
    lightboxOpenFrame.current = window.requestAnimationFrame(() => setLightboxOpening(false));
  };

  return (
    <main id="content" className="case-page">
      <section className="case-hero" aria-labelledby="case-title">
        <div className="case-hero__heading">
          <div className="case-hero__meta">
            <p>{project.discipline}</p>
            <span>{String(currentIndex + 1).padStart(2, "0")} / {String(synthesisProjects.length).padStart(2, "0")}</span>
          </div>
          <DecodedCaseTitle text={project.title} />
          {project.titleCn && <h2>{project.titleCn}</h2>}
        </div>
        <figure className={`case-hero__media${project.cover.shape === "board" ? " case-hero__media--board" : ""}`} data-transition-cover>
          <Image
            src={project.cover.src}
            alt={project.cover.alt}
            fill
            priority
            sizes="100vw"
            onLoad={() => markRouteReady(false)}
            onError={() => markRouteReady(true)}
          />
          <figcaption><span>{project.cover.caption}</span><span>{project.cover.note}</span></figcaption>
        </figure>
      </section>

      <section className="case-intro" aria-label="Project overview">
        <div className="case-intro__lead">
          <p>{project.intro}</p>
          <p>{project.introCn}</p>
        </div>
        <dl>
          <div><dt>ROLE</dt><dd>{project.role}</dd></div>
          <div><dt>SCOPE</dt><dd>{project.scope}</dd></div>
          <div><dt>STATUS</dt><dd>{project.status}</dd></div>
          <div><dt>YEAR</dt><dd>{project.year}</dd></div>
        </dl>
      </section>

      {project.chapters.map((chapter, chapterIndex) => (
        <section className="case-chapter" key={chapter.title} aria-labelledby={`${project.slug}-chapter-${chapterIndex}`}>
          <header>
            <div>
              <span>{String(chapterIndex + 1).padStart(2, "0")}</span>
              <h2 id={`${project.slug}-chapter-${chapterIndex}`}>{chapter.title}</h2>
              <h3>{chapter.titleCn}</h3>
            </div>
            <p>{chapter.body}</p>
          </header>
          <div className="case-gallery">
            {chapter.images.map((item) => <ProjectFigure item={item} onOpen={openLightbox} key={item.src} />)}
          </div>
        </section>
      ))}

      <section className="case-closing" aria-labelledby="case-closing-title">
        <div>
          <p>RESULT / BOUNDARY</p>
          <h2 id="case-closing-title">WHAT IS DONE.<br />WHAT REMAINS TRUE.</h2>
        </div>
        <div>
          <p>{project.closing}</p>
          <p>{project.closingCn}</p>
        </div>
        <LiquidLink href="mailto:2742733283@qq.com">DISCUSS THIS WORK</LiquidLink>
      </section>

      <nav className="case-navigation" aria-label="Project navigation">
        <TransitionLink href={`/synthesis/projects/${previous.slug}`} data-transition-label={`${previous.title} / PREVIOUS PROJECT`}><span>← PREVIOUS</span><b>{previous.title}</b></TransitionLink>
        <TransitionLink href="/synthesis#work" data-transition-label="PROJECT INDEX / ALL WORK"><span>ALL WORK</span><b>PROJECT INDEX</b></TransitionLink>
        <TransitionLink href={`/synthesis/projects/${next.slug}`} data-transition-label={`${next.title} / NEXT PROJECT`}><span>NEXT →</span><b>{next.title}</b></TransitionLink>
      </nav>

      {lightbox && (
        <div className={`case-lightbox${lightboxOpening ? " is-opening" : ""}${lightboxClosing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-label={`Image preview: ${lightbox.caption}`} onClick={closeLightbox}>
          <button ref={lightboxClose} type="button" onClick={closeLightbox} aria-label="Close image preview">CLOSE ×</button>
          <div onClick={(event) => event.stopPropagation()}>
            <Image src={lightbox.src} alt={lightbox.alt} fill sizes="96vw" />
          </div>
          <p>{lightbox.caption} / {lightbox.note}</p>
        </div>
      )}
    </main>
  );
}
