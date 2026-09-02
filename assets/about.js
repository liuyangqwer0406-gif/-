(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector(".nav");
  const progress = document.querySelector(".page-progress span");

  const setMenu = (open, instant = false) => {
    if (!menuButton || !nav) return;
    const update = () => {
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
    };
    if (!instant) {
      update();
      return;
    }
    nav.classList.add("motion-instant");
    update();
    requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.remove("motion-instant")));
  };

  menuButton?.addEventListener("click", (event) => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true", event.detail === 0);
  });
  nav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const wasOpen = menuButton?.getAttribute("aria-expanded") === "true";
    setMenu(false, true);
    if (wasOpen) menuButton?.focus();
  });

  let scrollTick = 0;
  const updateProgress = () => {
    scrollTick = 0;
    if (!progress) return;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.style.transform = `scaleX(${Math.min(1, Math.max(0, window.scrollY / max))})`;
  };
  window.addEventListener("scroll", () => {
    if (!scrollTick) scrollTick = requestAnimationFrame(updateProgress);
  }, { passive: true });
  window.addEventListener("resize", updateProgress, { passive: true });
  updateProgress();

  const chapterNav = document.querySelector(".chapter-map");
  const chapterMap = chapterNav?.querySelector(".chapter-map-inner");
  const chapterStatus = document.querySelector("[data-chapter-status]");
  const chapterLinks = [...document.querySelectorAll("[data-section-link]")];
  const chapterSections = chapterLinks
    .map((link) => document.getElementById(link.dataset.sectionLink))
    .filter(Boolean);
  let activeChapterId = "";

  const setActiveChapter = (sectionId) => {
    const activeIndex = chapterLinks.findIndex((link) => link.dataset.sectionLink === sectionId);
    if (activeIndex < 0 || activeChapterId === sectionId) return;
    activeChapterId = sectionId;

    chapterLinks.forEach((link, index) => {
      if (index === activeIndex) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });

    if (chapterStatus) {
      const activeLink = chapterLinks[activeIndex];
      const label = activeLink.textContent.trim().replace(/^(\d{2})/, "$1 / ");
      chapterStatus.textContent = label;
    }

    chapterMap?.style.setProperty("--chapter-progress", String(activeIndex / Math.max(1, chapterLinks.length - 1)));
    const activeSection = chapterSections.find((section) => section.id === sectionId);
    chapterNav?.setAttribute("data-surface", activeSection?.dataset.surface === "paper" ? "paper" : "dark");

    if (chapterNav && window.innerWidth <= 920) {
      const activeLink = chapterLinks[activeIndex];
      const targetLeft = activeLink.offsetLeft - (chapterNav.clientWidth - activeLink.offsetWidth) / 2;
      chapterNav.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: reduceMotion.matches ? "auto" : "smooth"
      });
    }
  };

  if (chapterSections.length && "IntersectionObserver" in window) {
    const chapterObserver = new IntersectionObserver((entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0];
      if (current) setActiveChapter(current.target.id);
    }, { rootMargin: "-26% 0px -64%", threshold: 0 });
    chapterSections.forEach((section) => chapterObserver.observe(section));
  }

  const revealItems = [...document.querySelectorAll("[data-reveal], [data-section-reveal]")];
  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: "0px 0px -6%" });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  const stage = document.querySelector("[data-particle-portrait]");
  const image = stage?.querySelector("img");
  const canvas = stage?.querySelector("canvas");
  if (!stage || !image || !canvas || reduceMotion.matches || !finePointer.matches) return;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const particles = [];
  const groups = [];
  const pointer = { x: 0, y: 0, activeUntil: 0 };
  let width = 1;
  let height = 1;
  let visible = false;
  let frame = 0;
  let lastTime = 0;
  let motionPending = false;
  const frameInterval = 1000 / 60;

  const rootStyle = getComputedStyle(document.documentElement);
  const particleWhite = rootStyle.getPropertyValue("--white").trim() || "#f4f3ef";
  const particleOrange = rootStyle.getPropertyValue("--orange").trim() || "#ff5125";
  const groupStyles = [
    { color: particleWhite, alpha: .24 },
    { color: particleWhite, alpha: .38 },
    { color: particleWhite, alpha: .54 },
    { color: particleWhite, alpha: .7 },
    { color: particleOrange, alpha: .94 }
  ];

  const setMotionState = (state) => {
    stage.dataset.particleState = state;
  };

  const stopAnimation = (state = "idle") => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    setMotionState(state);
  };

  const drawParticles = () => {
    context.clearRect(0, 0, width, height);
    groups.forEach((group, index) => {
      if (!group.length) return;
      context.fillStyle = groupStyles[index].color;
      context.globalAlpha = groupStyles[index].alpha;
      group.forEach((particle) => {
        context.fillRect(
          particle.x - particle.size * .5,
          particle.y - particle.size * .5,
          particle.size,
          particle.size
        );
      });
    });
    context.globalAlpha = 1;
  };

  const buildParticles = () => {
    const rect = stage.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = width;
    sampleCanvas.height = height;
    const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
    if (!sampleContext) return;

    if (!image.naturalWidth || !image.naturalHeight) return;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const offsetX = (width - drawWidth) * .5;
    const offsetY = (height - drawHeight) * .44;
    sampleContext.filter = "grayscale(1) contrast(1.08)";
    sampleContext.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    const pixels = sampleContext.getImageData(0, 0, width, height).data;
    const targetCount = Math.min(3600, Math.max(3000, Math.round((width * height) / 150)));
    const step = Math.max(7, Math.ceil(Math.sqrt((width * height) / (targetCount * 1.55))));
    particles.length = 0;
    groups.length = groupStyles.length;
    groups.fill(null);
    for (let index = 0; index < groups.length; index += 1) groups[index] = [];

    for (let y = step / 2; y < height; y += step) {
      for (let x = step / 2; x < width; x += step) {
        const pixelIndex = (Math.floor(y) * width + Math.floor(x)) * 4;
        const red = pixels[pixelIndex];
        const green = pixels[pixelIndex + 1];
        const blue = pixels[pixelIndex + 2];
        const alpha = pixels[pixelIndex + 3];
        if (alpha < 180) continue;
        const luminance = red * .2126 + green * .7152 + blue * .0722;
        const hash = ((Math.floor(x) * 17 + Math.floor(y) * 29) % 100) / 100;
        if (luminance > 236 && hash > .22) continue;
        const orange = hash < .045 && luminance < 180;
        const group = orange ? 4 : luminance < 84 ? 3 : luminance < 148 ? 2 : luminance < 208 ? 1 : 0;
        const particle = {
          baseX: x,
          baseY: y,
          x: x + (hash - .5) * 18,
          y: y + (.5 - hash) * 18,
          vx: 0,
          vy: 0,
          size: 1.2 + ((Math.floor(x + y) % 3) * .38),
          group
        };
        particles.push(particle);
      }
    }

    if (particles.length > 3600) {
      const sampledParticles = [];
      const sampleStep = particles.length / 3600;
      for (let index = 0; index < 3600; index += 1) {
        sampledParticles.push(particles[Math.floor(index * sampleStep)]);
      }
      particles.length = 0;
      sampledParticles.forEach((particle) => particles.push(particle));
    }
    particles.forEach((particle) => groups[particle.group].push(particle));

    stage.classList.add("is-particle-ready");
    stage.dataset.particleCount = String(particles.length);
    motionPending = particles.length > 0;
    drawParticles();
    ensureAnimation();
  };

  const animate = (time) => {
    frame = 0;
    if (!visible || document.hidden || reduceMotion.matches || !motionPending) {
      setMotionState(document.hidden || !visible ? "paused" : "idle");
      return;
    }
    const elapsed = lastTime ? time - lastTime : frameInterval;
    if (elapsed < frameInterval - .5) {
      frame = requestAnimationFrame(animate);
      return;
    }
    const delta = Math.min(2, Math.max(.5, elapsed / frameInterval));
    const pointerActive = time < pointer.activeUntil;
    let moving = false;
    lastTime = time - (elapsed % frameInterval);

    particles.forEach((particle) => {
      if (pointerActive) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distanceSquared = dx * dx + dy * dy;
        const radius = 86;
        if (distanceSquared < radius * radius) {
          const distance = Math.sqrt(distanceSquared) || 1;
          const force = ((radius - distance) / radius) ** 2 * 4.2 * delta;
          particle.vx += (dx / distance) * force;
          particle.vy += (dy / distance) * force;
        }
      }

      particle.vx += (particle.baseX - particle.x) * .028 * delta;
      particle.vy += (particle.baseY - particle.y) * .028 * delta;
      const drag = Math.pow(.82, delta);
      particle.vx *= drag;
      particle.vy *= drag;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;

      if (
        Math.abs(particle.baseX - particle.x) +
        Math.abs(particle.baseY - particle.y) +
        Math.abs(particle.vx) +
        Math.abs(particle.vy) > .08
      ) moving = true;
    });

    drawParticles();
    motionPending = pointerActive || moving;
    if (motionPending) {
      frame = requestAnimationFrame(animate);
    } else {
      particles.forEach((particle) => {
        particle.x = particle.baseX;
        particle.y = particle.baseY;
        particle.vx = 0;
        particle.vy = 0;
      });
      drawParticles();
      setMotionState("idle");
    }
  };

  function ensureAnimation() {
    if (!motionPending || !visible || document.hidden || reduceMotion.matches || frame) return;
    setMotionState("running");
    frame = requestAnimationFrame(animate);
  };

  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.activeUntil = performance.now() + 110;
    motionPending = true;
    ensureAnimation();
  }, { passive: true });
  stage.addEventListener("pointerleave", () => {
    pointer.activeUntil = 0;
    motionPending = true;
    ensureAnimation();
  });

  const visibilityObserver = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? false;
    if (visible) ensureAnimation();
    else stopAnimation("paused");
  }, { threshold: .04 });
  visibilityObserver.observe(stage);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAnimation("paused");
    else ensureAnimation();
  });

  reduceMotion.addEventListener?.("change", (event) => {
    if (event.matches) {
      stopAnimation("reduced");
      stage.classList.remove("is-particle-ready");
      context.clearRect(0, 0, width, height);
    } else {
      buildParticles();
    }
  });

  let resizeTimer = 0;
  const resizeObserver = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(buildParticles, 120);
  });
  resizeObserver.observe(stage);
  if (image.complete) buildParticles();
  else image.addEventListener("load", buildParticles, { once: true });
})();
