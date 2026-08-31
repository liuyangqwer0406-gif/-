"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { synthesisProjects, type ProjectImage } from "@/data/synthesis-projects";
import demoCss from "./extended-home-demo.module.css";

type MethodStep = {
  index: string;
  title: string;
  titleCn: string;
  body: string;
  image: ProjectImage;
};

const methodSteps: MethodStep[] = [
  {
    index: "01",
    title: "DEFINE THE RULE.",
    titleCn: "先找到能贯穿全案的规则。",
    body: "Reduce the brief to a small number of visual decisions: hierarchy, code, form and the relationship between them.",
    image: synthesisProjects.find((project) => project.slug === "runes")!.chapters[0].images[1],
  },
  {
    index: "02",
    title: "BUILD THE SYSTEM.",
    titleCn: "把规则推进到真实生产文件。",
    body: "Test the same visual language across identity, artwork, material, scale and the constraints of each output.",
    image: synthesisProjects.find((project) => project.slug === "packaging-design")!.chapters[0].images[1],
  },
  {
    index: "03",
    title: "RELEASE THE IMAGE.",
    titleCn: "让系统在最终场景里继续成立。",
    body: "Move from a controlled design surface into product, campaign, spatial image and interactive presentation.",
    image: synthesisProjects.find((project) => project.slug === "roku-ikition")!.chapters[1].images[0],
  },
];

export function ExtendedHomeDemo() {
  const [activeProject, setActiveProject] = useState(0);
  const projectNodes = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));

        if (!visible[0]) return;
        const index = Number((visible[0].target as HTMLElement).dataset.projectIndex);
        if (Number.isInteger(index)) setActiveProject(index);
      },
      { rootMargin: "-38% 0px -38% 0px", threshold: 0 },
    );

    projectNodes.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  const active = synthesisProjects[activeProject];

  return (
    <main className={demoCss.root}>
      <section className={demoCss.lead} aria-labelledby="extended-demo-title">
        <div className={demoCss.leadMeta}>
          <span>EXTENDED HOME / LAYOUT TEST</span>
          <span>07 PROJECTS / 01 CONTINUOUS READ</span>
        </div>
        <h1 id="extended-demo-title">
          <span>LET THE WORK</span>
          <span>TAKE MORE TIME.</span>
        </h1>
        <div className={demoCss.leadFoot}>
          <p>Scroll-led project gallery and process chapter.<br />滚动展开作品，而不是把七个项目压在同一屏。</p>
          <a href="#extended-work">ENTER THE SEQUENCE <i aria-hidden="true" /></a>
        </div>
      </section>

      <section className={demoCss.work} id="extended-work" aria-labelledby="extended-work-title">
        <header className={demoCss.sectionHead}>
          <p>01 / SELECTED WORK</p>
          <h2 id="extended-work-title">SEVEN PROJECTS.<br />ONE CONTINUOUS FIELD.</h2>
          <span>SCROLL TO ADVANCE / 滚动切换项目</span>
        </header>

        <div className={demoCss.gallery}>
          <div className={demoCss.stickyStage} aria-live="polite">
            <div className={demoCss.imageStack}>
              {synthesisProjects.map((project, index) => (
                <figure key={project.slug} className={demoCss.projectImage} data-active={index === activeProject}>
                  <Image
                    src={project.cover.src}
                    alt={index === activeProject ? project.cover.alt : ""}
                    fill
                    sizes="(max-width: 820px) 100vw, 62vw"
                    priority={index === 0}
                  />
                </figure>
              ))}
              <span className={demoCss.imageCounter}>{String(activeProject + 1).padStart(2, "0")} / {String(synthesisProjects.length).padStart(2, "0")}</span>
              <span className={demoCss.imageCaption}>{active.cover.caption} / {active.cover.note}</span>
            </div>
          </div>

          <div className={demoCss.projectRail}>
            {synthesisProjects.map((project, index) => (
              <article
                key={project.slug}
                ref={(node) => { projectNodes.current[index] = node; }}
                data-project-index={index}
                data-active={index === activeProject}
              >
                <figure className={demoCss.mobileProjectImage}>
                  <Image
                    src={project.cover.src}
                    alt={project.cover.alt}
                    fill
                    sizes="100vw"
                  />
                </figure>
                <div className={demoCss.projectMeta}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{project.year}</span>
                </div>
                <div className={demoCss.projectCopy}>
                  <p>{project.discipline}</p>
                  <h3>{project.title}</h3>
                  {project.titleCn && <h4>{project.titleCn}</h4>}
                  <p>{project.intro}</p>
                </div>
                <Link href={`/synthesis/projects/${project.slug}`}>
                  OPEN CASE STUDY <span aria-hidden="true">↗</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={demoCss.method} aria-labelledby="extended-method-title">
        <header className={demoCss.methodHead}>
          <p>02 / FROM IDEA TO FORM</p>
          <h2 id="extended-method-title">A SYSTEM IS MORE<br />THAN ITS FINAL IMAGE.</h2>
          <span>方法不是额外说明，而是作品的一部分。</span>
        </header>

        <div className={demoCss.methodSteps}>
          {methodSteps.map((step) => (
            <article key={step.index}>
              <div className={demoCss.methodCopy}>
                <span>{step.index} / 03</span>
                <div>
                  <h3>{step.title}</h3>
                  <h4>{step.titleCn}</h4>
                  <p>{step.body}</p>
                </div>
              </div>
              <figure>
                <Image src={step.image.src} alt={step.image.alt} fill sizes="(max-width: 820px) 100vw, 58vw" />
                <figcaption>{step.image.caption}<span>{step.image.note}</span></figcaption>
              </figure>
            </article>
          ))}
        </div>
      </section>

      <footer className={demoCss.demoEnd}>
        <p>END OF LAYOUT TEST / 当前仅为独立结构预览</p>
        <h2>LONGER,<br />NOT LOUDER.</h2>
        <Link href="/synthesis">RETURN TO CURRENT HOME <span aria-hidden="true">↗</span></Link>
      </footer>
    </main>
  );
}
