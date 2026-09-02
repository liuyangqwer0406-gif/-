"use client";

import Image from "next/image";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { ProjectImage, ProjectMotionPoster, ProjectMotionSection, SynthesisProject } from "@/data/synthesis-projects";
import { synthesisProjects } from "@/data/synthesis-projects";
import { LiquidLink } from "./liquid-link";
import { announceSynthesisRouteReady } from "./route-events";
import { TransitionLink } from "./transition-link";

function RevealedCaseTitle({ text }: { text: string }) {
  const root = useRef<HTMLHeadingElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const heading = root.current;
    if (!heading) return;

    let frame = 0;
    let started = false;
    let loadObserver: MutationObserver | null = null;
    let routeObserver: MutationObserver | null = null;

    const start = () => {
      if (started) return;
      started = true;
      frame = window.requestAnimationFrame(() => setVisible(true));
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
    <h1 ref={root} id="case-title">
      <span className={`case-title-reveal${visible ? " is-visible" : ""}`}>{text}</span>
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

function MotionPoster({ item }: { item: ProjectMotionPoster }) {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [inView, setInView] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node || !("IntersectionObserver" in window)) {
      const frame = window.requestAnimationFrame(() => {
        setInView(true);
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setShouldLoad(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) setShouldLoad(true);
    }, { rootMargin: "18% 0px", threshold: 0.05 });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const syncPlayback = useCallback(() => {
    const media = video.current;
    if (!media || !shouldLoad || unavailable) return;

    if (inView && !document.hidden && !manualPaused && !reducedMotion) {
      void media.play().catch(() => setPlaying(false));
    } else {
      media.pause();
    }
  }, [inView, manualPaused, reducedMotion, shouldLoad, unavailable]);

  useEffect(() => {
    if (shouldLoad) video.current?.load();
  }, [shouldLoad]);

  useEffect(() => {
    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    return () => document.removeEventListener("visibilitychange", syncPlayback);
  }, [syncPlayback]);

  const togglePlayback = () => {
    const media = video.current;
    if (!media || unavailable) return;
    setShouldLoad(true);

    if (!media.paused) {
      setManualPaused(true);
      media.pause();
      return;
    }

    setManualPaused(false);
    void media.play().catch(() => setPlaying(false));
  };

  return (
    <figure ref={root} className={`motion-poster motion-poster--${item.placement}`}>
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={`${playing ? "Pause" : "Play"} motion poster: ${item.caption}`}
        aria-pressed={playing}
        disabled={unavailable}
      >
        <span className="motion-poster__media">
          <video
            ref={video}
            poster={item.poster}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            onCanPlay={syncPlayback}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setUnavailable(true)}
          >
            {shouldLoad && <source src={item.src} type="video/mp4" />}
          </video>
        </span>
        <span className="motion-poster__control" aria-hidden="true">
          {unavailable ? "STILL" : playing ? "PAUSE" : "PLAY"}
        </span>
      </button>
      <figcaption><b>{item.caption}</b><span>{item.note}</span></figcaption>
    </figure>
  );
}

function MotionSection({ section }: { section: ProjectMotionSection }) {
  const lead = section.posters.find((item) => item.placement === "lead");
  const portrait = section.posters.find((item) => item.placement === "portrait");
  const stack = section.posters.filter((item) => item.placement === "stack");

  return (
    <section className="case-motion" aria-labelledby="case-motion-title">
      <header>
        <div>
          <p>MOTION / 10 SEC LOOPS</p>
          <h2 id="case-motion-title">{section.title}</h2>
          <h3>{section.titleCn}</h3>
        </div>
        <p>{section.body}</p>
      </header>
      <div className="case-motion__gallery">
        {lead && <MotionPoster item={lead} />}
        <div className="case-motion__split">
          {portrait && <MotionPoster item={portrait} />}
          <div className="case-motion__stack">
            {stack.map((item) => <MotionPoster item={item} key={item.src} />)}
          </div>
        </div>
      </div>
    </section>
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
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".case-page .case-chapter, .case-page .case-motion, .case-page .case-closing"));
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
          <div className="case-hero__meta"><p>{project.discipline}</p></div>
          <RevealedCaseTitle text={project.title} />
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
        <Fragment key={chapter.title}>
          <section className="case-chapter" aria-labelledby={`${project.slug}-chapter-${chapterIndex}`}>
            <header>
              <div>
                <h2 id={`${project.slug}-chapter-${chapterIndex}`}>{chapter.title}</h2>
                <h3>{chapter.titleCn}</h3>
              </div>
              <p>{chapter.body}</p>
            </header>
            <div className="case-gallery">
              {chapter.images.map((item) => <ProjectFigure item={item} onOpen={openLightbox} key={item.src} />)}
            </div>
          </section>
          {chapterIndex === 0 && project.motion && <MotionSection section={project.motion} />}
        </Fragment>
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
