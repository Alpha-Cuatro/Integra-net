let usuarioActual = null;
let charts = {};

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const newTheme = current === 'dark' ? 'light' : current === 'light' ? 'dark' : prefersDark ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('eduTheme', newTheme);
  const icon = document.querySelector('.theme-toggle i');
  if (icon) icon.className = newTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

(() => {
  const saved = localStorage.getItem('eduTheme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.setAttribute('data-theme', 'dark');
  const icon = document.querySelector('.theme-toggle i');
  if (icon) icon.className = document.documentElement.getAttribute('data-theme') === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
})();

function inicializar() {
    if (!protegerRuta('docente')) return;
    usuarioActual = AUTENTICACION.usuarioActual();
    if (!usuarioActual) return;
    document.getElementById('nombreDocente').textContent = usuarioActual.nombre.split(' ')[0];
    cargarPerfil();
    renderizarDashboard();
    renderizarGrupos();
    renderizarEvaluaciones();
    initFiltros();
    chatUI.init();
}

function cerrarSesion() {
    AUTENTICACION.cerrarSesion();
    window.location.href = '../auth/login.html';
}

function toggleSidebar() {
    document.getElementById('mainSidebar').classList.add('open');
    document.getElementById('overlay').style.display = 'block';
}

function cerrarSidebar() {
    document.getElementById('mainSidebar').classList.remove('open');
    document.getElementById('overlay').style.display = 'none';
}

function escapeHtml(str) {
    return str?.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m;
    }) || '';
}

function cambiarSeccion(sectionId) {
    document.querySelectorAll('.dashboard').forEach(sec => sec.classList.remove('active-section'));
    const el = document.getElementById(sectionId);
    if (el) el.classList.add('active-section');
    document.querySelectorAll('.menu a, .bottom-nav a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
    });
    if (window.innerWidth <= 768) cerrarSidebar();
    if (sectionId === 'evaluaciones') renderizarEvaluaciones();
    if (sectionId === 'calificaciones') cargarCalificaciones();
    if (sectionId === 'asistencia') cargarAsistencia();
    if (sectionId === 'observaciones') cargarObservaciones();
    if (sectionId === 'reportes') renderizarReportes();
    if (sectionId === 'grupos') renderizarGrupos();
    if (sectionId === 'tareas') renderizarTareasDocente();
    if (sectionId === 'estudiantes') renderizarEstudiantes();
    if (sectionId === 'chat') {
        document.body.classList.add('chat-active');
        chatUI.renderizarConversaciones();
        chatUI.actualizarNotificaciones();
    } else {
        document.body.classList.remove('chat-active');
        document.body.classList.remove('chat-conversacion-open');
    }
}

function mostrarToast(texto, tipo) {
    PERFILES.mostrarToast(texto, tipo);
}

// ========== PERFIL ==========

function cargarPerfil() {
    const u = usuarioActual;
    const materia = PERFIL_DOCENTE.getMateriaAsignada();
    document.getElementById('perfilNombre').textContent = u.nombre;
    document.getElementById('perfilEmail').textContent = u.correo || u.email || 'No disponible';
    document.getElementById('perfilCodigo').textContent = `Código: ${u.codigoDocente || 'N/A'}`;
    document.getElementById('perfilEspecialidad').textContent = `Especialidad: ${u.especialidad || 'Derechos de la Mujer'}`;
    document.getElementById('perfilInstituto').textContent = u.instituto || 'No especificado';
    document.getElementById('perfilTelefono').textContent = u.telefono || 'No registrado';
    document.getElementById('perfilDireccion').textContent = u.direccion || 'No registrada';
    document.getElementById('perfilFechaIngreso').textContent = u.fechaIngreso || '2020';
    if (materia) {
        const totalSecciones = Object.values(materia.gradosSecciones).reduce((s, secs) => s + secs.length, 0);
        document.getElementById('perfilMateriaInfo').innerHTML = `
            <strong>Materia:</strong> ${escapeHtml(materia.materiaNombre)} | 
            <strong>Grados:</strong> ${Object.keys(materia.gradosSecciones).join(', ')} | 
            <strong>Secciones:</strong> ${totalSecciones}
        `;
    }
    document.getElementById('avatarImg').src = PERFILES.obtenerAvatar(u.id);
}

