const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const progress = document.querySelector('.progress span');
let scrollFrame = 0;
const updateScroll = () => {
  scrollFrame = 0;
  const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  progress.style.transform = `scaleX(${Math.min(1, window.scrollY / scrollable)})`;
};
window.addEventListener('scroll', () => {
  if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll);
}, { passive: true });
updateScroll();

if (!reducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .08, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('visible'));
}

const lightbox = document.querySelector('.lightbox');
const lightboxImage = lightbox.querySelector('img');
const lightboxLabel = lightbox.querySelector('.lightbox-label');
const lightboxClose = lightbox.querySelector('button');
let lastTrigger = null;

const closeLightbox = () => {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('locked');
  lastTrigger?.focus();
};

document.querySelectorAll('[data-lightbox]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    lastTrigger = trigger;
    lightboxImage.src = trigger.dataset.lightbox;
    lightboxImage.alt = trigger.querySelector('img')?.alt || '';
    lightboxLabel.textContent = trigger.dataset.label || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('locked');
    lightboxClose.focus();
  });
});
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
});

const cursor = document.querySelector('.site-cursor');
if (!reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 561px)').matches) {
  document.body.append(cursor);
  let targetX = -30;
  let targetY = -30;
  let currentX = -30;
  let currentY = -30;
  let cursorFrame = 0;
  const hideCursor = () => cursor.classList.remove('visible', 'pressed');
  const renderCursor = () => {
    cursorFrame = 0;
    currentX += (targetX - currentX) * .34;
    currentY += (targetY - currentY) * .34;
    cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    if (Math.abs(targetX - currentX) > .1 || Math.abs(targetY - currentY) > .1) cursorFrame = window.requestAnimationFrame(renderCursor);
  };
  window.addEventListener('pointermove', (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    cursor.classList.add('visible');
    if (!cursorFrame) cursorFrame = window.requestAnimationFrame(renderCursor);
    const target = event.target;
    cursor.classList.toggle('interactive', Boolean(target.closest('a, button')));
    cursor.classList.toggle('is-media', Boolean(target.closest('.media-button')));
    cursor.classList.toggle('on-dark', Boolean(target.closest('.chapter, .lightbox')));
  }, { passive: true });
  window.addEventListener('pointerdown', () => cursor.classList.add('pressed'), { passive: true });
  window.addEventListener('pointerup', () => cursor.classList.remove('pressed'), { passive: true });
  document.documentElement.addEventListener('mouseleave', (event) => {
    const outsideViewport = event.clientX <= 0 || event.clientY <= 0 || event.clientX >= window.innerWidth - 1 || event.clientY >= window.innerHeight - 1;
    if (outsideViewport) hideCursor();
  });
  window.addEventListener('blur', hideCursor);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hideCursor();
  });
  document.documentElement.classList.add('cursor-ready');
}

/* Short paper case boot — not the home black theatre intro */
(() => {
  if (sessionStorage.getItem('wyf-case-boot') === '1' || reducedMotion) {
    document.documentElement.classList.remove('case-booting');
    document.querySelector('.case-boot')?.remove();
    return;
  }
  const boot = document.querySelector('.case-boot');
  if (!boot) {
    document.documentElement.classList.remove('case-booting');
    return;
  }
  const bar = boot.querySelector('.case-boot-bar span');
  const started = performance.now();
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    if (bar) bar.style.width = '100%';
    boot.classList.add('is-done');
    document.documentElement.classList.remove('case-booting');
    sessionStorage.setItem('wyf-case-boot', '1');
    window.setTimeout(() => boot.remove(), 480);
  };
  const tick = (now) => {
    if (done) return;
    const t = Math.min(1, (now - started) / 720);
    if (bar) bar.style.width = `${Math.round(t * 100)}%`;
    if (t >= 1) finish();
    else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.setTimeout(finish, 900);
})();
