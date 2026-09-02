"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { ParticleOrb } from "@/components/sites/vanlent-dev-4f352424/root-8a5edab2/particle-orb";
import { SiteShell } from "@/components/sites/vanlent-dev-4f352424/root-8a5edab2/site-shell";
import type { Capability, Project } from "@/components/sites/vanlent-dev-4f352424/root-8a5edab2/site-types";
import "./hybrid.css";

const projects: Project[] = [
  {
    id: "roku",
    name: "ROKU IKITION",
    discipline: "Brand / Packaging / 3D",
    year: "2025",
    image: "/portfolio-assets/dad-cover.jpg",
    alt: "ROKU IKITION brand and packaging project cover",
    description: "A graphic identity built across packaging, campaign imagery and a three-dimensional product world.",
  },
  {
    id: "packaging",
    name: "PACKAGING DESIGN",
    discipline: "Commercial packaging / Production",
    year: "2026",
    image: "/portfolio-assets/packaging-cover.jpg",
    alt: "Commercial packaging design project cover",
    description: "Packaging systems shaped for real production constraints, shelf rhythm and clear product communication.",
  },
  {
    id: "runes",
    name: "RUNES ATTACK AND DEFENSE",
    secondary: "符文攻防战",
    discipline: "Esports identity",
    year: "2026",
    image: "/portfolio-assets/thesis-cover.jpg",
    alt: "Runes Attack and Defense esports identity project cover",
    description: "An esports visual system that turns game logic into an expandable identity, motion and event language.",
  },
  {
    id: "jiangkou",
    name: "JIANGKOU SUNKEN SILVER",
    secondary: "江口沉银",
    discipline: "Cultural visual / 3D",
    year: "2024",
    image: "/portfolio-assets/jiangkou-cover-v2.jpg",
    alt: "Jiangkou Sunken Silver cultural visual and 3D project cover",
    description: "A cultural image study translating archaeological material into a contemporary three-dimensional narrative.",
  },
  {
    id: "reverie",
    name: "REVERIE",
    discipline: "Immersive web experience",
    year: "2026",
    image: "/portfolio-assets/reverie-cover.jpg",
    alt: "Reverie immersive web experience project cover",
    description: "An atmospheric web experience where image, typography and restrained interaction move as one system.",
  },
];

const capabilities: Capability[] = [
  {
    id: "brand",
    kicker: "01 / IDENTITY · CAMPAIGN · PACKAGING",
    title: "BRAND SYSTEMS",
    secondary: "品牌视觉",
    description: "Identity systems that stay coherent from a key visual to packaging and campaign applications.",
  },
  {
    id: "spatial",
    kicker: "02 / MODELING · MATERIAL · KEY VISUAL",
    title: "SPATIAL IMAGE",
    secondary: "三维视觉",
    description: "Three-dimensional image making used to clarify material, atmosphere and the central visual idea.",
  },
  {
    id: "interactive",
    kicker: "03 / WEB · MOTION · AIGC PROTOTYPING",
    title: "INTERACTIVE STORY",
    secondary: "互动叙事",
    description: "Web, motion and AIGC-assisted prototypes that give a visual system timing, sequence and participation.",
  },
];

function pad(number: number) {
  return String(number + 1).padStart(2, "0");
}

