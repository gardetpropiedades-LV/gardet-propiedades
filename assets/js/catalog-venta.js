const UF_HOY = 36500; // CLP por UF (ajústalo cuando quieras)
const PAGE_SIZE = 12;

const state = {
  op: 'venta',
  q: '',
  min: '',
  max: '',
  moneda: 'uf',
  tipo: 'all',
  nuevos: false,
  orderBy: 'precio-asc',
  page: 1,
  raw: [],
  filtered: [],
};

// Helpers DOM y formato
const $ = s => document.querySelector(s);
const fmtUF  = n => `UF ${Number(n).toLocaleString('es-CL')}`;
const fmtCLP = n => `CLP $${Number(n).toLocaleString('es-CL')}`;
const cap = s => (s||'').replace(/\b\p{L}/gu, c => c.toUpperCase());

const stripAccents = s => (s||'').toLowerCase()
  .normalize('NFD').replace(/\p{Diacritic}/gu,'');

const matchesText = (haystack, needle) => {
  if (!needle) return true;
  return stripAccents(haystack).includes(stripAccents(needle));
};

const toUF = (item) => {
  if (item.precio_uf != null) return Number(item.precio_uf);
  if (item.precio_clp != null) return Number(item.precio_clp) / UF_HOY;
  return null;
};

// QS
const getQS = () => Object.fromEntries(new URLSearchParams(location.search).entries());
const setQS = (params) => {
  const qs = new URLSearchParams(params);
  history.replaceState(null, '', `${location.pathname}?${qs.toString()}`);
};

// Hidratación desde la URL
function hydrateFromQS(){
  const qs = getQS();
  state.op     = 'venta'; // forzar venta en esta página
  state.q      = qs.q || '';
  state.min    = qs.min || '';
  state.max    = qs.max || '';
  state.moneda = (qs.moneda === 'clp') ? 'clp' : 'uf';
  state.tipo   = qs.tipo || 'all';
  state.nuevos = qs.nuevos === '1';
  if (qs.orderBy) state.orderBy = qs.orderBy;
}

// Chips de resumen
function updateChips(){
  $('#chip-q').textContent = state.q ? state.q : 'Cualquiera';
  $('#chip-op').textContent = 'Venta';

  // Precio
  let priceTxt = 'Todos los…';
  const min = state.min ? Number(state.min) : null;
  const max = state.max ? Number(state.max) : null;
  const label = (state.moneda === 'clp') ? fmtCLP : fmtUF;
  if (min && max) priceTxt = `${label(min)}–${label(max)}`;
  else if (min)   priceTxt = `≥ ${label(min)}`;
  else if (max)   priceTxt = `≤ ${label(max)}`;
  $('#chip-price').textContent = priceTxt;

  // Tipo
  const map = {all:'Cualquiera', casa:'Casas', depto:'Departamentos', oficina:'Oficinas', local:'Locales', terreno:'Terrenos', campo:'Campos', bodega:'Bodegas', estacionamiento:'Estacionamientos'};
  $('#chip-type').textContent = map[state.tipo] || 'Cualquiera';

  // Nuevos
  const cN = $('#chip-nuevos');
  cN.hidden = !state.nuevos;
}

// Carga de datos
async function loadData(){
  const res = await fetch('data/properties.json', { cache: 'no-store' });
  const all = await res.json();
  state.raw = all.filter(it => (it.operacion || '').toLowerCase() === 'venta');
}

// Aplicar filtros
function applyFilters(){
  const q = state.q.trim();
  const min = state.min ? Number(state.min) : null;
  const max = state.max ? Number(state.max) : null;
  const mono = state.moneda;

  let items = state.raw.slice();

  // Tipo
  if (state.tipo !== 'all') {
    const wanted = state.tipo.toLowerCase();
    items = items.filter(it => (it.tipo || '').toLowerCase() === wanted);
  }

  // Nuevos
  if (state.nuevos) items = items.filter(it => !!it.nuevo);

  // Texto
  if (q) {
    items = items.filter(it =>
      matchesText(it.comuna, q) ||
      matchesText(it.direccion, q) ||
      matchesText(it.titulo, q) ||
      matchesText(it.descripcion, q)
    );
  }

  // Precio: comparar en UF (convirtiendo min/max CLP a UF si hace falta)
  items = items.filter(it => {
    const uf = toUF(it);
    if (uf == null) return false;
    let minUF = min, maxUF = max;
    if (mono === 'clp') {
      minUF = min ? (min / UF_HOY) : null;
      maxUF = max ? (max / UF_HOY) : null;
    }
    if (minUF && uf < minUF) return false;
    if (maxUF && uf > maxUF) return false;
    return true;
  });

  // Orden
  items.sort((a,b) => {
    const au = toUF(a), bu = toUF(b);
    if (state.orderBy === 'precio-asc')  return (au??1e12) - (bu??1e12);
    if (state.orderBy === 'precio-desc') return (bu??-1) - (au??-1);
    if (state.orderBy === 'm2-desc')     return (Number(b.m2_util)||0) - (Number(a.m2_util)||0);
    return 0; // recientes: mantener orden de llegada
  });

  state.filtered = items;
  state.page = 1;
  render();
}

