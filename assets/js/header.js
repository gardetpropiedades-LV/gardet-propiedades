(function () {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  const toggle = header.querySelector('[data-nav-toggle]');
  const drawer = header.querySelector('[data-nav-drawer]');
  const overlay = document.querySelector('[data-drawer-overlay]');
  const body = document.body;

  if (!toggle || !drawer) return;

  const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;
  const SCROLLED_CLASS = 'is-scrolled';

  const getOverlaySources = () => {
    if (!overlay?.dataset.active) return [];
    return overlay.dataset.active.split(',').filter(Boolean);
  };

  const showOverlay = (source) => {
    if (!overlay) return;
    const sources = getOverlaySources();
    if (!sources.includes(source)) {
      sources.push(source);
      overlay.dataset.active = sources.join(',');
    }
    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');
  };

  const hideOverlay = (source) => {
    if (!overlay) return;
    const sources = getOverlaySources().filter((item) => item !== source);
    if (sources.length) {
      overlay.dataset.active = sources.join(',');
    } else {
      delete overlay.dataset.active;
      overlay.classList.remove('is-visible');
      overlay.setAttribute('aria-hidden', 'true');
    }
  };

  const getLockSources = () => {
    if (!body.dataset.lockSources) return [];
    return body.dataset.lockSources.split(',').filter(Boolean);
  };

  const lockScroll = (source) => {
    const locks = getLockSources();
    if (!locks.includes(source)) {
      locks.push(source);
      body.dataset.lockSources = locks.join(',');
    }
    body.classList.add('no-scroll');
  };

  const unlockScroll = (source) => {
    const locks = getLockSources().filter((item) => item !== source);
    if (locks.length) {
      body.dataset.lockSources = locks.join(',');
    } else {
      delete body.dataset.lockSources;
      body.classList.remove('no-scroll');
    }
  };

  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let releaseTrap = null;

  const trapFocus = (container) => {
    const focusable = Array.from(container.querySelectorAll(focusableSelector)).filter((el) => el.offsetParent !== null || getComputedStyle(el).position === 'fixed');
    if (!focusable.length) return () => {};
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeydown = (event) => {
      if (event.key !== 'Tab') return;
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeydown);
    return () => {
      container.removeEventListener('keydown', handleKeydown);
    };
  };

  let isOpen = false;
  let lastFocused = null;

  const openDrawer = () => {
    if (isOpen || !isMobile()) return;
    isOpen = true;
    lastFocused = document.activeElement;
    header.classList.add('is-drawer-open');
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    showOverlay('nav');
    lockScroll('nav');
    releaseTrap = trapFocus(drawer);
    const firstLink = drawer.querySelector('a, button');
    firstLink?.focus({ preventScroll: true });
  };

  const closeDrawer = (returnFocus = true) => {
    if (!isOpen) return;
    isOpen = false;
    header.classList.remove('is-drawer-open');
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    releaseTrap?.();
    releaseTrap = null;
    hideOverlay('nav');
    unlockScroll('nav');
    if (returnFocus && lastFocused instanceof HTMLElement) {
      lastFocused.focus({ preventScroll: true });
    }
    lastFocused = null;
  };

  toggle.addEventListener('click', () => {
    if (isOpen) {
      closeDrawer(false);
    } else {
      openDrawer();
    }
  });

  const shouldKeepDefaultNavigation = (event, link) =>
    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank';

  drawer.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link) return;

    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) {
      event.preventDefault();
      closeDrawer(false);
      const anchor = document.querySelector(href);
      anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const allowBrowserNavigation = shouldKeepDefaultNavigation(event, link);
    if (!allowBrowserNavigation) {
      event.preventDefault();
    }

    closeDrawer(false);

    if (!allowBrowserNavigation) {
      const targetHref = link.href;
      window.requestAnimationFrame(() => {
        window.location.assign(targetHref);
      });
    }
  });

  overlay?.addEventListener('click', () => {
    if (isOpen) {
      closeDrawer();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) {
      closeDrawer();
    }
  });

  window.addEventListener('resize', () => {
    if (!isMobile()) {
      closeDrawer(false);
    }
  });

  const updateScrolled = () => {
    const shouldAdd = window.scrollY > 12;
    header.classList.toggle(SCROLLED_CLASS, shouldAdd);
  };

  let scrollTicking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(() => {
          updateScrolled();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    },
    { passive: true }
  );

  updateScrolled();
})();

// ===== HOTFIX: anula cualquier intento de abrir el panel lateral del buscador
(() => {
  const kill = (sel) =>
    document.querySelectorAll(sel).forEach((el) => {
      el.addEventListener(
        'click',
        () => {
          document.body.classList.remove('drawer-open', 'is-locked', 'nav-locked', 'no-scroll');
          const rail = document.querySelector('.hero-search-rail,[data-search-rail],[data-search-panel]');
          if (rail) {
            rail.style.display = 'none';
          }
        },
        true,
      );
    });

  kill('#hs_operacion, #hs_tipo, #hs_ubicacion, #hs_min, #hs_max, #hs_moneda, #hs_submit, .hero .select, .hero .input, .hero .btn');
})();
