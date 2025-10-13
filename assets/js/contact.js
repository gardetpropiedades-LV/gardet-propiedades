(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const PHONE = '56987829204';
  const resultNode = document.querySelector('[data-form-result]');
  const interestNode = document.querySelector('[data-contact-interest]');
  const params = new URLSearchParams(location.search);
  const interest = params.get('project') || params.get('prop');

  if (interest && interestNode) {
    interestNode.textContent = interest;
    const hidden = form.querySelector('input[name="referencia"]');
    if (hidden) hidden.value = interest;
  } else if (interestNode) {
    interestNode.closest('[data-interest-wrap]')?.setAttribute('hidden', '');
  }

  const fields = [
    { name: 'nombre', message: 'Ingresa tu nombre' },
    { name: 'correo', message: 'Ingresa un correo válido', type: 'email' },
    { name: 'telefono', message: 'Indica un teléfono de contacto' },
    { name: 'mensaje', message: 'Cuéntanos en qué podemos ayudarte' },
  ];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const setFieldError = (input, message) => {
    if (!(input instanceof HTMLElement)) return;
    const field = input.closest('.form-field');
    if (!field) return;
    const errorNode = field.querySelector('.form-field__error');
    if (message) {
      field.classList.add('form-field--invalid');
      if (errorNode) errorNode.textContent = message;
    } else {
      field.classList.remove('form-field--invalid');
      if (errorNode) errorNode.textContent = '';
    }
  };

  const validateField = (descriptor) => {
    const input = form.elements.namedItem(descriptor.name);
    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) return true;
    const value = input.value.trim();

    if (!value) {
      setFieldError(input, descriptor.message);
      return false;
    }

    if (descriptor.type === 'email' && !emailRegex.test(value)) {
      setFieldError(input, 'El correo no es válido');
      return false;
    }

    setFieldError(input, '');
    return true;
  };

  fields.forEach((descriptor) => {
    const input = form.elements.namedItem(descriptor.name);
    if (input instanceof HTMLElement) {
      input.addEventListener('input', () => validateField(descriptor));
      input.addEventListener('blur', () => validateField(descriptor));
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const invalid = fields.filter((descriptor) => !validateField(descriptor));
    if (invalid.length) {
      const firstInvalid = form.elements.namedItem(invalid[0].name);
      if (firstInvalid instanceof HTMLElement) {
        firstInvalid.focus({ preventScroll: false });
      }
      return;
    }

    const nameInput = form.elements.namedItem('nombre');
    const nombre = nameInput instanceof HTMLInputElement ? nameInput.value.trim() : '';
    const messageInput = form.elements.namedItem('mensaje');
    const detalle = messageInput instanceof HTMLTextAreaElement ? messageInput.value.trim() : '';

    const summary = interest ? `Interés en ${interest}` : 'Consulta general';
    const whatsappText = `${nombre ? `${nombre} · ` : ''}${summary}. ${detalle}`.trim();
    const whatsappUrl = `https://wa.me/${PHONE}?text=${encodeURIComponent(whatsappText)}`;

    if (resultNode) {
      resultNode.innerHTML = `
        <div class="form-success">
          ¡Gracias${nombre ? `, ${nombre}` : ''}! Te contactaremos a la brevedad.
          <div style="margin-top:8px;">
            <a class="button button--primary" href="${whatsappUrl}" target="_blank" rel="noreferrer">
              Continuar por WhatsApp
            </a>
          </div>
        </div>
      `;
    }

    form.reset();
    if (interest) {
      const hidden = form.querySelector('input[name="referencia"]');
      if (hidden) hidden.value = interest;
      if (interestNode) interestNode.textContent = interest;
    }
  });
})();
