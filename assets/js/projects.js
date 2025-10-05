(function () {
  const grid = document.querySelector('[data-projects-grid]');
  if (!grid) return;

  const PROJECTS_SOURCE = 'data/projects.json';
  const FALLBACK_IMAGE = 'assets/fotos/placeholder-project.svg';

  const setBusy = (isBusy) => {
    grid.setAttribute('aria-busy', isBusy ? 'true' : 'false');
  };

  setBusy(true);

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

  const formatEntrega = (value) => {
    if (!value) return null;
    if (/^\d{4}-\d{2}$/.test(value)) {
      const [year, month] = value.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(date);
    }
    return value; // permite "Inmediata" u otros textos
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return '';
    const normalized = status.toLowerCase();
    if (normalized.includes('inmediata')) return 'badge-status';
    if (normalized.includes('verde') || normalized.includes('pronta') || normalized.includes('lanzamiento')) return 'badge-soft';
    return 'badge-muted';
  };

  const createProjectCard = (project) => {
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
    const statusClass = getStatusBadgeClass(estado);
    const entregaFormatted = formatEntrega(entrega);
    const rangeLabel = formatUfRange(desde_uf, hasta_uf);
    const contactTarget = id || title;
    const contactUrl = `contacto.html?project=${encodeURIComponent(contactTarget)}`;

    return `
      <article class="card project-card">
        <figure class="project-card__media">
          <div class="ratio-4-3">
            <img src="${imageSrc}" alt="${title}" loading="lazy" />
          </div>
          ${estado ? `<span class="badge ${statusClass} project-card__status">${estado}</span>` : ''}
        </figure>
        <div class="project-card__body">
          <div class="project-card__headline">
            <h3>${title}</h3>
            ${ubicacion ? `<p class="project-card__location">${ubicacion}</p>` : ''}
          </div>
          <p class="project-card__price">Rango UF: ${rangeLabel}</p>
          ${
            tipologias || entregaFormatted
              ? `<p class="project-card__meta">
                   ${tipologias ? `Tipologías ${tipologias}` : ''}${tipologias && entregaFormatted ? ' • ' : ''}
                   ${entregaFormatted ? `Entrega ${entregaFormatted}` : ''}
                 </p>`
              : ''
          }
          <div class="project-card__actions">
            <a class="btn btn-primary" href="${contactUrl}">Solicitar información</a>
          </div>
        </div>
      </article>
    `;
  };

  const renderProjects = (projects) => {
    if (!Array.isArray(projects) || !projects.length) {
      grid.innerHTML = `
        <div class="card no-results">
          <h3>Pronto más proyectos</h3>
          <p>Estamos actualizando nuestro portafolio inmobiliario. Escríbenos para recibir novedades.</p>
        </div>`;
      return;
    }
    grid.innerHTML = projects.map(createProjectCard).join('');
  };

  fetch(PROJECTS_SOURCE)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(renderProjects)
    .catch((error) => {
      console.error('Error cargando proyectos:', error);
      grid.innerHTML = `
        <div class="card no-results">
          <h3>No pudimos cargar los proyectos</h3>
          <p>Intenta nuevamente en unos minutos o contáctanos directamente por WhatsApp.</p>
        </div>`;
    })
    .finally(() => setBusy(false));
})();
