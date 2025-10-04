(function () {
  const root = document.querySelector('[data-hero-search]');
  if (!root) return;

  const overlay = document.querySelector('[data-drawer-overlay]');
  const body = document.body;

  const getOverlaySources = () => {
    if (!overlay?.dataset.active) return [];
    return overlay.dataset.active.split(',').filter(Boolean);
  };

  const showOverlay = (source) => {
    if (!overlay) return;
    const sources = getOverlaySources();
    if (!sources.includes(source)) {
      sources.push(source);
      overlay.dataset.active = sources.join(',');
    }
    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');
  };

  const hideOverlay = (source) => {
    if (!overlay) return;
    const sources = getOverlaySources().filter((item) => item !== source);
    if (sources.length) {
      overlay.dataset.active = sources.join(',');
    } else {
      delete overlay.dataset.active;
      overlay.classList.remove('is-visible');
      overlay.setAttribute('aria-hidden', 'true');
    }
  };

  const getLockSources = () => {
    if (!body.dataset.lockSources) return [];
    return body.dataset.lockSources.split(',').filter(Boolean);
  };

  const lockScroll = (source) => {
    const locks = getLockSources();
    if (!locks.includes(source)) {
      locks.push(source);
      body.dataset.lockSources = locks.join(',');
    }
    body.classList.add('no-scroll');
  };

  const unlockScroll = (source) => {
    const locks = getLockSources().filter((item) => item !== source);
    if (locks.length) {
      body.dataset.lockSources = locks.join(',');
    } else {
      delete body.dataset.lockSources;
      body.classList.remove('no-scroll');
    }
  };

  const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

  const state = {
    q: '',
    op: 'venta',
    min: '',
    max: '',
    moneda: 'uf',
    tipo: 'all',
    nuevos: false,
    panel: null,
  };

  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let releaseTrap = null;

  const trapFocus = (container) => {
    const focusable = Array.from(container.querySelectorAll(focusableSelector)).filter((el) => el.offsetParent !== null || getComputedStyle(el).position === 'fixed');
    if (!focusable.length) return () => {};
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeydown = (event) => {
      if (event.key !== 'Tab') return;
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeydown);
    return () => {
      container.removeEventListener('keydown', handleKeydown);
    };
  };

  const focusFirstControl = (panelKey) => {
    if (panelKey === 'loc') {
      document.getElementById('q')?.focus({ preventScroll: true });
    } else if (panelKey === 'op') {
      const activeTab = panelOp.querySelector('.tab-op.is-active');
      activeTab?.focus({ preventScroll: true });
    } else if (panelKey === 'type') {
      const checked = panelType.querySelector('input[name="tipo"]:checked');
      checked?.focus({ preventScroll: true });
    }
  };

  const cap = (value) =>
    value
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const tipoSummary = {
    all: 'Cualquiera',
    casa: 'Casas',
    depto: 'Departamentos',
    oficina: 'Oficinas',
    local: 'Locales',
    terreno: 'Terrenos',
    campo: 'Campos',
    bodega: 'Bodegas',
    estacionamiento: 'Estacionamientos',
  };

  const formatNumber = (value) => Number(value).toLocaleString('es-CL');

  const buildRangeText = (min, max, currency) => {
    if (!min && !max) return 'Todos los precios';
    if (min && max) {
      if (currency === 'uf') {
        return `UF ${formatNumber(min)}–${formatNumber(max)}`;
      }
      return `CLP $${formatNumber(min)}–$${formatNumber(max)}`;
    }
    if (min) {
      if (currency === 'uf') {
        return `≥ UF ${formatNumber(min)}`;
      }
      return `≥ CLP $${formatNumber(min)}`;
    }
    if (currency === 'uf') {
      return `≤ UF ${formatNumber(max)}`;
    }
    return `≤ CLP $${formatNumber(max)}`;
  };

  const updateSummaries = () => {
    const locSummary = state.q ? cap(state.q) : 'Cualquiera';
    const opTxt = state.op === 'venta' ? 'Venta' : 'Arriendo';
    const rangeTxt = buildRangeText(state.min, state.max, state.moneda);
    const tipoBase = tipoSummary[state.tipo] || cap(state.tipo);
    const nuevosTxt = state.nuevos ? ' · Nuevos' : '';

    const locEl = document.getElementById('seg-loc-sub');
    const opEl = document.getElementById('seg-op-sub');
    const typeEl = document.getElementById('seg-type-sub');

    if (locEl) locEl.textContent = locSummary;
    if (opEl) opEl.textContent = `${opTxt} | ${rangeTxt}`;
    if (typeEl) typeEl.textContent = `${tipoBase}${nuevosTxt}`;
  };

  const panelLoc = document.getElementById('panel-loc');
  const panelOp = document.getElementById('panel-op');
  const panelType = document.getElementById('panel-type');

  const panels = {
    loc: panelLoc,
    op: panelOp,
    type: panelType,
  };

  const chips = {
    loc: document.getElementById('seg-loc'),
    op: document.getElementById('seg-op'),
    type: document.getElementById('seg-type'),
  };

  const showPanel = (key) => {
    if (state.panel === key) {
      updateSummaries();
      closePanels(true);
      return;
    }
    closePanels(false);
    const chip = chips[key];
    const panel = panels[key];
    if (!chip || !panel) return;
    state.panel = key;
    chip.setAttribute('aria-expanded', 'true');
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');

    if (isMobile()) {
      showOverlay('hero');
      lockScroll('hero');
    }

    releaseTrap = trapFocus(panel);
    focusFirstControl(key);
  };

  const closePanels = (returnFocus = true) => {
    if (!state.panel) return;
    const key = state.panel;
    const chip = chips[key];
    const panel = panels[key];
    state.panel = null;
    if (chip) {
      chip.setAttribute('aria-expanded', 'false');
    }
    if (panel) {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
    }
    releaseTrap?.();
    releaseTrap = null;
    if (isMobile()) {
      hideOverlay('hero');
      unlockScroll('hero');
    }
    if (returnFocus && chip) {
      chip.focus({ preventScroll: true });
    }
  };

  const validPrices = () => {
    if (!state.min || !state.max) return true;
    return Number(state.min) <= Number(state.max);
  };

  const updatePriceHint = () => {
    const hint = document.getElementById('hint-price');
    const applyBtn = panelOp?.querySelector('.btn-apply');
    const isValid = validPrices();
    if (!panelOp || !hint || !applyBtn) return;
    if (state.min && state.max && !isValid) {
      hint.hidden = false;
      applyBtn.setAttribute('disabled', 'true');
    } else {
      hint.hidden = true;
      applyBtn.removeAttribute('disabled');
    }
  };

  const sanitizeNumeric = (value) => value.replace(/[^0-9]/g, '');

  const parseQuery = () => {
    const params = new URLSearchParams(window.location.search);
    const op = params.get('op');
    const min = params.get('min');
    const max = params.get('max');
    const moneda = params.get('moneda');
    const q = params.get('q');
    const tipo = params.get('tipo');
    const nuevos = params.get('nuevos');

    if (op === 'venta' || op === 'arriendo') state.op = op;
    if (min) state.min = sanitizeNumeric(min);
    if (max) state.max = sanitizeNumeric(max);
    if (moneda === 'clp' || moneda === 'uf') state.moneda = moneda;
    if (q) state.q = q;
    if (tipo && tipoSummary[tipo]) state.tipo = tipo;
    if (nuevos === '1') state.nuevos = true;
  };

  const syncControls = () => {
    const qInput = document.getElementById('q');
    const minInput = document.getElementById('min');
    const maxInput = document.getElementById('max');
    const monedaSelect = document.getElementById('moneda');
    const nuevosToggle = document.getElementById('nuevos');

    if (qInput) qInput.value = state.q;
    if (minInput) minInput.value = state.min;
    if (maxInput) maxInput.value = state.max;
    if (monedaSelect) monedaSelect.value = state.moneda;
    if (nuevosToggle) nuevosToggle.checked = state.nuevos;

    panelOp?.querySelectorAll('.tab-op').forEach((tab) => {
      const value = tab.getAttribute('data-op');
      tab.classList.toggle('is-active', value === state.op);
      tab.setAttribute('aria-selected', value === state.op ? 'true' : 'false');
      tab.setAttribute('tabindex', value === state.op ? '0' : '-1');
    });

    panelType?.querySelectorAll('input[name="tipo"]').forEach((radio) => {
      radio.checked = radio.value === state.tipo;
    });
  };

  const buildQueryFromState = () => {
    const qs = new URLSearchParams();
    qs.set('op', state.op);
    if (state.min) qs.set('min', state.min);
    if (state.max) qs.set('max', state.max);
    if (state.moneda) qs.set('moneda', state.moneda);
    if (state.q) qs.set('q', state.q);
    if (state.tipo !== 'all') qs.set('tipo', state.tipo);
    if (state.nuevos) qs.set('nuevos', '1');
    return qs.toString();
  };

  root.querySelectorAll('[data-panel-trigger]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const key = trigger.getAttribute('data-panel-trigger');
      if (!key) return;
      showPanel(key);
    });
  });

  document.querySelectorAll('.btn-apply').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-close');
      if (!key) return;
      if (key === 'op' && !validPrices()) {
        const hint = document.getElementById('hint-price');
        hint?.classList.add('shake');
        window.setTimeout(() => hint?.classList.remove('shake'), 350);
        return;
      }
      updateSummaries();
      closePanels(true);
    });
  });

  document.querySelectorAll('[data-panel-dismiss]').forEach((btn) => {
    btn.addEventListener('click', () => {
      updateSummaries();
      closePanels(true);
    });
  });

  overlay?.addEventListener('click', () => {
    if (state.panel && isMobile()) {
      updateSummaries();
      closePanels(true);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.panel) {
      updateSummaries();
      closePanels(true);
    }
  });

  document.addEventListener('mousedown', (event) => {
    if (state.panel && !isMobile()) {
      const openPanel = panels[state.panel];
      if (!openPanel) return;
      const isInside = openPanel.contains(event.target) || root.contains(event.target);
      if (!isInside) {
        updateSummaries();
        closePanels(false);
      }
    }
  });

  const qInput = document.getElementById('q');
  qInput?.addEventListener('input', (event) => {
    const value = event.target.value;
    state.q = value;
  });

  panelOp?.querySelectorAll('.tab-op').forEach((tab) => {
    tab.addEventListener('click', () => {
      const op = tab.getAttribute('data-op');
      if (!op) return;
      state.op = op;
      panelOp.querySelectorAll('.tab-op').forEach((item) => {
        const value = item.getAttribute('data-op');
        const isActive = value === state.op;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-selected', isActive ? 'true' : 'false');
        item.setAttribute('tabindex', isActive ? '0' : '-1');
      });
      tab.focus({ preventScroll: true });
    });
  });

  const minInput = document.getElementById('min');
  const maxInput = document.getElementById('max');

  const handlePriceInput = (event, key) => {
    const input = event.target;
    const cleaned = sanitizeNumeric(input.value);
    input.value = cleaned;
    state[key] = cleaned;
    updatePriceHint();
  };

  minInput?.addEventListener('input', (event) => handlePriceInput(event, 'min'));
  maxInput?.addEventListener('input', (event) => handlePriceInput(event, 'max'));

  const monedaSelect = document.getElementById('moneda');
  monedaSelect?.addEventListener('change', (event) => {
    const value = event.target.value;
    state.moneda = value === 'clp' ? 'clp' : 'uf';
  });

  document.querySelectorAll('input[name="tipo"]').forEach((radio) => {
    radio.addEventListener('change', (event) => {
      const value = event.target.value;
      state.tipo = tipoSummary[value] ? value : 'all';
    });
  });

  const nuevosToggle = document.getElementById('nuevos');
  nuevosToggle?.addEventListener('change', (event) => {
    state.nuevos = event.target.checked;
  });

  const searchButton = document.getElementById('do-search');
  searchButton?.addEventListener('click', () => {
    if (state.panel === 'op') {
      updatePriceHint();
      if (!validPrices()) {
        const hint = document.getElementById('hint-price');
        hint?.classList.add('shake');
        window.setTimeout(() => hint?.classList.remove('shake'), 350);
        return;
      }
    }
    updateSummaries();
    closePanels(false);
    const queryString = buildQueryFromState();
    const target = state.op === 'venta' ? '/venta.html' : '/arriendos.html';
    const url = queryString ? `${target}?${queryString}` : target;
    window.location.href = url;
  });

  parseQuery();
  syncControls();
  updateSummaries();
  updatePriceHint();
})();
