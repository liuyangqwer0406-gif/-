(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactExperience = window.matchMedia('(max-width: 960px)');
  const hero = document.querySelector('.rv-hero');
  const topbar = document.querySelector('.topbar');
  const surfaceSections = [...document.querySelectorAll('[data-rv-surface]')];
  const sticky = document.querySelector('.rv-experience__sticky');
  const frames = [...document.querySelectorAll('.rv-frame')];
  const meter = [...document.querySelectorAll('.rv-experience__meter span')];
  const counter = sticky?.querySelector('.rv-experience__counter');
  const title = sticky?.querySelector('h3');
  const description = sticky?.querySelector('p');
  const shutter = sticky?.querySelector('.rv-experience__shutter');
  let activeStep = 0;
  let pendingFrame = null;
  let isSwapping = false;
  let scrollFrame = 0;

  const setStepContent = (frame, nextStep) => {
    counter.textContent = frame.dataset.index;
    title.innerHTML = frame.dataset.title.replace('|', '<br>');
    description.textContent = frame.dataset.copy;
    meter.forEach((item, index) => item.classList.toggle('is-active', index <= nextStep));
  };

  const playShutter = async () => {
    if (!shutter || isSwapping) return;
    isSwapping = true;
    shutter.style.willChange = 'transform';
    shutter.style.transformOrigin = 'bottom';

    const cover = shutter.animate([
      { transform: 'scaleY(0)' },
      { transform: 'scaleY(1)' }
    ], {
      duration: 420,
      easing: 'linear',
      fill: 'forwards'
    });
    await cover.finished.catch(() => null);
    shutter.style.transform = 'scaleY(1)';
    cover.cancel();

    const frame = pendingFrame;
    pendingFrame = null;
    if (frame) {
      activeStep = Number(frame.dataset.step);
      setStepContent(frame, activeStep);
    }

    shutter.style.transformOrigin = 'top';
    const reveal = shutter.animate([
      { transform: 'scaleY(1)' },
      { transform: 'scaleY(0)' }
    ], {
      duration: 640,
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      fill: 'forwards'
    });
    await reveal.finished.catch(() => null);
    shutter.style.transform = 'scaleY(0)';
    shutter.style.transformOrigin = 'bottom';
    shutter.style.willChange = '';
    reveal.cancel();
    isSwapping = false;

    if (pendingFrame && Number(pendingFrame.dataset.step) !== activeStep) {
      playShutter();
    } else {
      pendingFrame = null;
    }
  };

  const updateStep = (frame) => {
    if (!sticky) return;
    const nextStep = Number(frame.dataset.step);
    if (reducedMotion.matches || compactExperience.matches || !shutter) {
      pendingFrame = null;
      activeStep = nextStep;
      setStepContent(frame, nextStep);
      return;
    }
    if (nextStep === activeStep && !isSwapping) return;
    pendingFrame = frame;
    playShutter();
  };

  if ('IntersectionObserver' in window && frames.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) updateStep(visible.target);
    }, { rootMargin: '-24% 0px -24% 0px', threshold: [0, .2, .5, .8] });
    frames.forEach((frame) => observer.observe(frame));
  } else if (frames[0]) {
    updateStep(frames[0]);
  }

  const updateSurface = () => {
    if (!topbar) return;
    const marker = 44;
    const active = surfaceSections.find((section) => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= marker && bounds.bottom > marker;
    });
    const nextSurface = active?.dataset.rvSurface || 'dark';
    if (topbar.dataset.surface !== nextSurface) topbar.dataset.surface = nextSurface;
  };

  const updateHero = () => {
    if (!hero || reducedMotion.matches) return;
    const bounds = hero.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
    const progress = Math.min(1, Math.max(0, -bounds.top / Math.max(1, bounds.height)));
    hero.style.setProperty('--rv-hero-shift', String(progress * 52));
  };

  const updateViewport = () => {
    scrollFrame = 0;
    updateSurface();
    updateHero();
  };

  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateViewport);
  }, { passive: true });
  window.addEventListener('resize', updateViewport, { passive: true });
  updateViewport();
})();
