const CANDIDATES = [
  'data/properties.json',
  '/gardet-propiedades/data/properties.json',
];

const STATE_KEYS = ['tipo', 'comuna', 'min', 'max'];
const PLACEHOLDER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900"><rect width="1200" height="900" fill="#e5e7eb"/><text x="50%" y="50%" fill="#6b7280" font-family="Inter, Arial, sans-serif" font-size="48" text-anchor="middle" dominant-baseline="middle">Gardet Propiedades</text></svg>';
const PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(PLACEHOLDER_SVG)}`;

const grid = document.getElementById('grid');
const form = document.getElementById('filters');

if (grid && form) {
  const params = new URLSearchParams(window.location.search);
  const currentState = Object.fromEntries(
    STATE_KEYS.map((key) => [key, params.get(key) ? params.get(key) : ''])
  );

  STATE_KEYS.forEach((key) => {
    const field = form.elements.namedItem(key);
    if (field) {
      field.value = currentState[key];
    }
  });

  const forceOperacion = window.location.pathname.includes('arriendos.html')
    ? 'Arriendo'
    : params.get('operacion') || '';

  let properties = [];

  init();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    STATE_KEYS.forEach((key) => {
      currentState[key] = (formData.get(key) || '').toString().trim();
    });

    updateQueryString();
    render(filterProperties(properties));
  });

  async function init() {
    renderSkeleton();
    try {
      properties = await loadProperties();
      render(filterProperties(properties));
    } catch (error) {
      renderError(error);
      console.error('Error cargando propiedades', error);
    }
  }

  function renderSkeleton() {
    grid.innerHTML = '<div class="card property-card">Cargando propiedades…</div>';
  }

  function renderError(error) {
    const message = error && error.message ? error.message : 'Intenta nuevamente en unos minutos.';
    grid.innerHTML = `<div class="card property-card no-results">No pudimos cargar las propiedades. ${message}</div>`;
  }

  function updateQueryString() {
    const url = new URL(window.location.href);
    STATE_KEYS.forEach((key) => {
      const value = currentState[key];
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.replaceState({}, '', url);
  }

  async function loadProperties() {
    for (const candidate of CANDIDATES) {
      try {
        const response = await fetch(candidate, { cache: 'no-cache' });
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn(`No se pudo leer ${candidate}`, error);
      }
    }
    throw new Error('Fuente de datos no disponible');
  }

  function filterProperties(list) {
    const tipoFilter = currentState.tipo;
    const comunaFilter = currentState.comuna.trim().toLowerCase();
    const min = parseNumber(currentState.min);
    const max = parseNumber(currentState.max);
    const minUF = Number.isFinite(min) ? min : null;
    const maxUF = Number.isFinite(max) ? max : null;

    return (Array.isArray(list) ? list : []).filter((property) => {
      if (!property || property.publicado !== true) return false;
      if (forceOperacion && property.operacion !== forceOperacion) return false;
      if (tipoFilter && property.tipo !== tipoFilter) return false;
      if (
        comunaFilter &&
        (typeof property.comuna !== 'string' ||
          !property.comuna.toLowerCase().includes(comunaFilter))
      ) {
        return false;
      }

      if (!pasaFiltroUF(property, minUF, maxUF)) {
        return false;
      }

      return true;
    });
  }

  function parseNumber(value) {
    if (!value) return NaN;
    const normalized = value
      .toString()
      .trim()
      .replace(/[^\d.,-]/g, '')
      .replace(/\.(?=.*\.)/g, '')
      .replace(',', '.');
    const number = Number.parseFloat(normalized);
    return Number.isFinite(number) ? number : NaN;
  }

  function render(propertiesToRender) {
    if (!propertiesToRender.length) {
      grid.innerHTML = `
        <div class="card property-card no-results">
          <div class="property-card__content">
            <h3>No encontramos propiedades con esos filtros</h3>
            <p>Prueba ajustando tu búsqueda o limpiando los filtros aplicados.</p>
          </div>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();

    propertiesToRender.forEach((property) => {
      fragment.appendChild(createCard(property));
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);
  }

  function createCard(property) {
    const card = document.createElement('article');
    card.className = 'card property-card';

    const media = document.createElement('div');
    media.className = 'property-card__media ratio-4-3';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = property.titulo || 'Propiedad en arriendo';

    const source = selectPrimaryPhoto(property);
    img.src = source;
    attachImageFallback(img, PLACEHOLDER_IMAGE);
    media.appendChild(img);

    const content = document.createElement('div');
    content.className = 'property-card__content';

    const badges = document.createElement('div');
    badges.className = 'property-card__badges';
    badges.appendChild(createBadge(property.operacion || 'Operación', 'badge-soft'));
    const statusBadge = createStatusBadge(property.estado);
    if (statusBadge) {
      badges.appendChild(statusBadge);
    }

    const title = document.createElement('h3');
    title.textContent = property.titulo || 'Propiedad sin título';

    const location = document.createElement('p');
    location.className = 'property-card__location';
    location.textContent = property.comuna || '';

    const price = document.createElement('p');
    price.className = 'property-card__price';
    const priceText = getPrecioTexto(property);
    price.textContent = priceText || 'Precio no disponible';

    const details = document.createElement('p');
    details.className = 'property-card__details';
    const area = property.m2_util ?? property.m2_total ?? property.superficie_total;
    const dormitorios = Number.isFinite(Number(property.dormitorios)) ? property.dormitorios : '—';
    const banos = Number.isFinite(Number(property.banos)) ? property.banos : '—';
    const areaText = Number.isFinite(Number(area)) ? `${area} m²` : '— m²';
    details.textContent = `${areaText} · ${dormitorios} D · ${banos} B`;

    const actions = document.createElement('div');
    actions.className = 'property-card__actions';
    const button = document.createElement('a');
    button.href = '#';
    button.className = 'btn btn-primary';
    button.textContent = 'Ver detalles';
    actions.appendChild(button);

    content.append(badges, title, location, price, details, actions);

    card.append(media, content);
    return card;
  }

  function selectPrimaryPhoto(property) {
    if (!property) return PLACEHOLDER_IMAGE;
    const photos = Array.isArray(property.fotos)
      ? property.fotos.filter((src) => typeof src === 'string' && src.trim())
      : [];
    const primary = photos.length ? photos[0] : '';
    if (!primary) return PLACEHOLDER_IMAGE;
    return primary;
  }

  function attachImageFallback(img, fallback) {
    if (!img) return;
    let attempted = false;
    img.addEventListener('error', () => {
      if (attempted) return;
      attempted = true;
      img.src = fallback;
    });
  }

  function createStatusBadge(status) {
    if (!status) return null;
    const badge = document.createElement('span');
    let className = 'badge';
    let text = status;

    if (status === 'disponible') {
      className += ' badge-ok';
      text = 'Disponible';
    } else if (status === 'arrendado') {
      className += ' badge-muted';
      text = 'Arrendado';
    } else {
      className += ' badge-soft';
      text = capitalize(status);
    }

    badge.className = className;
    badge.textContent = text;
    return badge;
  }

  function createBadge(text, extraClass = '') {
    const badge = document.createElement('span');
    badge.className = extraClass ? `badge ${extraClass}` : 'badge';
    badge.textContent = text || '';
    return badge;
  }

  function capitalize(value) {
    if (!value) return '';
    const text = value.toString();
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function getPrecioTexto(property) {
    if (!property) return '';
    if (property.precio_clp_noche != null) {
      return `${fmtCLP(property.precio_clp_noche)} / noche`;
    }
    if (property.precio_uf != null) {
      return `UF ${formatUF(property.precio_uf)}`;
    }
    return '';
  }

  function fmtCLP(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '';
    return number.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    });
  }

  function formatUF(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return value ?? '';
    }
    return number.toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  function pasaFiltroUF(property, minUF, maxUF) {
    const hasMin = Number.isFinite(minUF);
    const hasMax = Number.isFinite(maxUF);
    if (!hasMin && !hasMax) return true;
    if (property == null || property.precio_uf == null) return false;

    const price = Number(property.precio_uf);
    if (!Number.isFinite(price)) return false;
    if (hasMin && price < minUF) return false;
    if (hasMax && price > maxUF) return false;
    return true;
  }
}