// Render
function render(){
  updateChips();

  const total = state.filtered.length;
  $('#result-count').textContent = `${total} resultado${total!==1?'s':''}`;

  const grid = $('#cards-grid');
  grid.innerHTML = '';

  if (!total) {
    $('#empty-state').hidden = false;
    $('#pagination').hidden = true;
    return;
  }
  $('#empty-state').hidden = true;

  // Paginación
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (state.page - 1) * PAGE_SIZE;
  const slice = state.filtered.slice(start, start + PAGE_SIZE);

  slice.forEach(it => grid.appendChild(cardNode(it)));

  $('#pagination').hidden = pages <= 1;
  $('#pageInfo').textContent = `${state.page} / ${pages}`;
  $('#prevPage').disabled = state.page <= 1;
  $('#nextPage').disabled = state.page >= pages;
}

// Tarjeta
function cardNode(it){
  const uf = toUF(it);
  const hasUF = it.precio_uf != null;
  const priceUFtxt  = uf != null ? fmtUF(Math.round(uf)) : '—';
  const priceCLPtxt = (it.precio_clp != null) ? fmtCLP(it.precio_clp) : null;
  const img = (it.fotos && it.fotos.length) ? `assets/fotos/${it.fotos[0]}` : 'assets/news/noticia-ventas.svg';

  const el = document.createElement('article');
  el.className = 'card property';
  el.innerHTML = `
    <div class="card-media">
      <img src="${img}" alt="${it.titulo || ''}" loading="lazy"/>
      ${it.estado && it.estado.toLowerCase() !== 'disponible' ? `<span class="badge badge-${it.estado.toLowerCase()}">${cap(it.estado)}</span>` : ''}
      ${it.nuevo ? `<span class="badge badge-new">Nuevo</span>` : ''}
    </div>
    <div class="card-body">
      <h3 class="card-title">${it.titulo || 'Propiedad en Venta'}</h3>
      <div class="price">
        ${hasUF ? `<strong>${priceUFtxt}</strong>` : `<strong>${priceCLPtxt||'Consultar'}</strong>`}
        ${(!hasUF && priceCLPtxt) ? `<span class="approx">(${fmtUF(Math.round(uf))} aprox.)</span>` : ''}
      </div>
      <div class="meta">
        <span>${it.tipo||'—'}</span> · <span>${it.comuna||'—'}</span>${it.m2_util?` · <span>${it.m2_util} m²</span>`:''}
        ${it.dorms?` · <span>${it.dorms}D</span>`:''}${it.banos?` · <span>${it.banos}B</span>`:''}
      </div>
      <p class="card-desc">${(it.descripcion||'').slice(0,140)}${(it.descripcion||'').length>140?'…':''}</p>
      <div class="card-actions">
        <a class="btn" href="ficha.html?slug=${encodeURIComponent(it.slug||'')}">Ver ficha</a>
        <a class="btn btn-ghost" target="_blank" rel="noreferrer" href="https://wa.me/56987829204?text=${encodeURIComponent('Hola, me interesa: '+(it.titulo||'Propiedad')+' ('+(it.slug||'')+')')}">WhatsApp</a>
      </div>
    </div>
  `;
  return el;
}

// Listeners
document.addEventListener('DOMContentLoaded', async () => {
  hydrateFromQS();

  const ob = $('#orderBy');
  if (ob){
    ob.value = state.orderBy;
    ob.addEventListener('change', () => {
      state.orderBy = ob.value;
      applyFilters();
      setQS({ ...getQS(), orderBy: state.orderBy });
    });
  }

  $('#clear-filters')?.addEventListener('click', clearFilters);
  $('#empty-clear')?.addEventListener('click', clearFilters);

  $('#prevPage')?.addEventListener('click', () => { state.page=Math.max(1, state.page-1); render(); });
  $('#nextPage')?.addEventListener('click', () => {
    const pages = Math.ceil(state.filtered.length / PAGE_SIZE);
    state.page=Math.min(pages, state.page+1); render();
  });

  await loadData();
  applyFilters();
});

function clearFilters(){
  state.q=''; state.min=''; state.max=''; state.moneda='uf'; state.tipo='all'; state.nuevos=false; state.orderBy='precio-asc'; state.page=1;
  setQS({ op: 'venta' }); // deja sólo la operación
  applyFilters();
}
