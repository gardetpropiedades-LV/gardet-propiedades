(() => {
  const header = document.querySelector('[data-site-header]');
  if (!header) return;

  const toggle = header.querySelector('[data-site-toggle]');
  const drawer = document.querySelector('[data-site-drawer]');
  const navLinks = header.querySelectorAll('[data-nav-link]');

  const focusableSelector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let isOpen = false;
  let lastFocused = null;
  let focusable = [];

  const updateScrolled = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };

  const refreshFocusable = () => {
    if (!drawer) return;
    focusable = Array.from(drawer.querySelectorAll(focusableSelector)).filter(
      (el) => !el.hasAttribute('tabindex') || el.tabIndex >= 0,
    );
  };

  const trapFocus = (event) => {
    if (!isOpen || event.key !== 'Tab' || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleKeydown = (event) => {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      closeDrawer();
      return;
    }
    trapFocus(event);
  };

  const handlePointerDown = (event) => {
    if (!drawer || !isOpen) return;
    if (drawer.contains(event.target) || event.target === toggle) return;
    closeDrawer();
  };

  const openDrawer = () => {
    if (isOpen || !toggle || !drawer) return;
    isOpen = true;
    lastFocused = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    refreshFocusable();
    const first = focusable[0];
    first?.focus({ preventScroll: true });
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('pointerdown', handlePointerDown);
  };

  const closeDrawer = (returnFocus = true) => {
    if (!isOpen || !drawer || !toggle) return;
    isOpen = false;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('pointerdown', handlePointerDown);
    if (returnFocus && lastFocused instanceof HTMLElement) {
      lastFocused.focus({ preventScroll: true });
    }
    lastFocused = null;
  };

  toggle?.addEventListener('click', () => {
    if (isOpen) {
      closeDrawer(false);
    } else {
      openDrawer();
    }
  });

  drawer?.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link) return;
    closeDrawer(false);
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 1025px)').matches) {
      closeDrawer(false);
    }
  });

  const markActiveLink = () => {
    const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const isIndex = current === '' || current === 'index.html';

    [...document.querySelectorAll('[data-nav-link]')].forEach((link) => {
      const href = link.getAttribute('href') || '';
      const file = href.split('/').pop()?.toLowerCase() || '';
      const match = file === current || (isIndex && (file === '' || file === '#'));
      if (match) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
  };

  markActiveLink();

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      markActiveLink();
    });
  });

  window.addEventListener(
    'scroll',
    () => {
      window.requestAnimationFrame(updateScrolled);
    },
    { passive: true },
  );

  updateScrolled();
})();
