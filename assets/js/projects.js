// File: assets/js/projects.js
// Renders project cards on /proyectos.html by reading data/projects.json
// Safe to paste over the entire file (removes any merge markers).

(() => {
  'use strict';

  const grid = document.querySelector('[data-projects-grid]');
  if (!grid) return;

  const PROJECTS_SOURCE = 'data/projects.json';
  const FALLBACK_IMAGE = 'assets/fotos/placeholder-project.svg';

  // Visual busy state for the grid
  const setBusy = (isBusy) => {
    grid.setAttribute('aria-busy', isBusy ? 'true' : 'false');
  };

  setBusy(true);

  // ---------- Formatting helpers ----------

  const formatNumberCL = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return null;
    const hasDecimals = Math.floor(value) !== value;
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: hasDecimals ? 2 : 0,
    }).format(value);
  };

  const formatUfRange = (from, to) => {
    const fromFormatted = formatNumberCL(from);
    const toFormatted = formatNumberCL(to);

    if (fromFormatted && toFormatted) {
      return `UF ${fromFormatted} – UF ${toFormatted}`;
    }
    if (fromFormatted) return `Desde UF ${fromFormatted}`;
    if (toFormatted) return `Hasta UF ${toFormatted}`;
    return 'Valores por confirmar';
  };

  const formatEntrega = (value) => {
    if (!value) return null;

    // "Inmediata" o cadenas similares -> retornar tal cual (con capitalización)
    const v = String(value).trim();
    if (/inmediata/i.test(v)) return 'inmediata';

    // Formato YYYY-MM
    if (/^\d{4}-\d{2}$/.test(v)) {
      const [year, month] = v.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return new Intl.DateTimeFormat('es-CL', {
        month: 'long',
        year: 'numeric',
      }).format(date);
    }

    // Cualquier otro texto
    return v;
  };

  const getStatusBadgeClass = (estado) => {
    if (!estado) return '';
    const s = estado.toLowerCase();
    if (s.includes('entrega inmediata') || s.includes('inmediata')) return 'badge-status';
    if (s.includes('verde') || s.includes('lanzamiento') || s.includes('pronta')) return 'badge-soft';
    return 'badge-muted';
  };

  // ---------- Small HTML helpers ----------

  const createBadge = (label) => {
    if (!label) return '';
    return `<span class="badge">${label}</span>`;
  };

  // ---------- Card renderer ----------

  const createProjectCard = (project) => {
    const {
      id,
      nombre,
      ubicacion,
      estado,
      tipologias,           // ej: "1D–2D" o "1–2D"
      desde_uf,
      hasta_uf,
      entrega,              // "inmediata" o "YYYY-MM" o texto
      etiquetas,            // array opcional de strings
      fotos,                // array de rutas (preferimos la 0)
      developer,            // opcional
    } = project;

    const title = nombre || 'Proyecto inmobiliario';
    const imageSrc = (Array.isArray(fotos) && fotos[0]) || FALLBACK_IMAGE;
    const estadoClass = getStatusBadgeClass(estado);
    const entregaFmt = formatEntrega(entrega);
    const badgesHtml = Array.isArray(etiquetas)
      ? etiquetas.map(createBadge).filter(Boolean).join(' ') // <- separadas con espacio
      : '';
    const rangoUf = formatUfRange(desde_uf, hasta_uf);
    const contactTarget = id || title;
    const contactUrl = `contacto.html?project=${encodeURIComponent(contactTarget)}`;

    // Bloque con meta (tipologías + entrega si existe)
    const meta =
      tipologias
        ? `Tipologías ${tipologias}${entregaFmt ? ` • Entrega ${entregaFmt}` : ''}`
        : entregaFmt
          ? `Entrega ${entregaFmt}`
          : '';

    return `
      <article class="card project-card">
        <figure class="project-card__media">
          <div class="ratio-4-3">
            <img src="${imageSrc}" alt="${title}" loading="lazy" />
          </div>
          ${estado ? `<span class="badge ${estadoClass} project-card__status">${estado}</span>` : ''}
        </figure>
        <div class="project-card__body">
          <div class="project-card__headline">
            <h3>${title}</h3>
            ${ubicacion ? `<p class="project-card__location">${ubicacion}</p>` : ''}
            ${developer ? `<p class="project-card__dev">Desarrolla: ${developer}</p>` : ''}
          </div>

          <p class="project-card__price">Rango UF: ${rangoUf}</p>
          ${meta ? `<p class="project-card__meta">${meta}</p>` : ''}
          ${badgesHtml ? `<div class="project-card__badges">${badgesHtml}</div>` : ''}

          <div class="project-card__actions">
            <a class="btn btn-primary" href="${contactUrl}">Solicitar información</a>
          </div>
        </div>
      </article>
    `;
  };

  const renderProjects = (projects) => {
    if (!Array.isArray(projects) || projects.length === 0) {
      grid.innerHTML = `
        <div class="card no-results">
          <h3>Pronto más proyectos</h3>
          <p>Estamos actualizando nuestro portafolio inmobiliario. Escríbenos para recibir novedades.</p>
        </div>
      `;
      return;
    }
    grid.innerHTML = projects.map(createProjectCard).join('');
  };

  // ---------- Fetch & render ----------

  fetch(PROJECTS_SOURCE, { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(renderProjects)
    .catch((err) => {
      console.error('Error cargando proyectos:', err);
      grid.innerHTML = `
        <div class="card no-results">
          <h3>No pudimos cargar los proyectos</h3>
          <p>Intenta nuevamente en unos minutos o contáctanos directamente por WhatsApp.</p>
        </div>
      `;
    })
    .finally(() => setBusy(false));
})();
