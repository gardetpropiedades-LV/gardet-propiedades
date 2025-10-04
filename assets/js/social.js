(function(){
  const container = document.querySelector('[data-instagram-reel]');
  if (!container) return;

  const reelUrl = container.getAttribute('data-instagram-reel');
  if (!reelUrl) return;

  const fallback = container.querySelector('.insta-fallback');
  const ctaText = container.getAttribute('data-instagram-cta') || 'Ver en Instagram';
  const ensureFallbackLink = () => {
    if (!fallback) return;
    const existingLink = fallback.querySelector('a');
    if (!existingLink) {
      const link = document.createElement('a');
      link.className = 'btn';
      link.href = reelUrl;
      link.target = '_blank';
      link.rel = 'noreferrer noopener';
      link.textContent = ctaText;
      fallback.appendChild(link);
    }
  };

  const ensureScript = () => new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-instagram-embed]');
    if (existing) {
      if (existing.dataset.loaded === 'true' || window.instgrm) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.instagram.com/embed.js';
    script.dataset.instagramEmbed = 'true';
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });
    script.addEventListener('error', reject, { once: true });
    document.head.appendChild(script);
  });

  const renderEmbed = () => {
    const fb = fallback;
    if (fb) {
      fb.style.display = 'none';
    }

    const existingEmbed = container.querySelector('blockquote.instagram-media');
    if (!existingEmbed) {
      const bq = document.createElement('blockquote');
      bq.className = 'instagram-media';
      bq.setAttribute('data-instgrm-permalink', reelUrl);
      bq.setAttribute('data-instgrm-version', '14');
      bq.style.margin = '0';
      container.appendChild(bq);
    }

    const processEmbed = () => {
      if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
        window.instgrm.Embeds.process();
      } else {
        window.setTimeout(processEmbed, 250);
      }
    };
    processEmbed();
  };

  const handleError = () => {
    ensureFallbackLink();
    if (fallback) {
      fallback.style.display = 'block';
    }
  };

  const init = () => {
    ensureScript()
      .then(() => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', renderEmbed, { once: true });
        } else {
          renderEmbed();
        }
      })
      .catch(handleError);
  };

  init();
})();
