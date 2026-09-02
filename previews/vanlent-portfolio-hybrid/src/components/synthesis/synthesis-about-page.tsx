"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AboutSignalField } from "./about-signal-field";
import { announceSynthesisRouteReady } from "./route-events";
import styles from "./synthesis-about-page.module.css";

const practiceAreas = [
  ["01 / IDENTITY", "Brand systems / 品牌系统", "建立识别、层级与可复用的视觉语法。Identity, hierarchy and repeatable visual grammar."],
  ["02 / PACKAGING", "Packaging / 包装设计", "处理结构、语言、规格与印前落地，让视觉在生产变化中保持清晰。"],
  ["03 / 3D IMAGE", "Visualisation / 三维表现", "把材质、灯光和空间纳入视觉叙事。Material and light become part of the argument."],
  ["04 / INTERACTIVE", "Interaction / 动态交互", "用动效解释顺序与关系，而不是装饰每一个表面。Motion with a reason."],
] as const;

const methodImages = [
  ["/portfolio-assets/dad/material-ember.jpg", "IDENTITY"],
  ["/portfolio-assets/packaging-mockup.jpg", "PACKAGING"],
  ["/portfolio-assets/thesis-wayfinding.jpg", "SPATIAL"],
  ["/portfolio-assets/vitrolume/glass-hero.png", "GLASS / LIGHT"],
  ["/portfolio-assets/reverie-cover.jpg", "WEBGL"],
  ["/portfolio-assets/melonpop/melo-dew-brand-overview.png", "RETAIL"],
] as const;

const experience = [
  ["2025.10—2026.04", "杭州视觉设计实习 / Visual Design Internship", "参与零售包装、外贸多语言印前文件与 AI 辅助应用视觉制作，将创意推进到可生产文件。"],
  ["2022.09—2026.07", "数字媒体艺术本科 / B.A. Digital Media Art", "四川大学锦江学院；学习三维表现、UI、动态图形、包装设计、数据可视化与计算机色彩原理。"],
  ["SELECTED / 2024", "项目入围与校内评选 / Recognition", "眉山江口沉银博物馆文创设计入围；D&AD New Blood 项目参与校内评选。所有成果按真实边界呈现。"],
] as const;