export default function HybridPage() {
  const [activeProject, setActiveProject] = useState(0);
  const [activeCapability, setActiveCapability] = useState(0);
  const [formNote, setFormNote] = useState("Demo form — this interface does not send or store entries.");
  const project = projects[activeProject];
  const capability = capabilities[activeCapability];

  const stepProject = (direction: number) => {
    setActiveProject((current) => (current + direction + projects.length) % projects.length);
  };

  const handleDemoSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormNote("Preview only. Nothing was sent — open the current portfolio to make contact.");
  };

  return (
    <SiteShell mode="hybrid">
      <section className="hybrid-hero" aria-labelledby="hybrid-hero-title">
        <div className="hybrid-hero__sticky">
          <div className="hybrid-hero__anchors" aria-label="Portfolio profile">
            <p><span>01</span> BRAND + CAMPAIGN DESIGNER</p>
            <p><span>02</span> HANGZHOU / CHINA</p>
            <p><span>03</span> SELECTED WORK 2024—2026</p>
            <p><span>04</span> AVAILABLE 2026</p>
          </div>

          <ParticleOrb mode="hybrid" className="hybrid-hero__orb" label="Scroll-responsive orange particle sphere" />

          <div className="hybrid-hero__title-wrap">
            <p className="hybrid-eyebrow">VISUAL DESIGN PORTFOLIO / 视觉设计作品集</p>
            <h1 id="hybrid-hero-title">
              <span>VISUAL SYSTEMS</span>
              <span>BUILT TO MOVE.</span>
            </h1>
            <p className="hybrid-hero__support">从品牌识别、三维视觉到互动叙事，建立清楚、可延展的视觉系统。</p>
          </div>

          <a className="hybrid-hero__scroll" href="#work"><span>SCROLL TO PROJECTS</span><i aria-hidden="true" /></a>
        </div>
      </section>

      <section className="hybrid-work hybrid-frame" id="work" aria-labelledby="work-title">
        <header className="hybrid-section-head">
          <p>CHAPTER 01 / CASE INDEX</p>
          <h2 id="work-title">SELECTED WORK</h2>
          <p>作品选择 / 2024—2026</p>
        </header>

        <div className="work-stage">
          <div className="work-stage__media" key={project.id}>
            <Image src={project.image} alt={project.alt} fill sizes="(max-width: 720px) 100vw, 66vw" priority={activeProject === 0} />
            <span className="work-stage__counter" aria-hidden="true">{pad(activeProject)} / {String(projects.length).padStart(2, "0")}</span>
          </div>

          <div className="work-stage__copy" aria-live="polite">
            <div className="work-stage__meta">
              <p>{project.discipline}</p>
              <p>{project.year}</p>
            </div>
            <h3 key={`${project.id}-title`} data-active-project>{project.name}</h3>
            {project.secondary && <p className="work-stage__secondary">{project.secondary}</p>}
            <p className="work-stage__description">{project.description}</p>
            <div className="work-stage__controls">
              <button type="button" onClick={() => stepProject(-1)} aria-label="Previous project">PREV <span aria-hidden="true">←</span></button>
              <button type="button" data-next-project onClick={() => stepProject(1)} aria-label="Next project">NEXT <span aria-hidden="true">→</span></button>
            </div>
          </div>
        </div>

        <div className="work-index" aria-label="Choose a project">
          {projects.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className={index === activeProject ? "is-active" : ""}
              aria-pressed={index === activeProject}
              aria-label={`Show project ${index + 1}: ${item.name}`}
              onClick={() => setActiveProject(index)}
            >
              <span>{pad(index)}</span>
              <b>{item.name}</b>
              <i aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="hybrid-capabilities hybrid-frame" id="services" aria-labelledby="capabilities-title">
        <header className="hybrid-section-head">
          <p>CHAPTER 02 / WORKING RANGE</p>
          <h2 id="capabilities-title">CAPABILITIES</h2>
          <p>能力方向 / THREE CONNECTED FIELDS</p>
        </header>

        <div className="capability-stage">
          <div className="capability-stage__nav" role="tablist" aria-label="Capability groups">
            {capabilities.map((item, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={index === activeCapability}
                aria-controls="capability-panel"
                id={`capability-${item.id}`}
                key={item.id}
                className={index === activeCapability ? "is-active" : ""}
                onClick={() => setActiveCapability(index)}
              >
                <span>{pad(index)}</span>
                <b>{item.title}</b>
                <em>{item.secondary}</em>
              </button>
            ))}
          </div>

          <div className="capability-stage__visual">
            <ParticleOrb mode="hybrid" phase={activeCapability * 1.7} label={`${capability.title} particle phase`} />
            <span>{capability.id.toUpperCase()}</span>
          </div>

          <div className="capability-stage__panel" role="tabpanel" id="capability-panel" aria-labelledby={`capability-${capability.id}`} key={capability.id}>
            <p>{capability.kicker}</p>
            <h3>{capability.title}</h3>
            <h4>{capability.secondary}</h4>
            <p>{capability.description}</p>
          </div>
        </div>

        <dl className="proof-grid" aria-label="Portfolio facts">
          <div><dt>06</dt><dd>CASES</dd></div>
          <div><dt>03</dt><dd>DISCIPLINES</dd></div>
          <div><dt>2024—26</dt><dd>WORK PERIOD</dd></div>
        </dl>
      </section>

      <section className="hybrid-about" id="about" aria-labelledby="about-title">
        <div className="hybrid-about__image">
          <Image src="/portfolio-assets/about-portrait.webp" alt="Portrait of designer Wen Yifan" fill sizes="(max-width: 720px) 100vw, 50vw" />
          <p>WEN YIFAN / VISUAL DESIGNER</p>
        </div>
        <div className="hybrid-about__copy">
          <p className="hybrid-eyebrow">CHAPTER 03 / ABOUT</p>
          <h2 id="about-title">DESIGN IS A WAY OF MAKING COMPLEX THINGS CLEAR.</h2>
          <p className="hybrid-about__statement">设计是让复杂事物变清楚。</p>
          <p>I work across brand, campaign, packaging, 3D image and interactive presentation. My focus is not adding more visual noise, but finding the structure that lets an idea travel clearly across formats.</p>
          <p>以视觉系统为核心，在品牌、包装、三维与网页之间建立一致的叙事，让概念能够被看见、被理解，也能继续生长。</p>
          <dl>
            <div><dt>BASE</dt><dd>Hangzhou, China</dd></div>
            <div><dt>FOCUS</dt><dd>Brand / Visual / 3D</dd></div>
            <div><dt>METHOD</dt><dd>System first, image led</dd></div>
          </dl>
        </div>
      </section>

      <section className="hybrid-contact hybrid-frame" id="contact" aria-labelledby="contact-title">
        <header className="hybrid-section-head">
          <p>CHAPTER 04 / CONTACT</p>
          <p>HANGZHOU / AVAILABLE 2026</p>
        </header>

        <div className="hybrid-contact__lead">
          <p>BRAND · VISUAL · 3D</p>
          <h2 id="contact-title">LET&apos;S BUILD<br />SOMETHING CLEAR.</h2>
          <p>一起把想法做清楚。</p>
        </div>

        <div className="hybrid-contact__details">
          <p>Available for brand systems, visual campaigns and 3D-led image making.</p>
          <p>目前位于杭州，欢迎通过正式作品集中的联系方式继续交流。</p>
          <a href="http://127.0.0.1:4173/" target="_blank" rel="noreferrer">OPEN CURRENT PORTFOLIO <span aria-hidden="true">↗</span></a>
        </div>

        <form className="hybrid-contact__form" onSubmit={handleDemoSubmit}>
          <label>
            <span>YOUR NAME / 姓名</span>
            <input name="name" autoComplete="name" placeholder="Name" />
          </label>
          <label>
            <span>PROJECT TYPE / 项目类型</span>
            <input name="project" placeholder="Brand, visual or 3D" />
          </label>
          <label>
            <span>SHORT NOTE / 简要说明</span>
            <textarea name="message" rows={4} placeholder="What would you like to make?" />
          </label>
          <button type="submit">CHECK DEMO FORM <span aria-hidden="true">→</span></button>
          <p id="contact-note" role="status">{formNote}</p>
        </form>

        <footer className="hybrid-footer">
          <p>WEN YIFAN © 2026</p>
          <a href="#top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>BACK TO TOP ↑</a>
        </footer>
      </section>
    </SiteShell>
  );
}
