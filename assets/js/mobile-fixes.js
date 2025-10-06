// Móvil: quita locks del body, cierra overlays residuales y evita que el menú lateral bloquee la pantalla
(() => {
  const unlock = () => {
    document.body.classList.remove('drawer-open', 'is-locked', 'nav-locked', 'no-scroll');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    const rails = document.querySelectorAll('.hero-search-rail,[data-search-rail],[data-search-panel],.drawer-backdrop,.drawer-rail');
    rails.forEach((el) => {
      el.style.display = 'none';
    });
  };

  // Al cargar y al cambiar orientación, aseguramos estado limpio
  window.addEventListener('load', unlock);
  window.addEventListener('orientationchange', () => setTimeout(unlock, 150));

  // Si hay enlaces en el menú móvil, cierran el menú al navegar
  document.addEventListener(
    'click',
    (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      // Cierra cualquier overlay antes de navegar
      unlock();
    },
    true,
  );
})();
