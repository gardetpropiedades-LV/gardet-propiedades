(function(){
  // Carga del script oficial de Instagram para embeds
  const s = document.createElement('script');
  s.async = true;
  s.src = "https://www.instagram.com/embed.js";
  document.head.appendChild(s);

  // Cuando el DOM esté listo, inserta el blockquote del reel
  const onReady = () => {
    const container = document.querySelector('.insta-embed');
    if (!container) return;

    // Quita el fallback cuando inyectemos el embed
    const fb = container.querySelector('.insta-fallback');
    if (fb) fb.style.display = 'none';

    // Inserta el embed del reel
    const bq = document.createElement('blockquote');
    bq.className = 'instagram-media';
    bq.setAttribute('data-instgrm-permalink', 'https://www.instagram.com/reel/DPCyuKdDYr0/');
    bq.setAttribute('data-instgrm-version', '14');
    bq.style.margin = '0';
    container.appendChild(bq);

    // Procesa el embed
    const tryProcess = () => {
      if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
        window.instgrm.Embeds.process();
      } else {
        setTimeout(tryProcess, 300);
      }
    };
    tryProcess();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
