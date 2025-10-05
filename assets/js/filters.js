(function(){
  const qs = (s, c = document) => c.querySelector(s);
  const qsa = (s, c = document) => Array.from(c.querySelectorAll(s));

  const DATA_SRC = 'data/properties.json';
  const UF_CLP = 38000; // ajustar manualmente cuando corresponda

  const normalize = (s = '') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const formatUF = (n) => (n == null ? '—' : `UF ${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(n)}`);
  const formatCLP = (n) => (n == null ? '—' : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n));

  const parseQs = () => Object.fromEntries(new URLSearchParams(location.search));
  const stringifyQs = (obj) => new URLSearchParams(obj).toString();

  const getPrecio = (p, moneda) => {
    if (moneda === 'UF') {
      if (typeof p.precio_uf === 'number') return p.precio_uf;
      if (typeof p.precio_clp === 'number') return p.precio_clp / UF_CLP;
      return null;
    }
    if (typeof p.precio_clp === 'number') return p.precio_clp;
    if (typeof p.precio_uf === 'number') return p.precio_uf * UF_CLP;
    return null;
  };

  let all = [];
  let form;
  let grid;
  let pageOperacion = '';

  const readForm = () => {
    const fd = new FormData(form);
    const obj = {};
    for (const [k, v] of fd.entries()) {
      if (v !== '') obj[k] = v;
    }
    return obj;
  };

  const applyFormFromQs = (qsObj) => {
    Object.entries(qsObj).forEach(([k, v]) => {
      const field = form.elements.namedItem(k);
      if (!field) return;
      if (field instanceof RadioNodeList) {
        field.value = v;
      } else {
        field.value = v;
      }
    });
  };

  const filterData = (params) => {
    const moneda = params.moneda || 'UF';
    const needle = normalize(params.ubicacion || '');
    const min = params.min ? Number(params.min) : null;
    const max = params.max ? Number(params.max) : null;
    const dorms = params.dorms ? Number(params.dorms) : null;
    const banos = params.banos ? Number(params.banos) : null;

    const filtered = all.filter((p) => {
      if (p?.publicado !== true) return false;

      if (params.operacion && p.operacion !== params.operacion) return false;
      if (params.tipo && p.tipo !== params.tipo) return false;

      if (needle) {
        const hay = [p.comuna, p.barrio, p.calle, p.direccion].some((field) => normalize(field || '').includes(needle));
        if (!hay) return false;
      }

      const precio = getPrecio(p, moneda);
      if (min != null || max != null) {
        if (precio == null) return false;
        if (min != null && precio < min) return false;
        if (max != null && precio > max) return false;
      }

      if (dorms != null) {
        if (typeof p.dormitorios !== 'number' || p.dormitorios < dorms) return false;
      }

      if (banos != null) {
        if (typeof p.banos !== 'number' || p.banos < banos) return false;
      }

      return true;
    });

    const orden = params.orden || 'precio-asc';
    const monedaOrden = params.moneda || 'UF';

    const compareNullLast = (a, b) => {
      if (a == null && b == null) return 0;
      if (a == null) return 1;
      if (b == null) return -1;
      return 0;
    };

    return filtered.sort((a, b) => {
      if (orden === 'precio-asc' || orden === 'precio-desc') {
        const pa = getPrecio(a, monedaOrden);
        const pb = getPrecio(b, monedaOrden);
        const nullCmp = compareNullLast(pa, pb);
        if (nullCmp !== 0) return nullCmp;
        if (pa == null || pb == null) return 0;
        return orden === 'precio-asc' ? pa - pb : pb - pa;
      }

      const ma = typeof a.m2_util === 'number' ? a.m2_util : null;
      const mb = typeof b.m2_util === 'number' ? b.m2_util : null;
      const nullCmp = compareNullLast(ma, mb);
      if (nullCmp !== 0) return nullCmp;
      if (ma == null || mb == null) return 0;
      return orden === 'm2-asc' ? ma - mb : mb - ma;
    });
  };

  const titleCase = (s = '') => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  const render = (rows, params) => {
    const moneda = params.moneda || 'UF';
    const fmt = moneda === 'UF' ? formatUF : formatCLP;

    if (!rows.length) {
      grid.innerHTML = `
        <div class="card no-results">
          <h3>Sin resultados</h3>
          <p>Ajusta los filtros o limpia la búsqueda para ver más propiedades.</p>
          <button class="btn" type="button" data-clear>Limpiar filtros</button>
        </div>
      `;
      grid.setAttribute('aria-busy', 'false');
      const clearBtn = grid.querySelector('[data-clear]');
      if (clearBtn) clearBtn.addEventListener('click', onClear);
      return;
    }

    const cards = rows.map((p) => {
      const precio = getPrecio(p, moneda);
      const foto = (Array.isArray(p.fotos) && p.fotos[0]) || 'assets/fotos/placeholder.jpg';
      const sub = [p.comuna, p.barrio || p.calle].filter(Boolean).join(' · ');
      const dorms = typeof p.dormitorios === 'number' ? p.dormitorios : '—';
      const banos = typeof p.banos === 'number' ? p.banos : '—';
      const m2 = typeof p.m2_util === 'number' && !Number.isNaN(p.m2_util) ? p.m2_util : '—';
      const title = p.titulo || `${p.tipo || 'Propiedad'} en ${p.comuna || ''}`.trim();
      const estadoBadge = p.estado && p.estado.toLowerCase() !== 'disponible'
        ? `<span class="badge badge-vendido">${titleCase(p.estado)}</span>`
        : '';

      return `
        <article class="card property-card" data-slug="${p.slug}">
          <figure class="property-card__media ratio">
            <img src="${foto}" alt="${title}" loading="lazy">
          </figure>
          <div class="property-card__content">
            <div class="property-card__badges">
              <span class="badge">${p.operacion || 'Operación'}</span>
              ${estadoBadge}
            </div>
            <h3>${title}</h3>
            <p class="property-card__location">${sub || p.direccion || ''}</p>
            <p class="property-card__price">${fmt(precio)}</p>
            <p class="property-card__details">${dorms}D · ${banos}B · ${m2} m²</p>
            <div class="property-card__actions">
              <a class="btn" href="contacto.html?prop=${encodeURIComponent(p.slug)}">Ver detalles</a>
            </div>
          </div>
        </article>
      `;
    });

    grid.innerHTML = cards.join('');
    grid.setAttribute('aria-busy', 'false');
  };

  const syncAndRender = () => {
    const params = readForm();
    const qsStr = stringifyQs(params);
    history.replaceState(null, '', qsStr ? `?${qsStr}` : location.pathname);
    grid.setAttribute('aria-busy', 'true');
    const rows = filterData(params);
    render(rows, params);
  };

  const onSubmit = (event) => {
    if (event) event.preventDefault();
    syncAndRender();
  };

  const onClear = () => {
    form.reset();
    if (pageOperacion && form.elements.operacion) {
      form.elements.operacion.value = pageOperacion;
    }
    history.replaceState(null, '', location.pathname);
    grid.setAttribute('aria-busy', 'true');
    const params = readForm();
    const rows = filterData(params);
    render(rows, params);
  };

  const boot = async () => {
    form = qs('[data-filters]');
    grid = qs('[data-results]');
    if (!form || !grid) return;

    const pathname = location.pathname;
    const isArriendo = pathname.includes('arriendos');
    const isVenta = pathname.includes('venta');
    pageOperacion = isArriendo ? 'Arriendo' : isVenta ? 'Venta' : '';

    try {
      grid.setAttribute('aria-busy', 'true');
      const res = await fetch(DATA_SRC, { cache: 'no-cache' });
      all = await res.json();
    } catch (error) {
      console.error('No se pudo cargar el catálogo de propiedades', error);
      grid.innerHTML = '<p class="card error">No pudimos cargar las propiedades. Intenta nuevamente.</p>';
      grid.setAttribute('aria-busy', 'false');
      return;
    }

    const qsObj = parseQs();
    if (!qsObj.operacion && pageOperacion) {
      qsObj.operacion = pageOperacion;
    }

    applyFormFromQs(qsObj);

    form.addEventListener('submit', onSubmit);
    form.addEventListener('change', (event) => {
      if (['moneda', 'orden'].includes(event.target.name)) {
        syncAndRender();
      }
    });

    qsa('[data-clear]', form).forEach((btn) => btn.addEventListener('click', onClear));

    syncAndRender();
  };

  boot();
})();
