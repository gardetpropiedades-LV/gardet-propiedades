(() => {
  const grid = document.querySelector('[data-projects-grid]');
  if (!grid) return;

  const PROJECTS_SOURCE = 'data/projects.json';
  const FALLBACK_IMAGE = 'assets/fotos/placeholder-project.svg';

  const formatNumber = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return null;
    const hasDecimals = Math.floor(value) !== value;
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: hasDecimals ? 2 : 0,
    }).format(value);
  };

  const formatUfRange = (from, to) => {
    const fromFormatted = formatNumber(from);
    const toFormatted = formatNumber(to);

    if (fromFormatted && toFormatted) return `UF ${fromFormatted} – UF ${toFormatted}`;
    if (fromFormatted) return `Desde UF ${fromFormatted}`;
    if (toFormatted) return `Hasta UF ${toFormatted}`;
    return 'Valores por confirmar';
  };

  const normalizeStatus = (status = '') => status.toString().toLowerCase();

  const getBadge = (status) => {
    const normalized = normalizeStatus(status);
    if (!normalized) {
      return { label: 'Proyecto', tone: 'muted' };
    }

    if (normalized.includes('inmediata')) {
      return { label: 'Entrega inmediata', tone: 'accent' };
    }

    if (normalized.includes('verde')) {
      return { label: 'En verde', tone: 'accent' };
    }

    return { label: status, tone: 'muted' };
  };

  const renderProjects = (projects) => {
    if (!Array.isArray(projects) || projects.length === 0) {
      grid.innerHTML = `
        <div class="card no-results">
          <h3>Pronto más proyectos</h3>
          <p>Estamos incorporando nuevos desarrollos. Escríbenos para recibir novedades antes del lanzamiento.</p>
        </div>
      `;
      grid.setAttribute('aria-busy', 'false');
      return;
    }

    const cards = projects
      .map((project) => {
        const {
          nombre,
          ubicacion,
          estado,
          tipologias,
          desde_uf,
          hasta_uf,
          entrega,
          fotos,
          id,
        } = project;

        const title = nombre || 'Proyecto inmobiliario';
        const imageSrc = Array.isArray(fotos) && fotos.length ? fotos[0] : FALLBACK_IMAGE;
        const { label, tone } = getBadge(estado);
        const badgeClass = tone === 'accent' ? 'project-card__badge project-card__badge--accent' : 'project-card__badge';
        const rangeLabel = formatUfRange(desde_uf, hasta_uf);
        const entregaLabel = entrega ? `Entrega ${entrega}` : '';
        const metaParts = [tipologias ? `Tipologías ${tipologias}` : '', entregaLabel].filter(Boolean);
        const meta = metaParts.join(' • ');
        const contactTarget = id || title;
        const contactUrl = `contacto.html?project=${encodeURIComponent(contactTarget)}`;

        return `
          <article class="project-card">
            <figure class="project-card__media">
              <div class="ratio-4-3">
                <img src="${imageSrc}" alt="${title}" loading="lazy" />
              </div>
              <span class="${badgeClass}">${label}</span>
            </figure>
            <div class="project-card__body">
              <h3 class="project-card__title">${title}</h3>
              ${ubicacion ? `<p class="project-card__location">${ubicacion}</p>` : ''}
              <p class="project-card__price">${rangeLabel}</p>
              ${meta ? `<p class="project-card__meta">${meta}</p>` : ''}
              <div class="project-card__actions">
                <a class="button button--ghost button--block" href="${contactUrl}">Quiero información</a>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    grid.innerHTML = cards;
    grid.setAttribute('aria-busy', 'false');
  };

  const boot = async () => {
    grid.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch(PROJECTS_SOURCE, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const projects = await response.json();
      renderProjects(projects);
    } catch (error) {
      console.error('Error cargando proyectos', error);
      grid.innerHTML = `
        <div class="card no-results">
          <h3>No pudimos cargar los proyectos</h3>
          <p>Inténtalo nuevamente o escríbenos por WhatsApp para recibir asistencia inmediata.</p>
        </div>
      `;
      grid.setAttribute('aria-busy', 'false');
    }
  };

  boot();
})();
