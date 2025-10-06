/* Enlaza el formulario del hero y construye la URL de resultados */
(() => {
  const form = document.getElementById('hero-search-form');
  if (!form) return;

  const toQS = (obj) =>
    Object.entries(obj)
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v).trim())}`)
      .join('&');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const operacionRaw = form.operacion?.value || '';
    const operacion = operacionRaw.toLowerCase();
    const destino = operacion === 'venta' ? 'venta.html' : 'arriendos.html';

    const qs = {
      operacion: operacion || '',
      tipo: form.tipo?.value || '',
      ubicacion: form.ubicacion?.value || '',
      precio_min: form.precio_min?.value || '',
      precio_max: form.precio_max?.value || '',
      moneda: form.moneda?.value || 'UF',
    };

    const query = toQS(qs);
    const url = query ? `${destino}?${query}` : destino;
    window.location.href = url;
  });
})();
