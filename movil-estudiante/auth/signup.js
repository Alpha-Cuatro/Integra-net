document.addEventListener('DOMContentLoaded', () => {
  // ===== CONSTANTS =====
  const PASSWORD_MIN_LENGTH = 6;
  const NAME_MAX_LENGTH = 100;
  const DEBOUNCE_DELAY = 250;

  // ===== SESSION CHECK =====
  if (localStorage.getItem('eduSesion')) {
    try {
      const sesion = JSON.parse(localStorage.getItem('eduSesion'));
      if (sesion && sesion.rol === 'estudiante') {
        window.location.href = '../index.html';
        return;
      }
    } catch (_) { /* ignore parse errors */ }
  }

  // ===== DATA =====
  const institutos = [
    'Centro Escolar José Martí', 'Colegio Santa Rosa de Lima', 'Colegio Génesis',
    'Instituto Nac. Ramón Matus Acevedo', 'Colegio San José',
    'Instituto Nacional Manuel Hernández Martínez', 'Instituto Nacional Juan José Rodríguez',
    'Academia de Santa María', 'Centro Escolar Pedro Joaquín Chamorro',
    'Colegio Corazón de María', 'Colegio Cristiano Rubén Darío',
    'Escuela Nueva Esperanza', 'Colegio Central de Nicaragua', 'Centro Escolar El Guabillo'
  ];

  // ===== DOM REFS =====
  const rolSelect = document.getElementById('rol');
  const camposEstudiante = document.getElementById('camposEstudiante');
  const camposDocente = document.getElementById('camposDocente');
  const form = document.getElementById('signupForm');
  const btnRegistro = document.getElementById('btnRegistro');
  const modal = document.getElementById('modalMensaje');
  const modalContenido = modal?.querySelector('.modal-contenido');
  const btnCerrar = document.getElementById('btnCerrar');
  const tituloMensaje = document.getElementById('tituloMensaje');
  const textoMensaje = document.getElementById('textoMensaje');
  const iconoMensaje = document.getElementById('iconoMensaje');
  const toast = document.getElementById('toastNotification');

  // ===== TOAST =====
  function mostrarToast(mensaje, tipo) {
    if (!toast) return;
    toast.className = 'toast-global';
    toast.textContent = '';
    const icon = document.createElement('i');
    const icons = { success: 'fa-solid fa-circle-check', error: 'fa-solid fa-circle-xmark', info: 'fa-solid fa-circle-info', warning: 'fa-solid fa-triangle-exclamation' };
    icon.className = icons[tipo] || icons.info;
    toast.appendChild(icon);
    toast.appendChild(document.createTextNode(' ' + mensaje));
    toast.classList.add(tipo || 'info', 'show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  // ===== FIELD ERROR MANAGEMENT =====
  function getErrorElement(input) {
    const parent = input.closest('.input-group');
    if (!parent) return null;
    let err = parent.querySelector('.field-error');
    if (!err) {
      err = document.createElement('span');
      err.className = 'field-error';
      err.id = input.id + '-error';
      err.setAttribute('role', 'alert');
      parent.appendChild(err);
    }
    return err;
  }

  function showFieldError(input, message) {
    const parent = input.closest('.input-group');
    if (!parent) return;
    parent.classList.remove('success');
    parent.classList.add('error');
    input.setAttribute('aria-invalid', 'true');
    const err = getErrorElement(input);
    if (err) {
      err.textContent = message;
      input.setAttribute('aria-describedby', err.id);
    }
  }

  function clearFieldError(input) {
    const parent = input.closest('.input-group');
    if (!parent) return;
    parent.classList.remove('error', 'success');
    input.removeAttribute('aria-invalid');
    const err = getErrorElement(input);
    if (err) {
      err.textContent = '';
      input.removeAttribute('aria-describedby');
    }
  }

  function markFieldSuccess(input) {
    const parent = input.closest('.input-group');
    if (!parent) return;
    if (!parent.classList.contains('error')) {
      parent.classList.add('success');
    }
  }

  function clearAllErrors() {
    document.querySelectorAll('.input-group.error, .input-group.success').forEach(el => {
      el.classList.remove('error', 'success');
    });
    document.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    document.querySelectorAll('[aria-describedby]').forEach(el => {
      const err = document.getElementById(el.getAttribute('aria-describedby'));
      if (err && err.classList.contains('field-error')) {
        el.removeAttribute('aria-describedby');
      }
    });
  }

  // ===== SANITIZATION =====
  function sanitizeText(value) {
    return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  function sanitizeName(value) {
    return sanitizeText(value).replace(/\s{2,}/g, ' ');
  }

  // ===== VALIDATION =====
  function validateName(value) {
    const v = sanitizeName(value);
    if (!v) return 'El nombre es obligatorio.';
    if (v.length < 2) return 'El nombre debe tener al menos 2 caracteres.';
    if (v.length > NAME_MAX_LENGTH) return 'El nombre no puede exceder ' + NAME_MAX_LENGTH + ' caracteres.';
    if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/.test(v)) return 'El nombre contiene caracteres inválidos.';
    return '';
  }

  function validateEmail(value) {
    const v = value.trim().toLowerCase();
    if (!v) return 'El correo es obligatorio.';
    if (v.length > 255) return 'El correo es demasiado largo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Ingresa un correo electrónico válido.';
    if (/\.\./.test(v) || /^\./.test(v) || /@.*@/.test(v)) return 'El correo tiene un formato inválido.';
    return '';
  }

  function validatePassword(value) {
    if (!value) return 'La contraseña es obligatoria.';
    if (value.length < PASSWORD_MIN_LENGTH) return 'Debe tener al menos ' + PASSWORD_MIN_LENGTH + ' caracteres.';
    if (value.length > 128) return 'La contraseña es demasiado larga.';
    return '';
  }

  function validateRequired(value, fieldName) {
    if (!value || !value.trim()) return fieldName + ' es obligatorio.';
    return '';
  }

  const VALIDATORS = {
    estNombre: (v) => validateName(v),
    docNombre: (v) => validateName(v),
    estCorreo: (v) => validateEmail(v),
    docCorreo: (v) => validateEmail(v),
    estPassword: (v) => validatePassword(v),
    docPassword: (v) => validatePassword(v),
    estInstituto: (v) => validateRequired(v, 'El centro educativo'),
    docInstituto: (v) => validateRequired(v, 'El centro educativo'),
    docEspecialidad: (v) => validateRequired(v, 'La especialidad'),
    docMateria: (v) => v ? '' : 'Selecciona una materia.',
    estGrado: (v) => v ? '' : 'Selecciona un grado.',
    estSeccion: (v) => v ? '' : 'Selecciona una sección.',
  };

  function validateField(input) {
    if (!input || input.disabled || input.closest('.campos-rol')?.style.display === 'none') return true;
    const validator = VALIDATORS[input.id];
    if (!validator) {
      if (input.hasAttribute('aria-required') || input.required) {
        const label = input.getAttribute('aria-label') || input.placeholder || 'Este campo';
        const err = validateRequired(input.value, label);
        if (err) { showFieldError(input, err); return false; }
      }
      clearFieldError(input);
      return true;
    }
    const err = validator(input.value);
    if (err) { showFieldError(input, err); return false; }
    clearFieldError(input);
    markFieldSuccess(input);
    return true;
  }

  function validateVisibleFields() {
    let firstError = null;
    document.querySelectorAll('.campos-rol input, .campos-rol select').forEach(input => {
      if (input.closest('.campos-rol')?.style.display === 'none') return;
      if (!validateField(input) && !firstError) firstError = input;
    });
    return firstError;
  }

  // ===== PASSWORD STRENGTH =====
  function setupPasswordStrength(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const parent = input.closest('.input-group');
    if (!parent) return;
    if (parent.querySelector('.password-strength')) return;

    const strengthDiv = document.createElement('div');
    strengthDiv.className = 'password-strength';
    strengthDiv.innerHTML = '<div class="strength-bar"><div class="strength-fill"></div></div><span class="strength-text"></span>';
    parent.appendChild(strengthDiv);
    const fill = strengthDiv.querySelector('.strength-fill');
    const text = strengthDiv.querySelector('.strength-text');

    function getStrength(value) {
      if (!value) return { level: '', score: 0, label: '' };
      let score = 0;
      if (value.length >= PASSWORD_MIN_LENGTH) score += 1;
      if (value.length >= 8) score += 1;
      if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
      if (/\d/.test(value)) score += 1;
      if (/[^a-zA-Z0-9]/.test(value)) score += 1;
      if (value.length >= 12) score += 1;

      if (score <= 1) return { level: 'weak', score: 1, label: 'Débil' };
      if (score === 2) return { level: 'medium', score: 2, label: 'Media' };
      if (score <= 4) return { level: 'strong', score: 3, label: 'Fuerte' };
      return { level: 'very-strong', score: 4, label: 'Muy fuerte' };
    }

    function updateStrength() {
      const result = getStrength(input.value);
      fill.className = 'strength-fill';
      text.className = 'strength-text';
      if (result.level) {
        fill.classList.add(result.level);
        text.classList.add(result.level);
        text.textContent = result.label;
      } else {
        text.textContent = '';
      }
    }

    input.addEventListener('input', updateStrength);
    input.addEventListener('focus', updateStrength);
  }

  // ===== REAL-TIME VALIDATION =====
  function setupFieldValidation() {
    document.querySelectorAll('.campos-rol input, .campos-rol select').forEach(input => {
      let debounceTimer;
      input.addEventListener('blur', () => {
        validateField(input);
      });
      input.addEventListener('input', () => {
        if (input.dataset.touched) {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => validateField(input), DEBOUNCE_DELAY);
        }
      });
      input.addEventListener('focus', () => {
        input.dataset.touched = 'true';
      });
    });
  }

  // ===== ROLE HANDLING =====
  function actualizarCampos() {
    const rol = rolSelect.value;
    camposEstudiante.style.display = rol === 'estudiante' ? 'block' : 'none';
    camposDocente.style.display = rol === 'docente' ? 'block' : 'none';
    clearAllErrors();
    document.querySelectorAll('.campos-rol input, .campos-rol select').forEach(el => el.required = false);
    if (rol === 'estudiante') {
      camposEstudiante.querySelectorAll('input, select').forEach(el => {
        if (el.id !== 'estFechaNac' && el.id !== 'estSexo' && el.id !== 'estTelefono' && el.id !== 'estDireccion' && el.id !== 'estTutor') el.required = true;
      });
    } else if (rol === 'docente') {
      camposDocente.querySelectorAll('input, select').forEach(el => {
        if (el.id !== 'docTelefono' && el.id !== 'docDireccion') el.required = true;
      });
    }
  }

  rolSelect.addEventListener('change', actualizarCampos);

  // ===== PASSWORD TOGGLE =====
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (target) {
        target.type = target.type === 'password' ? 'text' : 'password';
        btn.innerHTML = target.type === 'password' ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
        btn.setAttribute('aria-label', target.type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña');
      }
    });
  });

  // ===== AUTOCOMPLETE =====
  function setupAutocomplete(inputId, listaId) {
    const input = document.getElementById(inputId);
    const lista = document.getElementById(listaId);
    if (!input || !lista) return;

    let highlightIndex = -1;
    let debounceTimer;
    let items = [];

    function closeList() {
      lista.style.display = 'none';
      highlightIndex = -1;
      input.setAttribute('aria-expanded', 'false');
    }

    function highlightItem(index) {
      items.forEach((el, i) => {
        el.classList.toggle('active', i === index);
        if (i === index) el.setAttribute('aria-selected', 'true');
        else el.removeAttribute('aria-selected');
      });
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }

    function selectItem(index) {
      if (index >= 0 && index < items.length) {
        input.value = items[index].textContent;
        closeList();
        validateField(input);
      }
    }

    function filterList() {
      const valor = input.value.toLowerCase();
      lista.innerHTML = '';
      closeList();
      if (!valor) return;

      const filtrados = institutos.filter(i => i.toLowerCase().includes(valor));
      if (filtrados.length === 0) return;

      const fragment = document.createDocumentFragment();
      items = [];
      filtrados.forEach((nombre, idx) => {
        const item = document.createElement('div');
        item.classList.add('autocomplete-item');
        item.textContent = nombre;
        item.setAttribute('role', 'option');
        item.id = listaId + '-item-' + idx;
        item.addEventListener('click', () => {
          input.value = nombre;
          closeList();
          validateField(input);
          input.focus();
        });
        fragment.appendChild(item);
        items.push(item);
      });

      lista.appendChild(fragment);
      lista.style.display = 'block';
      input.setAttribute('aria-expanded', 'true');
      highlightIndex = -1;
    }

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(filterList, 150);
    });

    input.addEventListener('keydown', (e) => {
      if (lista.style.display !== 'block' || items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightIndex = (highlightIndex + 1) % items.length;
        highlightItem(highlightIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightIndex = (highlightIndex - 1 + items.length) % items.length;
        highlightItem(highlightIndex);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightIndex >= 0) {
          selectItem(highlightIndex);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeList();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => { if (!lista.matches(':hover')) closeList(); }, 150);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.autocomplete')) closeList();
    });
  }

  // ===== MODAL =====
  function mostrarModal(opts) {
    if (!modal) return;
    tituloMensaje.textContent = opts.titulo || 'Mensaje';
    textoMensaje.textContent = opts.mensaje || '';
    iconoMensaje.innerHTML = '<i class="' + (opts.icono || 'fa-solid fa-circle-info') + '"></i>';
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    const contenido = modalContenido;
    if (contenido) {
      contenido.classList.remove('success', 'error', 'info');
      contenido.classList.add(opts.tipo || 'info');
      contenido.focus();
    }
    document.body.style.overflow = 'hidden';
  }

  function cerrarModalYRedirigir() {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    const exito = modal.dataset.exito === 'true';
    if (exito) {
      try {
        const sesion = JSON.parse(localStorage.getItem('eduSesion') || '{}');
        if (sesion && sesion.rol) {
          window.location.href = sesion.rol === 'docente' ? '../docente/index.html' : '../index.html';
        }
      } catch (_) { /* ignore */ }
    }
  }

  btnCerrar?.addEventListener('click', cerrarModalYRedirigir);

  modal?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarModalYRedirigir();
    if (e.key === 'Tab') {
      const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModalYRedirigir();
  });

  // ===== LOADING STATE =====
  function setLoading(isLoading) {
    if (!btnRegistro) return;
    if (isLoading) {
      btnRegistro.classList.add('loading');
      btnRegistro.disabled = true;
    } else {
      btnRegistro.classList.remove('loading');
      btnRegistro.disabled = false;
    }
  }

  // ===== FORM SUBMIT =====
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    if (btnRegistro.disabled) return;
    const rol = rolSelect.value;
    if (!rol) {
      mostrarModal({ titulo: 'Selecciona un rol', mensaje: 'Debes seleccionar si eres Estudiante o Docente.', icono: 'fa-solid fa-triangle-exclamation', tipo: 'error' });
      return;
    }

    const firstError = validateVisibleFields();
    if (firstError) {
      firstError.focus({ preventScroll: true });
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      mostrarToast('Corrige los errores marcados en el formulario.', 'error');
      return;
    }

    setLoading(true);

    let nombre, correo, password, instituto, extra;
    if (rol === 'estudiante') {
      nombre = sanitizeName(document.getElementById('estNombre').value);
      correo = document.getElementById('estCorreo').value.trim().toLowerCase();
      password = document.getElementById('estPassword').value;
      instituto = sanitizeText(document.getElementById('estInstituto').value);
      if (!nombre || !correo || !password || !instituto) {
        setLoading(false);
        return mostrarModal({ titulo: 'Campos incompletos', mensaje: 'Completa todos los campos requeridos del estudiante.', icono: 'fa-solid fa-triangle-exclamation', tipo: 'error' });
      }
      extra = {
        fechaNacimiento: document.getElementById('estFechaNac').value,
        sexo: document.getElementById('estSexo').value,
        grado: document.getElementById('estGrado').value,
        seccion: document.getElementById('estSeccion').value,
        tutor: sanitizeText(document.getElementById('estTutor').value),
        telefono: sanitizeText(document.getElementById('estTelefono').value),
        direccion: sanitizeText(document.getElementById('estDireccion').value)
      };
    } else {
      nombre = sanitizeName(document.getElementById('docNombre').value);
      correo = document.getElementById('docCorreo').value.trim().toLowerCase();
      password = document.getElementById('docPassword').value;
      instituto = sanitizeText(document.getElementById('docInstituto').value);
      if (!nombre || !correo || !password || !instituto) {
        setLoading(false);
        return mostrarModal({ titulo: 'Campos incompletos', mensaje: 'Completa todos los campos requeridos del docente.', icono: 'fa-solid fa-triangle-exclamation', tipo: 'error' });
      }
      extra = {
        especialidad: sanitizeText(document.getElementById('docEspecialidad').value),
        materiaId: document.getElementById('docMateria').value,
        telefono: sanitizeText(document.getElementById('docTelefono').value),
        direccion: sanitizeText(document.getElementById('docDireccion').value)
      };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setLoading(false);
      return mostrarModal({ titulo: 'Correo inválido', mensaje: 'Ingresa un correo válido.', icono: 'fa-solid fa-envelope', tipo: 'error' });
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setLoading(false);
      return mostrarModal({ titulo: 'Contraseña débil', mensaje: 'La contraseña debe tener al menos ' + PASSWORD_MIN_LENGTH + ' caracteres.', icono: 'fa-solid fa-lock', tipo: 'error' });
    }

    try {
      const usuarios = JSON.parse(localStorage.getItem('eduUsuarios')) || [];
      if (!Array.isArray(usuarios)) throw new Error('Corrupto');
      if (usuarios.find(u => u.correo && u.correo.toLowerCase() === correo.toLowerCase())) {
        setLoading(false);
        return mostrarModal({ titulo: 'Cuenta existente', mensaje: 'Ya existe una cuenta con este correo.', icono: 'fa-solid fa-user-xmark', tipo: 'error' });
      }
      if (usuarios.find(u => u.nombre && u.nombre.toLowerCase() === nombre.toLowerCase())) {
        setLoading(false);
        return mostrarModal({ titulo: 'Nombre registrado', mensaje: 'Ya existe una cuenta con este nombre. Si es tuyo, inicia sesión.', icono: 'fa-solid fa-user-xmark', tipo: 'error' });
      }

      const nuevoUsuario = {
        id: Date.now(),
        nombre, correo, password, rol,
        instituto, fotografia: '',
        fechaRegistro: new Date().toLocaleDateString(),
        telefono: extra.telefono || '',
        direccion: extra.direccion || '',
        ...(rol === 'estudiante' ? {
          codigo: 'EST-' + Date.now().toString().slice(-6),
          fechaNacimiento: extra.fechaNacimiento || '',
          sexo: extra.sexo || '',
          grado: extra.grado || '',
          seccion: extra.seccion || '',
          tutor: extra.tutor || '',
          estadoAcademico: 'Activo',
          materias: [], asistencias: [], observaciones: [],
          competenciasGlobales: [], fortalezas: [], debilidades: [],
          grupos: [], promedioGeneral: 0
        } : {
          codigoDocente: 'DOC-' + Date.now().toString().slice(-6),
          especialidad: extra.especialidad || '',
          materiaAsignada: extra.materiaId || '',
          estado: 'Activo',
          fechaIngreso: new Date().toISOString().split('T')[0]
        })
      };

      usuarios.push(nuevoUsuario);
      localStorage.setItem('eduUsuarios', JSON.stringify(usuarios));
      localStorage.setItem('eduSesion', JSON.stringify({
        usuarioId: nuevoUsuario.id, nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo, rol: nuevoUsuario.rol,
        inicio: new Date().toISOString()
      }));
      localStorage.setItem('usuarioActual', JSON.stringify(nuevoUsuario));
      localStorage.setItem('sesionActiva', 'true');

      if (modal) modal.dataset.exito = 'true';
      setLoading(false);
      mostrarModal({ titulo: 'Registro exitoso', mensaje: '¡Bienvenido a Integra-net, ' + nombre + '!', icono: 'fa-solid fa-circle-check', tipo: 'success' });
    } catch (err) {
      setLoading(false);
      mostrarModal({ titulo: 'Error', mensaje: 'Ocurrió un error al guardar los datos. Intenta de nuevo.', icono: 'fa-solid fa-triangle-exclamation', tipo: 'error' });
    }
  });

  // ===== INIT =====
  setupAutocomplete('estInstituto', 'estListaInstitutos');
  setupAutocomplete('docInstituto', 'docListaInstitutos');
  setupFieldValidation();
  setupPasswordStrength('estPassword');
  setupPasswordStrength('docPassword');
  actualizarCampos();
});
