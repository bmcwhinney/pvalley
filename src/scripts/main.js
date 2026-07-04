(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastScrollY = 0;
  let ticking = false;
  let lightboxItems = [];
  let lightboxIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  function getEl(id) {
    return document.getElementById(id);
  }

  function toggleMenu(forceClose) {
    const navLinks = getEl('navLinks');
    const menuBtn = getEl('menuBtn');
    const navOverlay = getEl('navOverlay');
    if (!navLinks) return;

    const isOpen = forceClose === true ? false : !navLinks.classList.contains('active');
    navLinks.classList.toggle('active', isOpen);
    navOverlay?.classList.toggle('active', isOpen);
    document.body.classList.toggle('menu-open', isOpen);

    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      menuBtn.classList.toggle('is-open', isOpen);
    }
  }

  function closeLightbox() {
    const lightbox = getEl('lightbox');
    if (!lightbox?.classList.contains('active')) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function visibleLightboxTriggers() {
    return Array.from(document.querySelectorAll('[data-lightbox]')).filter((t) => {
      const item = t.closest('.gallery-item');
      return !item || !item.classList.contains('is-hidden');
    });
  }

  function preloadLightboxNeighbors() {
    if (lightboxItems.length < 2) return;
    [lightboxIndex - 1, lightboxIndex + 1].forEach((i) => {
      const trigger = lightboxItems[(i + lightboxItems.length) % lightboxItems.length];
      const src = trigger && trigger.getAttribute('data-full');
      if (src) {
        const preload = new Image();
        preload.src = src;
      }
    });
  }

  function renderLightbox() {
    const trigger = lightboxItems[lightboxIndex];
    if (!trigger) return;

    const lightboxImg = getEl('lightboxImg');
    const caption = getEl('lightboxCaption');
    const counter = getEl('lightboxCounter');
    const thumb = trigger.querySelector('img');
    const thumbSrc = thumb ? (thumb.currentSrc || thumb.src) : '';
    const full = trigger.getAttribute('data-full') || thumbSrc || '';
    const alt = trigger.getAttribute('data-caption') || (thumb && thumb.alt) || '';

    if (lightboxImg) {
      lightboxImg.alt = alt;
      // Fall back to the thumbnail if the full-res image fails to load.
      lightboxImg.onerror = () => {
        if (thumbSrc && lightboxImg.src !== thumbSrc) lightboxImg.src = thumbSrc;
      };
      lightboxImg.src = full;
    }
    if (caption) caption.textContent = alt;

    const multiple = lightboxItems.length > 1;
    if (counter) counter.textContent = multiple ? `${lightboxIndex + 1} / ${lightboxItems.length}` : '';
    const prev = getEl('lightboxPrev');
    const next = getEl('lightboxNext');
    if (prev) prev.style.display = multiple ? '' : 'none';
    if (next) next.style.display = multiple ? '' : 'none';

    preloadLightboxNeighbors();
  }

  function stepLightbox(delta) {
    if (!lightboxItems.length) return;
    lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
    renderLightbox();
  }

  function openLightbox(trigger) {
    const lightbox = getEl('lightbox');
    if (!lightbox) return;

    lightboxItems = visibleLightboxTriggers();
    lightboxIndex = lightboxItems.indexOf(trigger);
    if (lightboxIndex === -1) lightboxIndex = 0;

    renderLightbox();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.lightbox-close')?.focus();
  }

  function animateStat(el) {
    const valueEl = el.querySelector('.stat-value');
    if (!valueEl || valueEl.dataset.animated) return;

    const raw = valueEl.dataset.value;
    if (!raw || raw === '∞' || Number.isNaN(Number(raw))) {
      valueEl.dataset.animated = 'true';
      return;
    }

    const target = Number(raw);
    const suffixEl = valueEl.querySelector('.stat-suffix');
    const suffix = suffixEl ? suffixEl.outerHTML : '';
    const duration = 1200;
    const start = performance.now();

    valueEl.dataset.animated = 'true';

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      valueEl.innerHTML = String(Math.round(eased * target)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    if (!prefersReducedMotion) requestAnimationFrame(step);
  }

  function initReveal() {
    const revealEls = document.querySelectorAll('.reveal:not(.visible)');
    if (!revealEls.length) return;

    if ('IntersectionObserver' in window && !prefersReducedMotion) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              if (entry.target.classList.contains('stat-item')) {
                animateStat(entry.target);
              }
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
      );
      revealEls.forEach((el) => observer.observe(el));
    } else {
      revealEls.forEach((el) => {
        el.classList.add('visible');
        if (el.classList.contains('stat-item')) animateStat(el);
      });
    }
  }

  function initNavState() {
    const navbar = getEl('navbar');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    closeLightbox();

    if (navbar) {
      navbar.classList.remove('nav--hidden');
      if (navbar.classList.contains('nav--inner')) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
      }
    }

    const navLinks = getEl('navLinks');
    const menuBtn = getEl('menuBtn');
    const navOverlay = getEl('navOverlay');
    navLinks?.classList.remove('active');
    navOverlay?.classList.remove('active');
    menuBtn?.classList.remove('is-open');
    menuBtn?.setAttribute('aria-expanded', 'false');

    lastScrollY = window.scrollY;
    getEl('backToTop')?.classList.toggle('visible', window.scrollY > 500);
  }

  function init() {
    initNavState();
    initReveal();
  }

  /* Event delegation — survives Astro view transitions */
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    if (target.closest('#menuBtn')) {
      toggleMenu();
      return;
    }

    if (target.closest('#navOverlay') || target.closest('.menu-close')) {
      toggleMenu(true);
      return;
    }

    if (target.closest('.nav-link')) {
      toggleMenu(true);
      return;
    }

    if (target.closest('.lightbox-close')) {
      closeLightbox();
      return;
    }

    if (target.closest('#lightboxPrev')) {
      stepLightbox(-1);
      return;
    }

    if (target.closest('#lightboxNext')) {
      stepLightbox(1);
      return;
    }

    const lightbox = getEl('lightbox');
    if (target === lightbox) {
      closeLightbox();
      return;
    }

    const lightboxTrigger = target.closest('[data-lightbox]');
    if (lightboxTrigger) {
      openLightbox(lightboxTrigger);
      return;
    }

    const filterBtn = target.closest('.filter-btn');
    if (filterBtn) {
      const filter = filterBtn.getAttribute('data-filter');
      const label = filterBtn.dataset.label ?? filterBtn.textContent?.trim() ?? '';
      const filterBtns = document.querySelectorAll('.filter-btn');
      const galleryItems = document.querySelectorAll('.gallery-item');
      const filterStatus = getEl('filterStatus');

      filterBtns.forEach((btn) => {
        btn.classList.toggle('active', btn === filterBtn);
        btn.setAttribute('aria-selected', btn === filterBtn ? 'true' : 'false');
      });

      let visibleCount = 0;
      galleryItems.forEach((item) => {
        const category = item.getAttribute('data-category');
        const show = filter === 'all' || category === filter;
        item.classList.toggle('is-hidden', !show);
        if (show) visibleCount++;
      });

      if (filterStatus) {
        filterStatus.textContent = filter === 'all'
          ? `Showing all ${galleryItems.length} photos`
          : `Showing ${visibleCount} ${label} photo${visibleCount !== 1 ? 's' : ''}`;
      }
    }

    if (target.closest('#backToTop')) {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  });

  document.addEventListener('keydown', (e) => {
    const lightboxActive = getEl('lightbox')?.classList.contains('active');

    if (e.key === 'Escape') {
      if (getEl('navLinks')?.classList.contains('active')) {
        toggleMenu(true);
        getEl('menuBtn')?.focus();
      }
      closeLightbox();
      return;
    }

    if (lightboxActive) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepLightbox(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepLightbox(-1);
      }
    }
  });

  /* Swipe navigation for the lightbox on touch devices */
  document.addEventListener(
    'touchstart',
    (e) => {
      if (!getEl('lightbox')?.classList.contains('active')) return;
      const touch = e.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    },
    { passive: true }
  );

  document.addEventListener(
    'touchend',
    (e) => {
      if (!getEl('lightbox')?.classList.contains('active')) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        stepLightbox(dx < 0 ? 1 : -1);
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const navbar = getEl('navbar');

        if (navbar) {
          navbar.classList.toggle('scrolled', scrollY > 50);
          if (!navbar.classList.contains('nav--inner')) {
            navbar.classList.toggle('nav--hidden', scrollY > lastScrollY && scrollY > 200);
          }
        }

        getEl('backToTop')?.classList.toggle('visible', scrollY > 500);
        lastScrollY = scrollY;
        ticking = false;
      });
    },
    { passive: true }
  );

  init();
  document.addEventListener('astro:page-load', init);
})();
