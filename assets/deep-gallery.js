(() => {
  const root = document.querySelector('[data-depth-gallery]');
  if (!root) return;

  const stage = root.querySelector('.depth-gallery__stage');
  const planes = [...root.querySelectorAll('.depth-gallery__plane')];
  const indexButtons = [...root.querySelectorAll('.depth-gallery__index-list button')];
  const title = root.querySelector('[data-gallery-title]');
  const english = root.querySelector('[data-gallery-english]');
  const detail = root.querySelector('[data-gallery-detail]');
  const serial = root.querySelector('[data-gallery-serial]');
  const progressLabels = [...root.querySelectorAll('[data-gallery-progress]')];
  const archiveLabel = root.querySelector('[data-gallery-archive]');
  const pathLabel = root.querySelector('[data-gallery-path]');
  const spineProgress = root.querySelector('[data-gallery-spine]');
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopQuery = window.matchMedia('(min-width: 60rem)');
  const requestFrame = window.requestAnimationFrame
    ? (callback) => window.requestAnimationFrame(callback)
    : (callback) => window.setTimeout(() => callback(Date.now()), 16);

  const fields = [
    { serial: '01', title: '器物', english: 'OBJECTS / FORM 01', detail: '我收藏器物的轮廓、重量与表面，观察时间如何留在材质上。', path: 'Objects / vessel 01', archive: 'OBJECTS' },
    { serial: '02', title: '容器', english: 'CONTAINERS / SYSTEM 02', detail: '我关注瓶体、标签与握持关系，记录包装如何成为可识别的整体。', path: 'Containers / bottle 02', archive: 'CONTAINERS' },
    { serial: '03', title: '折叠', english: 'FOLDS / STRUCTURE 03', detail: '我把折线、纸材与生产限制视为包装结构的一部分，而不是最后附加的外壳。', path: 'Folds / folded plane 03', archive: 'FOLDS' },
    { serial: '04', title: '符号', english: 'SYMBOLS / SIGNAL 04', detail: '我收集在远距离、低光和快速移动中仍能被识别的字体、纹样与视觉信号。', path: 'Symbols / emblem 04', archive: 'SYMBOLS' },
    { serial: '05', title: '空间', english: 'SPACES / THRESHOLD 05', detail: '我记录入口、展陈与场景中的观看顺序，理解视觉如何引导人在空间中移动。', path: 'Spaces / threshold 05', archive: 'SPACES' },
  ];

  let activeIndex = -1;
  let targetProgress = 0;
  let currentProgress = 0;
  let frameId = 0;
  let lastFrameTime = 0;
  let visible = false;
  let touchStart = null;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const smoothstep = (value) => value * value * (3 - 2 * value);
  const getProgress = () => {
    const travel = Math.max(1, root.offsetHeight - window.innerHeight);
    return clamp(-root.getBoundingClientRect().top / travel, 0, 1);
  };

  const setActive = (nextIndex) => {
    const next = clamp(nextIndex, 0, fields.length - 1);
    if (next === activeIndex) return;
    activeIndex = next;
    const data = fields[next];

    serial.textContent = data.serial;
    title.textContent = data.title;
    english.textContent = data.english;
    detail.textContent = data.detail;
    pathLabel.textContent = data.path;
    archiveLabel.textContent = data.archive;
    progressLabels.forEach((label) => { label.textContent = `${data.serial} / 05`; });

    planes.forEach((plane, index) => {
      const selected = index === next;
      plane.classList.toggle('is-active', selected);
    });

    indexButtons.forEach((button, index) => {
      const selected = index === next;
      button.setAttribute('aria-current', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
  };

  const renderDesktop = (timestamp) => {
    frameId = 0;
    if (!visible || !desktopQuery.matches || reduceQuery.matches) return;

    const frameSeconds = lastFrameTime ? clamp((timestamp - lastFrameTime) / 1000, .001, .05) : 1 / 60;
    lastFrameTime = timestamp;
    targetProgress = getProgress();
    const delta = targetProgress - currentProgress;
    currentProgress += delta * (1 - Math.exp(-8.5 * frameSeconds));
    if (Math.abs(delta) < .0004) currentProgress = targetProgress;

    const position = currentProgress * (fields.length - 1);
    const nextActive = clamp(Math.round(position), 0, fields.length - 1);
    setActive(nextActive);
    spineProgress.style.transform = `scaleY(${Math.max(.08, currentProgress)})`;

    planes.forEach((plane, index) => {
      const relative = index - position;
      const distance = Math.abs(relative);
      const focus = clamp(1 - distance, 0, 1);
      const focusEase = smoothstep(focus);
      const side = Math.sign(relative);
      const sideFade = distance < 1 ? smoothstep(distance) : 1;
      const x = Number(plane.dataset.x) * side * sideFade;
      const y = Number(plane.dataset.y) * side * sideFade;
      const depthDistance = distance <= 1 ? 1 - focusEase : 1 + (distance - 1) * 1.2;
      const depth = clamp(88 - depthDistance * 300, -720, 90);
      const rotation = Number(plane.dataset.rotation) + relative * 2.8;
      const rotateY = clamp(relative * -5.5, -16, 16);
      const scale = clamp(1 + focusEase * .045 - distance * .025, .88, 1.05);
      const opacity = clamp(.08 + focusEase * .92, .08, 1);

      plane.style.opacity = opacity.toFixed(3);
      plane.style.zIndex = String(Math.round(100 - distance * 10));
      plane.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px), ${depth.toFixed(2)}px) rotateZ(${rotation.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    });

    if (Math.abs(targetProgress - currentProgress) > .0004) frameId = requestFrame(renderDesktop);
  };

  const resetStaticPlanes = () => {
    planes.forEach((plane) => {
      plane.style.removeProperty('opacity');
      plane.style.removeProperty('z-index');
      plane.style.removeProperty('transform');
    });
    spineProgress.style.removeProperty('transform');
    setActive(Math.max(0, activeIndex));
  };

  const requestRender = () => {
    if (!desktopQuery.matches || reduceQuery.matches) {
      resetStaticPlanes();
      return;
    }
    targetProgress = getProgress();
    if (!frameId && visible) {
      lastFrameTime = 0;
      frameId = requestFrame(renderDesktop);
    }
  };

  const chooseIndex = (index) => {
    if (desktopQuery.matches && !reduceQuery.matches) {
      const travel = Math.max(1, root.offsetHeight - window.innerHeight);
      window.scrollTo({ top: root.offsetTop + (index / (fields.length - 1)) * travel, behavior: 'auto' });
      return;
    }
    setActive(index);
  };

  indexButtons.forEach((button, index) => {
    button.addEventListener('click', () => chooseIndex(index));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = fields.length - 1;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + fields.length) % fields.length;
      else next = (index + 1) % fields.length;
      chooseIndex(next);
      indexButtons[next].focus({ preventScroll: true });
    });
  });

  root.addEventListener('touchstart', (event) => {
    if (desktopQuery.matches || event.touches.length !== 1) return;
    const touch = event.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY, time: performance.now() };
  }, { passive: true });

  root.addEventListener('touchend', (event) => {
    if (!touchStart || desktopQuery.matches || !event.changedTouches.length) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const elapsed = performance.now() - touchStart.time;
    touchStart = null;
    if (elapsed > 700 || Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    setActive(activeIndex + (deltaX < 0 ? 1 : -1));
  }, { passive: true });

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    root.classList.toggle('is-visible', visible);
    if (visible) requestRender();
    else if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
      lastFrameTime = 0;
    }
  }, { threshold: .01 });

  observer.observe(root);
  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender, { passive: true });
  const handleModeChange = () => requestRender();
  reduceQuery.addEventListener('change', handleModeChange);
  desktopQuery.addEventListener('change', handleModeChange);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    } else if (!document.hidden) requestRender();
  });

  setActive(0);
  stage.dataset.galleryState = reduceQuery.matches ? 'reduced' : 'ready';
  window.__deepGalleryReady = true;
})();
