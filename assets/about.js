(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector(".nav");
  const progress = document.querySelector(".page-progress span");

  const setMenu = (open) => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  };

  menuButton?.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });
  nav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
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

  const revealItems = [...document.querySelectorAll("[data-reveal]")];
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
  const pointer = { x: 0, y: 0, active: false };
  let width = 1;
  let height = 1;
  let visible = false;
  let frame = 0;
  let lastFrame = 0;

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

    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const offsetX = (width - drawWidth) * .58;
    const offsetY = (height - drawHeight) * .5;
    sampleContext.filter = "grayscale(1) contrast(1.08)";
    sampleContext.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    const pixels = sampleContext.getImageData(0, 0, width, height).data;
    const step = Math.max(7, Math.ceil(Math.sqrt((width * height) / 7200)));
    particles.length = 0;

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
        const tone = Math.round(74 + (255 - luminance) * .7);
        const orange = hash < .045 && luminance < 180;
        particles.push({
          baseX: x,
          baseY: y,
          x: x + (hash - .5) * 22,
          y: y + (.5 - hash) * 22,
          vx: 0,
          vy: 0,
          radius: .7 + ((Math.floor(x + y) % 4) * .22),
          color: orange ? "rgba(255,81,37,.94)" : `rgba(${tone},${tone},${tone},${.42 + (255 - luminance) / 510})`
        });
      }
    }
    stage.classList.add("is-particle-ready");
    draw(true);
  };

  const draw = (staticFrame = false) => {
    context.clearRect(0, 0, width, height);
    particles.forEach((particle) => {
      if (!staticFrame) {
        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy) || 1;
          const radius = 78;
          if (distance < radius) {
            const force = ((radius - distance) / radius) ** 2 * 3.8;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
          }
        }
        particle.vx += (particle.baseX - particle.x) * .025;
        particle.vy += (particle.baseY - particle.y) * .025;
        particle.vx *= .86;
        particle.vy *= .86;
        particle.x += particle.vx;
        particle.y += particle.vy;
      }
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = particle.color;
      context.fill();
    });
  };

  const animate = (time) => {
    frame = 0;
    if (!visible || document.hidden || reduceMotion.matches) return;
    if (time - lastFrame >= 1000 / 30) {
      draw();
      lastFrame = time;
    }
    frame = requestAnimationFrame(animate);
  };

  const ensureAnimation = () => {
    if (visible && !document.hidden && !frame) frame = requestAnimationFrame(animate);
  };

  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
    ensureAnimation();
  }, { passive: true });
  stage.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  const visibilityObserver = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? false;
    if (visible) ensureAnimation();
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }, { threshold: .04 });
  visibilityObserver.observe(stage);
  document.addEventListener("visibilitychange", ensureAnimation);

  let resizeTimer = 0;
  const resizeObserver = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(buildParticles, 120);
  });
  resizeObserver.observe(stage);
  if (image.complete) buildParticles();
  else image.addEventListener("load", buildParticles, { once: true });
})();