function cambiarAvatar(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            PERFILES.guardarAvatar(usuarioActual.id, e.target.result);
            document.getElementById('avatarImg').src = e.target.result;
            mostrarToast('Foto actualizada', 'success');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ========== DASHBOARD ==========

function renderizarDashboard() {
    const stats = PERFIL_DOCENTE.getEstadisticasDocente();
    document.getElementById('totalGrupos').textContent = Object.keys(PERFIL_DOCENTE.getEstudiantesAgrupados()).length;
    document.getElementById('totalEvaluaciones').textContent = stats.totalEvaluaciones;
    document.getElementById('totalEstudiantes').textContent = stats.totalEstudiantes;
    document.getElementById('totalRendimiento').textContent = `${stats.rendimiento}%`;

    const grupos = PERFIL_DOCENTE.getEstudiantesAgrupados();
    document.getElementById('listaGruposResumen').innerHTML = Object.values(grupos).slice(0, 6).map(g =>
        `<div class="grupo-card" style="border-left-color:#560591;padding:12px">
            <div><div class="grupo-nombre">${escapeHtml(g.grado)} - Sección ${escapeHtml(g.seccion)}</div>
            <div class="grupo-desc">${g.estudiantes.length} estudiantes</div></div>
        </div>`
    ).join('') || '<div class="empty-message">Sin grupos asignados</div>';

    const evaluaciones = PERFIL_DOCENTE.getEvaluaciones();
    const ahora = new Date();
    const proximas = evaluaciones.filter(ev => new Date(ev.fecha) >= ahora).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).slice(0, 5);
    document.getElementById('listaEvaluacionesProximas').innerHTML = proximas.map(ev =>
        `<div class="tarea-card" style="border-left-color:#D8A1FF;padding:12px">
            <div class="tarea-titulo">${escapeHtml(ev.nombre)}</div>
            <div class="tarea-footer">${escapeHtml(ev.grado)}-${escapeHtml(ev.seccion)} | ${PERFILES.formatearFecha(ev.fecha)}</div>
        </div>`
    ).join('') || '<div class="empty-message">Sin evaluaciones próximas</div>';

    if (charts.chartRendimientoDocente) charts.chartRendimientoDocente.destroy();
    const ctx = document.getElementById('chartRendimientoDocente').getContext('2d');
    const labels = ['Aprobados', 'Reprobados'];
    const data = [stats.aprobados, stats.reprobados];
    const totalDR = stats.aprobados + stats.reprobados;
    charts.chartRendimientoDocente = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ['#10b981', '#B02B44'],
                borderWidth: 3,
                borderColor: '#fff',
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            animation: { animateRotate: true, duration: 800 },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 11 },
                        color: '#454546',
                    }
                },
                tooltip: {
                    backgroundColor: '#3E036E',
                    padding: 12,
                    cornerRadius: 8,
                    bodyFont: { size: 13, weight: '500' },
                    callbacks: {
                        label: function(ctx) {
                            const pct = totalDR > 0 ? Math.round(ctx.parsed / totalDR * 100) : 0;
                            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ========== GRUPOS ==========

function renderizarGrupos() {
    const grupos = PERFIL_DOCENTE.getEstudiantesAgrupados();
    const gruposCreados = GRUPOS.getGruposDocente(usuarioActual.id);

    let html = '';

    if (gruposCreados.length > 0) {
        html += '<div class="bloque-header" style="margin-top:0"><h3 style="font-size:0.9rem"><i class="fa-solid fa-star"></i> Grupos Creados</h3></div>';
        html += gruposCreados.map(g => {
            const codigoCorto = g.codigo || '---';
            return `<div class="grupo-card" style="border-left-color:#10b981;flex-wrap:wrap">
                <div style="flex:1;min-width:200px">
                    <div class="grupo-nombre"><i class="fa-solid fa-layer-group"></i> ${escapeHtml(g.nombre)}</div>
                    <div class="grupo-desc">${escapeHtml(g.materiaNombre)} | ${escapeHtml(g.grado)}-${escapeHtml(g.seccion)}</div>
                    <div class="grupo-footer" style="margin-top:6px">
                        <span><i class="fa-solid fa-user-graduate"></i> ${g.estudiantes.length} estudiantes</span>
                        <span class="codigo-clase" onclick="copiarCodigo('${codigoCorto}')" title="Click para copiar"><i class="fa-solid fa-key"></i> ${codigoCorto}</span>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    html += '<div class="bloque-header" style="margin-top:20px"><h3 style="font-size:0.9rem"><i class="fa-solid fa-chalkboard"></i> Grupos por Grado y Sección</h3></div>';
    html += Object.entries(grupos).map(([key, g]) =>
        `<div class="grupo-card">
            <div style="flex:1">
                <div class="grupo-nombre"><i class="fa-solid fa-chalkboard"></i> ${escapeHtml(g.grado)} - Sección ${escapeHtml(g.seccion)}</div>
                <div class="grupo-desc">${g.estudiantes.length} estudiantes | Módulo: ${PERFIL_DOCENTE.getMateriaAsignada()?.nombre || 'Derechos de la Mujer'}</div>
                <div class="grupo-footer" style="margin-top:8px">
                    <span><i class="fa-solid fa-user-graduate"></i> ${g.estudiantes.length} estudiantes</span>
                    <button class="btn-primary" style="padding:4px 12px;font-size:11px" onclick="cambiarSeccion('evaluaciones')">Evaluar</button>
                </div>
            </div>
        </div>`
    ).join('');

    document.getElementById('listaGrupos').innerHTML = html || '<div class="empty-message">No hay grupos asignados</div>';
}

function abrirModalCrearGrupo() {
    document.getElementById('grupoNombre').value = '';
    document.getElementById('grupoGrado').value = '';
    document.getElementById('grupoSeccion').value = '';
    document.getElementById('grupoDescripcion').value = '';
    document.getElementById('modalCrearGrupoOverlay').style.display = 'flex';
}

function cerrarModalCrearGrupo() {
    document.getElementById('modalCrearGrupoOverlay').style.display = 'none';
}

function crearGrupo() {
    const nombre = document.getElementById('grupoNombre').value.trim();
    const grado = document.getElementById('grupoGrado').value;
    const seccion = document.getElementById('grupoSeccion').value;
    const descripcion = document.getElementById('grupoDescripcion').value.trim();

    if (!nombre || !grado || !seccion) {
        mostrarToast('Completa todos los campos requeridos', 'error');
        return;
    }

    const materia = PERFIL_DOCENTE.getMateriaAsignada();
    if (!materia) {
        mostrarToast('No tienes una materia asignada', 'error');
        return;
    }

    const grupo = GRUPOS.crearGrupo(usuarioActual, {
        nombre,
        materiaId: materia.materiaId,
        materiaNombre: materia.materiaNombre,
        grado,
        seccion,
        descripcion
    });

    mostrarToast(`Grupo "${nombre}" creado. Código: ${grupo.codigo}`, 'success');
    cerrarModalCrearGrupo();
    renderizarGrupos();
}

function copiarCodigo(codigo) {
    navigator.clipboard.writeText(codigo).then(() => {
        mostrarToast(`Código "${codigo}" copiado`, 'success');
    }).catch(() => {
        mostrarToast(`Código: ${codigo}`, 'success');
    });
}

// ========== EVALUACIONES ==========

function initFiltros() {
    const materia = PERFIL_DOCENTE.getMateriaAsignada();
    if (!materia) return;
    const opciones = Object.keys(materia.gradosSecciones).map(g => `<option value="${g}">${g}</option>`).join('');
    ['filtroGradoEval', 'filtroGradoCal', 'filtroGradoAsis', 'filtroGradoObs'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<option value="">Todos los grados</option>${opciones}`;
    });
    ['evalGrado'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<option value="">Seleccionar grado</option>${opciones}`;
    });
}

function actualizarSeccionesEval() {
    const grado = document.getElementById('evalGrado').value;
    const seccionSelect = document.getElementById('evalSeccion');
    const materia = PERFIL_DOCENTE.getMateriaAsignada();
    if (!materia || !grado) {
        seccionSelect.innerHTML = '<option value="">Seleccionar sección</option>';
        return;
    }
    const secciones = materia.gradosSecciones[grado] || [];
    seccionSelect.innerHTML = '<option value="">Seleccionar sección</option>' +
        secciones.map(s => `<option value="${s}">Sección ${s}</option>`).join('');
}

function renderizarEvaluaciones() {
    const grado = document.getElementById('filtroGradoEval')?.value || '';
    const seccion = document.getElementById('filtroSeccionEval')?.value || '';
    const materia = PERFIL_DOCENTE.getMateriaAsignada();
    if (!materia) return;

    const seccionSelect = document.getElementById('filtroSeccionEval');
    if (grado && materia.gradosSecciones[grado]) {
        seccionSelect.innerHTML = '<option value="">Todas las secciones</option>' +
            materia.gradosSecciones[grado].map(s => `<option value="${s}">Sección ${s}</option>`).join('');
    } else {
        seccionSelect.innerHTML = '<option value="">Todas las secciones</option>';
    }

    let evaluaciones = PERFIL_DOCENTE.getEvaluaciones().filter(ev => ev.materiaId === materia.materiaId);
    if (grado) evaluaciones = evaluaciones.filter(ev => ev.grado === grado);
    if (seccion) evaluaciones = evaluaciones.filter(ev => ev.seccion === seccion);
    evaluaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    document.getElementById('listaEvaluaciones').innerHTML = evaluaciones.map(ev =>
        `<div class="tarea-card" style="border-left-color:#7A10C0">
            <div class="tarea-header">
                <span class="tarea-titulo"><i class="fa-solid fa-file-pen"></i> ${escapeHtml(ev.nombre)}</span>
                <span class="badge-nota" style="background:#F0E6F7;color:#560591">${escapeHtml(ev.grado)}-${escapeHtml(ev.seccion)}</span>
            </div>
            <div class="tarea-desc">${escapeHtml(ev.descripcion)}</div>
            <div class="tarea-footer">
                <span><i class="fa-regular fa-calendar"></i> ${PERFILES.formatearFecha(ev.fecha)}</span>
                <span>Valor: ${ev.valor}% | Máx: ${ev.puntajeMaximo}</span>
                <button class="btn-primary" style="padding:4px 12px;font-size:11px" onclick="abrirCalificar('${ev.id}','${escapeHtml(ev.nombre)}','${ev.grado}','${ev.seccion}')"><i class="fa-solid fa-star"></i> Calificar</button>
            </div>
        </div>`
    ).join('') || '<div class="empty-message"><i class="fa-regular fa-file"></i><p>No hay evaluaciones. ¡Crea una nueva!</p></div>';
}

function abrirModalEvaluacion() {
    initFiltros();
    document.getElementById('evalNombre').value = '';
    document.getElementById('evalDescripcion').value = '';
    document.getElementById('evalFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('evalValor').value = '';
    document.getElementById('evalPuntajeMax').value = '100';
    document.getElementById('modalEvaluacionOverlay').style.display = 'flex';
}

function cerrarModalEvaluacion() {
    document.getElementById('modalEvaluacionOverlay').style.display = 'none';
}

function crearEvaluacion() {
    const grado = document.getElementById('evalGrado').value;
    const seccion = document.getElementById('evalSeccion').value;
    const nombre = document.getElementById('evalNombre').value.trim();
    const descripcion = document.getElementById('evalDescripcion').value.trim();
    const fecha = document.getElementById('evalFecha').value;
    const valor = parseInt(document.getElementById('evalValor').value);
    const puntajeMax = parseInt(document.getElementById('evalPuntajeMax').value);

    if (!grado || !seccion || !nombre || !fecha || !valor) {
        mostrarToast('Completa todos los campos requeridos', 'error');
        return;
    }

    PERFIL_DOCENTE.crearEvaluacion({ grado, seccion, nombre, descripcion, fecha, valor, puntajeMaximo: puntajeMax || 100 });
    mostrarToast(`Evaluación "${nombre}" creada para ${grado}-${seccion}`, 'success');
    cerrarModalEvaluacion();
    renderizarEvaluaciones();
    renderizarDashboard();
}

// ========== CALIFICACIONES ==========

function abrirCalificar(evalId, evalNombre, grado, seccion) {
    document.getElementById('modalCalificarTitulo').innerHTML = `<i class="fa-solid fa-star"></i> Calificar: ${evalNombre} (${grado}-${seccion})`;
    const estudiantes = PERFIL_DOCENTE.getEstudiantesPorGradoSeccion(grado, seccion);
    const evals = PERFIL_DOCENTE.getEvaluaciones().find(e => e.id === evalId);
    const body = estudiantes.map(est => {
        const cal = PERFIL_DOCENTE.getCalificacionesPorEstudiante(est.id).find(c => c.evaluacionId === evalId);
        return `<div class="tarea-card" style="border-left-color:${cal ? PERFILES.obtenerNotaColor(cal.nota) : '#9A9A9B'};margin-bottom:8px">
            <div style="flex:1">
                <div class="tarea-titulo">${escapeHtml(est.nombre)}</div>
                <div style="font-size:12px;color:#6B6B6C">${est.grado}-${est.seccion}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <input type="number" id="nota_${est.id}_${evalId}" placeholder="Nota" value="${cal ? cal.nota : ''}" min="0" max="${evals?.puntajeMaximo || 100}" style="width:80px;padding:6px 10px;border:1px solid #E8DDD0;border-radius:10px;text-align:center">
                <button class="btn-primary" style="padding:6px 14px;font-size:12px" onclick="guardarNota('${evalId}','${est.id}','${grado}','${seccion}')"><i class="fa-solid fa-check"></i></button>
            </div>
        </div>`;
    }).join('');
    document.getElementById('modalCalificarBody').innerHTML = body || '<div class="empty-message">No hay estudiantes en este grupo</div>';
    document.getElementById('modalCalificarOverlay').style.display = 'flex';
}

function cerrarModalCalificar() {
    document.getElementById('modalCalificarOverlay').style.display = 'none';
}

function guardarNota(evalId, estudianteId, grado, seccion) {
    const input = document.getElementById(`nota_${estudianteId}_${evalId}`);
    const nota = parseFloat(input.value);
    if (isNaN(nota)) {
        mostrarToast('Ingresa una nota válida', 'error');
        return;
    }
    PERFIL_DOCENTE.calificarEstudiante(evalId, estudianteId, nota);
    mostrarToast('Nota guardada', 'success');
    const est = PERFIL_DOCENTE.getEstudiantes().find(e => e.id === estudianteId);
    if (est) {
        const cal = PERFIL_DOCENTE.getCalificacionesPorEstudiante(estudianteId).find(c => c.evaluacionId === evalId);
        const color = cal ? PERFILES.obtenerNotaColor(cal.nota) : '#9A9A9B';
        const card = input.closest('.tarea-card');
        if (card) card.style.borderLeftColor = color;
    }
}

function cargarCalificaciones() {
    const grado = document.getElementById('filtroGradoCal')?.value || '';
    const seccion = document.getElementById('filtroSeccionCal')?.value || '';
    const evalId = document.getElementById('filtroEvalCal')?.value || '';

    const materia = PERFIL_DOCENTE.getMateriaAsignada();
    if (!materia) return;

    const seccionSelect = document.getElementById('filtroSeccionCal');
    if (grado && materia.gradosSecciones[grado]) {
        seccionSelect.innerHTML = '<option value="">Todas las secciones</option>' +
            materia.gradosSecciones[grado].map(s => `<option value="${s}">Sección ${s}</option>`).join('');
    }

    let evaluaciones = PERFIL_DOCENTE.getEvaluaciones().filter(ev => ev.materiaId === materia.materiaId);
    if (grado) evaluaciones = evaluaciones.filter(ev => ev.grado === grado);
    if (seccion) evaluaciones = evaluaciones.filter(ev => ev.seccion === seccion);

    const evalSelect = document.getElementById('filtroEvalCal');
    evalSelect.innerHTML = '<option value="">Seleccionar evaluación</option>' +
        evaluaciones.map(ev => `<option value="${ev.id}">${escapeHtml(ev.nombre)} (${ev.grado}-${ev.seccion})</option>`).join('');

    if (!evalId) {
        document.getElementById('listaCalificaciones').innerHTML = '<div class="empty-message">Selecciona una evaluación para ver calificaciones</div>';
        return;
    }

    const ev = evaluaciones.find(e => e.id === evalId);
    if (!ev) return;
    const estudiantes = PERFIL_DOCENTE.getEstudiantesPorGradoSeccion(ev.grado, ev.seccion);
    const html = estudiantes.map(est => {
        const cal = PERFIL_DOCENTE.getCalificacionesPorEstudiante(est.id).find(c => c.evaluacionId === evalId);
        return `<div class="tarea-card" style="border-left-color:${cal ? PERFILES.obtenerNotaColor(cal.nota) : '#9A9A9B'}">
            <div style="flex:1">
                <div class="tarea-titulo">${escapeHtml(est.nombre)}</div>
                <div class="tarea-desc">${est.grado}-${est.seccion}</div>
            </div>
            <div style="text-align:right">
                <div style="font-weight:700;font-size:1.2rem;color:${cal ? PERFILES.obtenerNotaColor(cal.nota) : '#9A9A9B'}">${cal ? cal.nota : '-'}/${ev.puntajeMaximo}</div>
                <div style="font-size:11px;color:#6B6B6C">${cal ? PERFILES.obtenerLetraNota(cal.nota) : 'Sin nota'}</div>
            </div>
        </div>`;
    }).join('');
    document.getElementById('listaCalificaciones').innerHTML = html || '<div class="empty-message">No hay estudiantes</div>';
}

// ========== ASISTENCIA ==========

function cargarAsistencia() {
    const grado = document.getElementById('filtroGradoAsis')?.value || '';
    const seccion = document.getElementById('filtroSeccionAsis')?.value || '';
    const fecha = document.getElementById('fechaAsistencia')?.value || new Date().toISOString().split('T')[0];

    const materia = PERFIL_DOCENTE.getMateriaAsignada();
    if (!materia) return;

    const seccionSelect = document.getElementById('filtroSeccionAsis');
    if (grado && materia.gradosSecciones[grado]) {
        seccionSelect.innerHTML = '<option value="">Todas las secciones</option>' +
            materia.gradosSecciones[grado].map(s => `<option value="${s}">Sección ${s}</option>`).join('');
    }

    if (!grado || !seccion) {
        document.getElementById('listaAsistencia').innerHTML = '<div class="empty-message">Selecciona grado y sección</div>';
        return;
    }

    const estudiantes = PERFIL_DOCENTE.getEstudiantesPorGradoSeccion(grado, seccion);
    const asistencias = PERFIL_DOCENTE.getAsistencias();

    const html = estudiantes.map(est => {
        const asis = asistencias.find(a => a.estudianteId === est.id && a.fecha === fecha);
        const tipoActual = asis ? asis.tipo : '';
        const tipos = ['Presente', 'Ausente', 'Tarde', 'Justificado'];
        const colores = { Presente: '#10b981', Ausente: '#B02B44', Tarde: '#D8A1FF', Justificado: '#560591' };
        return `<div class="tarea-card" style="border-left-color:${tipoActual ? colores[tipoActual] : '#9A9A9B'}">
            <div style="flex:1">
                <div class="tarea-titulo">${escapeHtml(est.nombre)}</div>
                <div style="font-size:12px;color:#6B6B6C">${est.grado}-${est.seccion}</div>
            </div>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
                ${tipos.map(t => `<button class="btn-asistencia ${tipoActual === t ? 'activo' : ''}" style="padding:4px 10px;border-radius:8px;border:none;cursor:pointer;font-size:11px;font-weight:600;background:${tipoActual === t ? colores[t] : '#F0E6F7'};color:${tipoActual === t ? 'white' : '#454546'}" onclick="registrarAsistencia('${est.id}','${fecha}','${t}')">${t.slice(0,4)}</button>`).join('')}
            </div>
        </div>`;
    }).join('');
    document.getElementById('listaAsistencia').innerHTML = html || '<div class="empty-message">No hay estudiantes en este grupo</div>';
}

function registrarAsistencia(estudianteId, fecha, tipo) {
    PERFIL_DOCENTE.registrarAsistencia(estudianteId, fecha, tipo);
    mostrarToast(`Asistencia registrada: ${tipo}`, 'success');
    cargarAsistencia();
}

// ========== OBSERVACIONES ==========

function cargarObservaciones() {
    const grado = document.getElementById('filtroGradoObs')?.value || '';
    const seccion = document.getElementById('filtroSeccionObs')?.value || '';

    const materia = PERFIL_DOCENTE.getMateriaAsignada();
    if (!materia) return;

    const seccionSelect = document.getElementById('filtroSeccionObs');
    if (grado && materia.gradosSecciones[grado]) {
        seccionSelect.innerHTML = '<option value="">Todas las secciones</option>' +
            materia.gradosSecciones[grado].map(s => `<option value="${s}">Sección ${s}</option>`).join('');
    }

    let estudiantes = PERFIL_DOCENTE.getEstudiantes();
    if (grado) estudiantes = estudiantes.filter(e => e.grado === grado);
    if (seccion) estudiantes = estudiantes.filter(e => e.seccion === seccion);

    const html = estudiantes.map(est => {
        const obs = (est.observaciones || []).slice(-3);
        return `<div class="grupo-card" style="flex-wrap:wrap">
            <div style="flex:1;min-width:150px">
                <div class="grupo-nombre">${escapeHtml(est.nombre)}</div>
                <div style="font-size:12px;color:#6B6B6C">${est.grado}-${est.seccion}</div>
            </div>
            <div style="flex:2;min-width:200px">
                ${obs.map(o => `<div style="font-size:12px;padding:4px 8px;background:#F0E6F7;border-radius:8px;margin:3px 0"><strong>${escapeHtml(o.tipo)}:</strong> ${escapeHtml(o.descripcion)}</div>`).join('') || '<div style="color:#9A9A9B;font-size:12px">Sin observaciones</div>'}
            </div>
            <button class="btn-primary" style="padding:6px 14px;font-size:11px" onclick="abrirModalObservacion('${est.id}','${escapeHtml(est.nombre)}')"><i class="fa-solid fa-plus"></i> Añadir</button>
        </div>`;
    }).join('');
    document.getElementById('listaObservaciones').innerHTML = html || '<div class="empty-message">No hay estudiantes</div>';
}

function abrirModalObservacion(estId, estNombre) {
    document.getElementById('modalObservacionOverlay').style.display = 'flex';
    const select = document.getElementById('obsEstudiante');
    select.innerHTML = `<option value="${estId}">${estNombre}</option>`;
    document.getElementById('obsDescripcion').value = '';
}

function cerrarModalObservacion() {
    document.getElementById('modalObservacionOverlay').style.display = 'none';
}

function guardarObservacion() {
    const estId = parseInt(document.getElementById('obsEstudiante').value);
    const tipo = document.getElementById('obsTipo').value;
    const desc = document.getElementById('obsDescripcion').value.trim();
    if (!estId || !tipo || !desc) {
        mostrarToast('Completa todos los campos', 'error');
        return;
    }
    PERFIL_DOCENTE.crearObservacion(estId, tipo, desc);
    mostrarToast('Observación guardada', 'success');
    cerrarModalObservacion();
    cargarObservaciones();
}

// ========== ESTUDIANTES ==========

function renderizarEstudiantes() {
    const estudiantes = PERFIL_DOCENTE.getEstudiantes();
    const materia = PERFIL_DOCENTE.getMateriaAsignada();
    const html = estudiantes.map(est => {
        const m = est.materias.find(mt => mt.materiaId === materia?.materiaId);
        return `<div class="grupo-card">
            <img src="${PERFILES.obtenerAvatar(est.id)}" class="chat-avatar-list" onerror="this.src='../../assets/images/avatar.png'">
            <div style="flex:1">
                <div class="grupo-nombre">${escapeHtml(est.nombre)}</div>
                <div style="font-size:12px;color:#6B6B6C">${est.grado}-${est.seccion} | Promedio: <span style="color:${PERFILES.obtenerNotaColor(m?.promedio || 0)};font-weight:600">${m?.promedio || 0}%</span></div>
            </div>
            <button class="btn-primary" style="padding:6px 10px;font-size:10px" onclick="iniciarChatCon('${est.id}','${escapeHtml(est.nombre)}')" title="Chatear"><i class="fa-solid fa-comment"></i></button>
            <button class="btn-primary" style="padding:6px 10px;font-size:10px;background:#7A10C0" onclick="abrirModalObservacion('${est.id}','${escapeHtml(est.nombre)}')"><i class="fa-solid fa-clipboard"></i></button>
        </div>`;
    }).join('');
    document.getElementById('listaEstudiantes').innerHTML = html || '<div class="empty-message">No hay estudiantes</div>';

    document.getElementById('buscarEstudiante')?.addEventListener('input', (e) => {
        const txt = e.target.value.toLowerCase();
        document.querySelectorAll('#listaEstudiantes .grupo-card').forEach(c => {
            c.style.display = c.innerText.toLowerCase().includes(txt) ? 'flex' : 'none';
        });
    });
}

// ========== TAREAS DOCENTE ==========

function renderizarTareasDocente() {
    const tareas = TAREAS.getTareasDocente(usuarioActual.id);
    const grupoFiltro = document.getElementById('filtroTareaGrupoDocente')?.value || '';
    const estadoFiltro = document.getElementById('filtroTareaEstadoDocente')?.value || '';

    const grupos = GRUPOS.getGruposDocente(usuarioActual.id);
    const grupoSelect = document.getElementById('filtroTareaGrupoDocente');
    if (grupoSelect) {
        grupoSelect.innerHTML = '<option value="">Todos los grupos</option>' +
            grupos.map(g => `<option value="${g.codigo}">${escapeHtml(g.nombre)}</option>`).join('');
    }

    let filtradas = tareas;
    if (grupoFiltro) filtradas = filtradas.filter(t => t.grupoCodigo === grupoFiltro);
    if (estadoFiltro) filtradas = filtradas.filter(t => TAREAS.getEstadoTarea(t) === estadoFiltro);

    document.getElementById('listaTareasDocente').innerHTML = filtradas.map(t => {
        const stats = TAREAS.getEstadisticasTarea(t.id);
        const estadoTarea = TAREAS.getEstadoTarea(t);
        const estadoColor = estadoTarea === 'pendiente' ? '#D8A1FF' : '#B02B44';
        const estadoText = estadoTarea === 'pendiente' ? 'Activa' : 'Caducada';

        return `<div class="tarea-card" style="border-left-color:${estadoTarea === 'pendiente' ? '#560591' : '#B02B44'}">
            <div style="flex:1;min-width:200px">
                <div class="tarea-header">
                    <span class="tarea-titulo"><i class="fa-solid fa-tasks"></i> ${escapeHtml(t.titulo)}</span>
                    <span class="badge-nota" style="background:${estadoColor}15;color:${estadoColor};font-size:11px">${estadoText}</span>
                </div>
                <div class="tarea-desc">${escapeHtml(t.descripcion)}</div>
                <div class="tarea-footer">
                    <span><i class="fa-regular fa-calendar"></i> Límite: ${PERFILES.formatearFecha(t.fechaLimite)}</span>
                    <span><i class="fa-solid fa-layer-group"></i> ${escapeHtml(t.grupoNombre)}</span>
                    <span><i class="fa-solid fa-upload"></i> ${stats.total} entregas</span>
                    <span><i class="fa-solid fa-star"></i> Prom: ${stats.promedio}%</span>
                </div>
            </div>
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                <button class="btn-primary" style="padding:6px 12px;font-size:11px;background:#10b981" onclick="abrirEntregasTarea('${t.id}','${escapeHtml(t.titulo)}')"><i class="fa-solid fa-eye"></i> ${stats.total}</button>
                <button class="btn-primary" style="padding:6px 12px;font-size:11px;background:#D8A1FF" onclick="abrirEditarTarea('${t.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-primary" style="padding:6px 12px;font-size:11px;background:#B02B44" onclick="confirmarEliminarTarea('${t.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    }).join('') || '<div class="empty-message"><i class="fa-solid fa-tasks"></i><p>No has creado tareas aún. ¡Crea tu primera tarea!</p></div>';
}

function abrirModalCrearTarea() {
    const grupos = GRUPOS.getGruposDocente(usuarioActual.id);
    const select = document.getElementById('tareaGrupo');
    select.innerHTML = '<option value="">Seleccionar grupo</option>' +
        grupos.map(g => `<option value="${g.codigo}" data-nombre="${escapeHtml(g.nombre)}">${escapeHtml(g.nombre)}</option>`).join('');

    document.getElementById('modalTareaTitulo').innerHTML = '<i class="fa-solid fa-plus"></i> Nueva Tarea';
    document.getElementById('tareaTitulo').value = '';
    document.getElementById('tareaDescripcion').value = '';
    document.getElementById('tareaFechaLimite').value = '';
    document.getElementById('tareaValor').value = '';
    document.getElementById('tareaGrupo').value = '';
    document.getElementById('modalCrearTareaOverlay').dataset.editId = '';
    document.getElementById('modalCrearTareaOverlay').style.display = 'flex';
}

function cerrarModalCrearTarea() {
    document.getElementById('modalCrearTareaOverlay').style.display = 'none';
}

function guardarTareaDocente() {
    const titulo = document.getElementById('tareaTitulo').value.trim();
    const descripcion = document.getElementById('tareaDescripcion').value.trim();
    const grupoCodigo = document.getElementById('tareaGrupo').value;
    const fechaLimite = document.getElementById('tareaFechaLimite').value;
    const valor = parseInt(document.getElementById('tareaValor').value) || 0;
    const editId = document.getElementById('modalCrearTareaOverlay').dataset.editId;

    if (!titulo || !grupoCodigo || !fechaLimite) {
        mostrarToast('Completa todos los campos requeridos', 'error');
        return;
    }

    const grupos = GRUPOS.getGruposDocente(usuarioActual.id);
    const grupo = grupos.find(g => g.codigo === grupoCodigo);

    if (editId) {
        TAREAS.editarTarea(editId, { titulo, descripcion, grupoCodigo, fechaLimite, valor });
        mostrarToast('Tarea actualizada', 'success');
    } else {
        TAREAS.crearTarea(usuarioActual, {
            titulo, descripcion, grupoCodigo,
            grupoNombre: grupo?.nombre || grupoCodigo,
            materiaId: grupo?.materiaId || '',
            materiaNombre: grupo?.materiaNombre || '',
            grado: grupo?.grado || '',
            seccion: grupo?.seccion || '',
            fechaLimite, valor
        });
        mostrarToast('Tarea creada exitosamente', 'success');
    }
    cerrarModalCrearTarea();
    renderizarTareasDocente();
}

function abrirEditarTarea(tareaId) {
    const tareas = TAREAS.getTareas();
    const t = tareas.find(t => t.id === tareaId);
    if (!t) return;
    const grupos = GRUPOS.getGruposDocente(usuarioActual.id);
    const select = document.getElementById('tareaGrupo');
    select.innerHTML = '<option value="">Seleccionar grupo</option>' +
        grupos.map(g => `<option value="${g.codigo}" data-nombre="${escapeHtml(g.nombre)}">${escapeHtml(g.nombre)}</option>`).join('');

    document.getElementById('modalTareaTitulo').innerHTML = '<i class="fa-solid fa-pen"></i> Editar Tarea';
    document.getElementById('tareaTitulo').value = t.titulo;
    document.getElementById('tareaDescripcion').value = t.descripcion;
    document.getElementById('tareaFechaLimite').value = t.fechaLimite;
    document.getElementById('tareaValor').value = t.valor;
    document.getElementById('tareaGrupo').value = t.grupoCodigo;
    document.getElementById('modalCrearTareaOverlay').dataset.editId = tareaId;
    document.getElementById('modalCrearTareaOverlay').style.display = 'flex';
}

function confirmarEliminarTarea(tareaId) {
    const tareas = TAREAS.getTareas();
    const t = tareas.find(t => t.id === tareaId);
    if (!t) return;
    if (confirm(`¿Eliminar la tarea "${t.titulo}"? También se eliminarán todas las entregas.`)) {
        TAREAS.eliminarTarea(tareaId);
        mostrarToast('Tarea eliminada', 'success');
        renderizarTareasDocente();
    }
}

function abrirEntregasTarea(tareaId, tareaNombre) {
    const entregas = TAREAS.getEntregasTarea(tareaId);
    const tareas = TAREAS.getTareas();
    const tarea = tareas.find(t => t.id === tareaId);
    document.getElementById('modalEntregasTitulo').innerHTML = `<i class="fa-solid fa-eye"></i> Entregas: ${escapeHtml(tareaNombre)}`;

    document.getElementById('listaEntregasTarea').innerHTML = entregas.length === 0
        ? '<div class="empty-message">No hay entregas aún</div>'
        : entregas.map(e => {
            const cal = e.calificacion != null;
            return `<div class="tarea-card" style="border-left-color:${cal ? PERFILES.obtenerNotaColor(e.calificacion) : '#D8A1FF'}">
                <div style="flex:1;min-width:150px">
                    <div class="tarea-titulo">${escapeHtml(e.estudianteNombre)}</div>
                    <div class="tarea-desc" style="font-size:12px">
                        <div>${escapeHtml(e.contenido || 'Sin contenido')}</div>
                        ${e.archivos?.length ? `<div style="color:#560591;margin-top:4px"><i class="fa-solid fa-paperclip"></i> ${escapeHtml(e.archivos[0].nombre)}</div>` : ''}
                    </div>
                    <div class="tarea-footer" style="font-size:11px">
                        <span><i class="fa-regular fa-calendar"></i> ${e.fechaEntrega} ${e.horaEntrega || ''}</span>
                    </div>
                </div>
                <div style="text-align:right;min-width:120px">
                    ${cal
                        ? `<div style="font-weight:700;font-size:1.2rem;color:${PERFILES.obtenerNotaColor(e.calificacion)}">${e.calificacion}%</div>
                           <div style="font-size:11px;color:#6B6B6C">${escapeHtml(e.retroalimentacion || '')}</div>`
                        : `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                            <input type="number" id="calNota_${e.id}" placeholder="Nota" min="0" max="100" style="width:70px;padding:6px 10px;border:1px solid #E8DDD0;border-radius:10px;text-align:center;font-size:12px">
                            <button class="btn-primary" style="padding:6px 12px;font-size:11px" onclick="calificarEntrega('${e.id}','${tareaId}','${escapeHtml(tareaNombre)}')"><i class="fa-solid fa-check"></i></button>
                          </div>`
                    }
                </div>
            </div>`;
        }).join('');
    document.getElementById('modalEntregasTarea').style.display = 'flex';
}

function cerrarModalEntregas() {
    document.getElementById('modalEntregasTarea').style.display = 'none';
}

function calificarEntrega(entregaId, tareaId, tareaNombre) {
    const nota = parseFloat(document.getElementById(`calNota_${entregaId}`).value);
    if (isNaN(nota) || nota < 0 || nota > 100) {
        mostrarToast('Ingresa una nota válida (0-100)', 'error');
        return;
    }
    const retroInput = prompt('Retroalimentación (opcional):');
    TAREAS.calificarEntrega(entregaId, nota, retroInput || '');
    mostrarToast('Entrega calificada', 'success');
    abrirEntregasTarea(tareaId, tareaNombre);
    renderizarTareasDocente();
}

// ========== REPORTES ==========

function renderizarReportes() {
    const stats = PERFIL_DOCENTE.getEstadisticasDocente();
    const grupos = PERFIL_DOCENTE.getEstudiantesAgrupados();
    const materia = PERFIL_DOCENTE.getMateriaAsignada();

    const labels = Object.keys(grupos).map(k => `${grupos[k].grado}-${grupos[k].seccion}`);
    const promedios = Object.values(grupos).map(g => {
        const proms = g.estudiantes.map(e => {
            const m = e.materias.find(mt => mt.materiaId === materia?.materiaId);
            return m ? m.promedio : 0;
        }).filter(p => p > 0);
        return proms.length > 0 ? Math.round(proms.reduce((s, p) => s + p, 0) / proms.length) : 0;
    });

    if (charts.chartReporteGrupos) charts.chartReporteGrupos.destroy();
    const ctx = document.getElementById('chartReporteGrupos').getContext('2d');
    const promediosColors = promedios.map(p => PERFILES.obtenerNotaColor(p));
    charts.chartReporteGrupos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Promedio',
                data: promedios,
                backgroundColor: function(context) {
                    const c = context.chart;
                    const { ctx: ctx2, chartArea } = c;
                    if (!chartArea) return promediosColors[context.dataIndex];
                    const grad = ctx2.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    const base = promediosColors[context.dataIndex] || '#560591';
                    grad.addColorStop(0, base + '44');
                    grad.addColorStop(1, base);
                    return grad;
                },
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 800, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#3E036E',
                    padding: 12,
                    cornerRadius: 8,
                    bodyFont: { size: 13, weight: '500' },
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
                    ticks: { font: { size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 9 }, maxRotation: 30 }
                }
            }
        }
    });

    document.getElementById('resumenReporteDocente').innerHTML = `
        <div class="detalle-item"><i class="fa-solid fa-users"></i> <strong>Total Estudiantes:</strong> ${stats.totalEstudiantes}</div>
        <div class="detalle-item"><i class="fa-solid fa-file-pen"></i> <strong>Evaluaciones:</strong> ${stats.totalEvaluaciones}</div>
        <div class="detalle-item"><i class="fa-solid fa-star"></i> <strong>Promedio General:</strong> <span style="color:${PERFILES.obtenerNotaColor(stats.promedioGeneral)}">${stats.promedioGeneral}%</span></div>
        <div class="detalle-item"><i class="fa-solid fa-check-circle" style="color:#10b981"></i> <strong>Aprobados:</strong> ${stats.aprobados}</div>
        <div class="detalle-item"><i class="fa-solid fa-xmark-circle" style="color:#B02B44"></i> <strong>Reprobados:</strong> ${stats.reprobados}</div>
        <div class="detalle-item"><i class="fa-solid fa-chart-line"></i> <strong>Rendimiento:</strong> ${stats.rendimiento}%</div>
    `;

    const estudiantes = PERFIL_DOCENTE.getEstudiantes();
    estudiantes.sort((a, b) => {
        const ma = a.materias.find(mt => mt.materiaId === materia?.materiaId);
        const mb = b.materias.find(mt => mt.materiaId === materia?.materiaId);
        return (mb?.promedio || 0) - (ma?.promedio || 0);
    });

    document.getElementById('tablaRendimiento').innerHTML = estudiantes.map(est => {
        const m = est.materias.find(mt => mt.materiaId === materia?.materiaId);
        const prom = m ? m.promedio : 0;
        return `<div class="tarea-card" style="border-left-color:${PERFILES.obtenerNotaColor(prom)};cursor:pointer" onclick="abrirModalObservacion('${est.id}','${escapeHtml(est.nombre)}')">
            <div style="flex:1">
                <div class="tarea-titulo">${escapeHtml(est.nombre)}</div>
                <div style="font-size:12px;color:#6B6B6C">${est.grado}-${est.seccion}</div>
            </div>
            <div style="text-align:right">
                <div style="font-weight:700;font-size:1.2rem;color:${PERFILES.obtenerNotaColor(prom)}">${prom}%</div>
                <div style="font-size:11px;color:#6B6B6C">${PERFILES.obtenerLetraNota(prom)}</div>
            </div>
        </div>`;
    }).join('');
}

// ========== EVENT LISTENERS ==========

document.querySelectorAll('.menu a, .bottom-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sec = link.getAttribute('data-section');
        if (sec) cambiarSeccion(sec);
    });
});

document.getElementById('overlay')?.addEventListener('click', cerrarSidebar);

document.getElementById('buscarGeneral')?.addEventListener('input', (e) => {
    const txt = e.target.value.toLowerCase();
    document.querySelectorAll('.grupo-card, .trabajo-card, .entrega-card').forEach(c => {
        c.style.display = c.innerText.toLowerCase().includes(txt) ? 'flex' : 'none';
    });
});



function iniciarChatCon(estudianteId, estudianteNombre) {
    chatUI.iniciarChatCon(estudianteId, estudianteNombre);
    cambiarSeccion('chat');
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', inicializar);