export function SynthesisAboutPage() {
  const methodRef = useRef<HTMLElement>(null);
  const imageRefs = useRef<Array<HTMLElement | null>>([]);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const readyAnnounced = useRef(false);
  const [portraitReady, setPortraitReady] = useState(false);
  const [fieldSettled, setFieldSettled] = useState(false);

  const markFieldSettled = useCallback(() => setFieldSettled(true), []);

  useEffect(() => {
    const timer = window.setTimeout(() => setFieldSettled(true), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!portraitReady || !fieldSettled || readyAnnounced.current) return;
    readyAnnounced.current = true;
    announceSynthesisRouteReady("/synthesis/about");
  }, [fieldSettled, portraitReady]);

  useEffect(() => {
    const method = methodRef.current;
    if (!method) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const directions = [
      [-0.48, -0.18], [0.52, -0.14], [-0.44, 0.28], [0.48, 0.26], [-0.12, -0.42], [0.16, 0.46],
    ] as const;
    let frame = 0;

    const draw = () => {
      frame = 0;
      if (reducedMotion.matches) {
        imageRefs.current.forEach((image) => {
          if (!image) return;
          image.style.removeProperty("transform");
          image.style.removeProperty("opacity");
        });
        wordRefs.current.forEach((word) => word?.style.removeProperty("opacity"));
        return;
      }

      const rect = method.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const range = method.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, range)));

      imageRefs.current.forEach((image, index) => {
        if (!image) return;
        const local = Math.max(0, Math.min(1.26, (progress - index * 0.075) * 2.2));
        const eased = 1 - Math.pow(1 - Math.min(1, local), 3);
        const z = -900 + eased * 1050;
        const x = directions[index][0] * window.innerWidth * Math.pow(eased, 1.35);
        const y = directions[index][1] * window.innerHeight * Math.pow(eased, 1.35);
        const scale = 0.18 + eased * 0.78;
        const opacity = local < 0.06 ? local / 0.06 : local > 1.18 ? Math.max(0, 1 - (local - 1.18) / 0.08) : 1;
        image.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) scale(${scale})`;
        image.style.opacity = String(opacity);
      });

      wordRefs.current.forEach((word, index) => {
        if (word) word.style.opacity = progress > 0.72 + index * 0.075 ? "1" : "0.16";
      });
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(draw);
    };
    const onMotionChange = () => schedule();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    reducedMotion.addEventListener("change", onMotionChange);
    schedule();

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <main id="content" className={`synthesis-main ${styles.page}`}>
      <section className={styles.hero} aria-labelledby="about-title">
        <AboutSignalField onSettled={markFieldSettled} />
        <div className={styles.heroGrid}>
          <div className={styles.heroTitle}>
            <p className={styles.eyebrow}>ABOUT 关于 / PRACTICE 实践 / MOTION STUDY 01</p>
            <h1 id="about-title"><span>DESIGNING</span><span><em>CLARITY</em> THAT</span><span>CAN TRAVEL.</span></h1>
          </div>
          <aside className={styles.heroAside}>
            <p>让清晰的视觉规则跨越媒介。<br />Visual systems made to travel.</p>
            <p>从概念到图像，从包装到空间与屏幕。我关注的不是固定风格，而是一套能在不同生产条件中继续成立的方法。</p>
            <div className={styles.heroMeta}><span>HANGZHOU 杭州 / CN</span><span>向下阅读 / SCROLL ↓</span></div>
          </aside>
        </div>
      </section>

      <section className={styles.profile} id="profile" aria-labelledby="profile-title">
        <figure className={styles.portrait}>
          <Image
            src="/portfolio-assets/about-portrait.webp"
            alt="温一帆个人肖像"
            fill
            sizes="(max-width: 800px) 100vw, 44vw"
            priority
            onLoad={() => setPortraitReady(true)}
            onError={() => setPortraitReady(true)}
          />
          <figcaption><span>温一帆 / WEN YIFAN</span><span>视觉设计 / VISUAL DESIGN</span></figcaption>
        </figure>
        <div className={styles.profileCopy}>
          <p className={styles.sectionLabel}><span>01 / PROFILE 关于我</span><span>WHO / WHAT / HOW</span></p>
          <h2 id="profile-title">NOT ONE STYLE.<br />ONE <em>METHOD.</em><small>不追逐单一风格，建立可以持续工作的设计方法。</small></h2>
          <div className={styles.profileLead}>
            <p>我是一名数字媒体艺术专业的视觉设计师，工作覆盖品牌识别、零售包装、三维视觉与互动展示。媒介会改变，但信息层级与视觉规则必须保持清楚。</p>
            <p>I work across identity, retail packaging, 3D visualisation and interactive presentation—different outputs, guided by one legible system.</p>
          </div>
          <div className={styles.practiceMap}>
            {practiceAreas.map(([index, title, body]) => (
              <article key={index}><span>{index}</span><h3>{title}</h3><p>{body}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section ref={methodRef} className={styles.method} id="method" aria-labelledby="method-title">
        <div className={styles.methodStage}>
          <header className={styles.methodHead}>
            <h2 id="method-title">FROM RULE<br />TO REAL USE.</h2>
            <p>从视觉规则到真实应用。六个项目在一段克制的纵深序列中依次经过，不接管滚动，也不让动效盖过作品。</p>
          </header>
          <div className={styles.methodImages} aria-hidden="true">
            {methodImages.map(([src, label], index) => (
              <figure
                ref={(node) => { imageRefs.current[index] = node; }}
                className={styles.methodImage}
                data-label={label}
                key={src}
              >
                <Image src={src} alt="" fill sizes="(max-width: 800px) 66vw, 30vw" />
              </figure>
            ))}
          </div>
          <div className={styles.methodCopy}>
            <h3 aria-label="Define, test, deliver">
              {["DEFINE.", "TEST.", "DELIVER."].map((word, index) => (
                <span ref={(node) => { wordRefs.current[index] = node; }} key={word}>{word}</span>
              ))}
            </h3>
            <p>02 / METHOD 方法<br />定义 DEFINE · 测试 TEST · 落地 DELIVER</p>
          </div>
        </div>
      </section>

      <section className={styles.experience} id="experience" aria-labelledby="experience-title">
        <header className={styles.experienceHead}>
          <p className={styles.sectionLabel}><span>03 / EXPERIENCE 经历</span><span>SELECTED SIGNALS / 关键节点</span></p>
          <h2 id="experience-title"><span>WORK,</span><span>LEARNING,</span><span>PROOF.</span><small>实践 · 学习 · 成果</small></h2>
        </header>
        <ol className={styles.timeline}>
          {experience.map(([date, title, body]) => (
            <li key={date}><time>{date}</time><h3>{title}</h3><p>{body}</p></li>
          ))}
        </ol>
        <div className={styles.resumeRow}>
          <p>需要更完整的经历？<br />Download the current résumé.</p>
          <a href="/Wen-Yifan-Resume.pdf" target="_blank" rel="noreferrer"><span>下载简历 / RÉSUMÉ PDF</span><span>↗</span></a>
        </div>
      </section>

      <section className={styles.contact} id="contact" aria-labelledby="contact-title">
        <p>视觉 / 品牌 / 包装设计机会 · AVAILABLE FOR VISUAL / BRAND / PACKAGING OPPORTUNITIES</p>
        <h2 id="contact-title">让想法<br /><em>BECOME VISIBLE.</em></h2>
        <footer><span>ABOUT 关于 / WEN YIFAN 2026</span><a href="mailto:2742733283@qq.com">联系我 / 2742733283@QQ.COM ↗</a></footer>
      </section>
    </main>
  );
}
