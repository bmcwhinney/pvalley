(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastScrollY = 0;
  let ticking = false;

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

  function openLightbox(src, alt) {
    const lightbox = getEl('lightbox');
    const lightboxImg = getEl('lightboxImg');
    const lightboxCaption = getEl('lightboxCaption');
    if (!lightbox || !lightboxImg) return;

    lightboxImg.src = src;
    lightboxImg.alt = alt;
    if (lightboxCaption) lightboxCaption.textContent = alt;
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

    const lightbox = getEl('lightbox');
    if (target === lightbox) {
      closeLightbox();
      return;
    }

    const lightboxTrigger = target.closest('[data-lightbox]');
    if (lightboxTrigger) {
      const img = lightboxTrigger.querySelector('img');
      if (img) openLightbox(img.src, img.alt);
      return;
    }

    const filterBtn = target.closest('.filter-btn');
    if (filterBtn) {
      const filter = filterBtn.getAttribute('data-filter');
      const label = filterBtn.textContent?.trim() ?? '';
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
    if (e.key !== 'Escape') return;
    if (getEl('navLinks')?.classList.contains('active')) {
      toggleMenu(true);
      getEl('menuBtn')?.focus();
    }
    closeLightbox();
  });

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
