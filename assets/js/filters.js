(() => {
  const form = document.querySelector('[data-filters]');
  const grid = document.querySelector('[data-results]');
  if (!form || !grid) return;

  const DATA_SOURCE = 'data/properties.json';
  const UF_CLP = 38000;

  const formatUF = (value) =>
    typeof value === 'number'
      ? `UF ${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(value)}`
      : null;

  const formatCLP = (value) =>
    typeof value === 'number'
      ? new Intl.NumberFormat('es-CL', {
          style: 'currency',
          currency: 'CLP',
          maximumFractionDigits: 0,
        }).format(value)
      : null;

  const normalize = (value = '') =>
    value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const getQueryObject = () => Object.fromEntries(new URLSearchParams(location.search));
  const toQueryString = (values) => {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params.set(key, String(value).trim());
      }
    });
    return params.toString();
  };

  const getComparablePrice = (property, currency) => {
    if (currency === 'CLP') {
      if (typeof property.precio_clp === 'number') return property.precio_clp;
      if (typeof property.precio_uf === 'number') return property.precio_uf * UF_CLP;
      return null;
    }
    if (typeof property.precio_uf === 'number') return property.precio_uf;
    if (typeof property.precio_clp === 'number') return property.precio_clp / UF_CLP;
    return null;
  };

  const bestMeters = (property) => {
    if (typeof property.m2_util === 'number') return property.m2_util;
    if (typeof property.m2_total === 'number') return property.m2_total;
    if (typeof property.m2 === 'number') return property.m2;
    return null;
  };

  const prettifyPrice = (property) => {
    const labels = [];
    const uf = formatUF(property.precio_uf);
    const clp = formatCLP(property.precio_clp);
    if (uf) labels.push(uf);
    if (clp) labels.push(clp);
    return labels.length ? labels.join(' · ') : 'Precio a consultar';
  };

  const labelBadge = (property) => {
    const estado = property.estado ? property.estado.toString().toLowerCase() : '';
    if (estado && estado !== 'disponible') {
      return { label: estado.charAt(0).toUpperCase() + estado.slice(1), tone: 'muted' };
    }
    const operacion = property.operacion ? property.operacion.toString().toLowerCase() : '';
    if (operacion === 'venta') return { label: 'En venta', tone: 'accent' };
    if (operacion === 'arriendo') return { label: 'En arriendo', tone: 'accent' };
    return { label: 'Disponible', tone: 'accent' };
  };

  const applyFormValues = (values) => {
    Object.entries(values).forEach(([key, value]) => {
      const field = form.elements.namedItem(key);
      if (!field) return;
      if (field instanceof RadioNodeList) {
        field.value = value;
      } else {
        field.value = value;
      }
    });
  };

  const readFormValues = () => {
    const data = new FormData(form);
    const values = {};
    for (const [key, value] of data.entries()) {
      if (value !== '') values[key] = value;
    }
    return values;
  };

  let catalog = [];
  let defaultOperacion = '';

  const filterCatalog = (params) => {
    const moneda = params.moneda || 'UF';
    const needle = normalize(params.ubicacion || '');
    const min = params.precio_min ? Number(params.precio_min) : null;
    const max = params.precio_max ? Number(params.precio_max) : null;
    const dorms = params.dormitorios ? Number(params.dormitorios) : null;
    const baths = params.banos ? Number(params.banos) : null;
    const operacion = params.operacion || defaultOperacion;
    const tipo = params.tipo || '';

    const filtered = catalog.filter((property) => {
      if (property.publicado === false) return false;

      if (operacion && normalize(property.operacion) !== normalize(operacion)) {
        return false;
      }

      if (tipo && normalize(property.tipo) !== normalize(tipo)) {
        return false;
      }

      if (needle) {
        const hayCoincidencia = [property.comuna, property.barrio, property.calle, property.direccion]
          .filter(Boolean)
          .some((value) => normalize(value).includes(needle));
        if (!hayCoincidencia) return false;
      }

      const comparable = getComparablePrice(property, moneda);
      if (min !== null || max !== null) {
        if (comparable === null) return false;
        if (min !== null && comparable < min) return false;
        if (max !== null && comparable > max) return false;
      }

      if (dorms !== null) {
        if (typeof property.dormitorios !== 'number' || property.dormitorios < dorms) {
          return false;
        }
      }

      if (baths !== null) {
        if (typeof property.banos !== 'number' || property.banos < baths) {
          return false;
        }
      }

      return true;
    });

    const order = params.orden || 'precio-asc';

    const compareNullsLast = (a, b) => {
      if (a == null && b == null) return 0;
      if (a == null) return 1;
      if (b == null) return -1;
      return 0;
    };

    return filtered.sort((a, b) => {
      if (order === 'm2-asc' || order === 'm2-desc') {
        const aM = bestMeters(a);
        const bM = bestMeters(b);
        const nullCheck = compareNullsLast(aM, bM);
        if (nullCheck !== 0) return nullCheck;
        if (aM == null || bM == null) return 0;
        return order === 'm2-asc' ? aM - bM : bM - aM;
      }

      const aP = getComparablePrice(a, moneda);
      const bP = getComparablePrice(b, moneda);
      const nullCheck = compareNullsLast(aP, bP);
      if (nullCheck !== 0) return nullCheck;
      if (aP == null || bP == null) return 0;
      return order === 'precio-asc' ? aP - bP : bP - aP;
    });
  };

  const render = (rows, params) => {
    const moneda = params.moneda || 'UF';
    if (!rows.length) {
      grid.innerHTML = `
        <div class="card no-results">
          <h3>Sin propiedades que coincidan</h3>
          <p>Prueba con otro rango de valores o limpia los filtros seleccionados.</p>
          <button type="button" class="button button--ghost" data-clear>Limpiar filtros</button>
        </div>
      `;
      const clear = grid.querySelector('[data-clear]');
      clear?.addEventListener('click', clearFilters);
      grid.setAttribute('aria-busy', 'false');
      return;
    }

    const cards = rows
      .map((property) => {
        const { label, tone } = labelBadge(property);
        const badgeClass = tone === 'accent' ? 'property-card__badge property-card__badge--accent' : 'property-card__badge property-card__badge--muted';
        const image = Array.isArray(property.fotos) && property.fotos.length ? property.fotos[0] : 'assets/fotos/placeholder.jpg';
        const title = property.titulo || `${property.tipo || 'Propiedad'} en ${property.comuna || ''}`.trim();
        const ubicacion = [property.comuna, property.barrio, property.calle]
          .filter((part) => part && String(part).trim() !== '')
          .join(' · ');
        const dorms = typeof property.dormitorios === 'number' ? `${property.dormitorios}D` : '—D';
        const baths = typeof property.banos === 'number' ? `${property.banos}B` : '—B';
        const metros = bestMeters(property);
        const metrosLabel = metros ? `${metros} m²` : '— m²';
        const price = prettifyPrice(property);
        const contactUrl = `contacto.html?prop=${encodeURIComponent(property.slug || title)}`;

        return `
          <article class="property-card">
            <figure class="property-card__media">
              <div class="ratio-4-3">
                <img src="${image}" alt="${title}" loading="lazy" />
              </div>
              <span class="${badgeClass}">${label}</span>
            </figure>
            <div class="property-card__body">
              <h3 class="property-card__title">${title}</h3>
              <p class="property-card__location">${ubicacion || property.direccion || ''}</p>
              <p class="property-card__price">${price}</p>
              <p class="property-card__meta">${moneda === 'UF' ? 'Valores en UF' : 'Valores en CLP'}</p>
              <div class="property-card__features">
                <span>${dorms}</span>
                <span>${baths}</span>
                <span>${metrosLabel}</span>
              </div>
              <div class="property-card__actions">
                <a class="button button--ghost button--block" href="${contactUrl}">Solicitar información</a>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    grid.innerHTML = cards;
    grid.setAttribute('aria-busy', 'false');
  };

  const syncState = () => {
    const values = readFormValues();
    const query = toQueryString(values);
    history.replaceState(null, '', query ? `?${query}` : location.pathname);
    grid.setAttribute('aria-busy', 'true');
    const rows = filterCatalog(values);
    render(rows, values);
  };

  const clearFilters = () => {
    form.reset();
    if (defaultOperacion) {
      const operacionField = form.elements.namedItem('operacion');
      if (operacionField) {
        operacionField.value = defaultOperacion;
      }
    }
    history.replaceState(null, '', location.pathname);
    grid.setAttribute('aria-busy', 'true');
    const values = readFormValues();
    const rows = filterCatalog(values);
    render(rows, values);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    syncState();
  });

  form.addEventListener('change', syncState);

  form.querySelectorAll('[data-clear]').forEach((button) => {
    button.addEventListener('click', clearFilters);
  });

  const boot = async () => {
    const pathname = location.pathname;
    if (pathname.includes('arriendos')) {
      defaultOperacion = 'Arriendo';
    } else if (pathname.includes('venta')) {
      defaultOperacion = 'Venta';
    }

    grid.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch(DATA_SOURCE, { cache: 'no-cache' });
      catalog = await response.json();
    } catch (error) {
      console.error('Error cargando propiedades', error);
      grid.innerHTML = `
        <div class="card no-results">
          <h3>No pudimos cargar las propiedades</h3>
          <p>Revisa tu conexión e inténtalo nuevamente.</p>
        </div>
      `;
      grid.setAttribute('aria-busy', 'false');
      return;
    }

    const queryValues = getQueryObject();
    if (!queryValues.operacion && defaultOperacion) {
      queryValues.operacion = defaultOperacion;
    }

    applyFormValues(queryValues);
    syncState();
  };

  boot();
})();
