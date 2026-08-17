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
    if (!protegerRuta('estudiante')) return;
    usuarioActual = AUTENTICACION.usuarioActual();
    if (!usuarioActual) return;
    document.getElementById('saludoEstudiante').textContent = `Bienvenido, ${usuarioActual.nombre}`;
    cargarPerfil();
    renderizarDashboard();
    renderizarMaterias();
    renderizarNotas();
    renderizarAsistencia();
    renderizarCompetencias();
    renderizarObservaciones();
    renderizarHistorial();
    renderizarReportes();
    renderizarRecomendacionCarrera();
    renderizarGruposEstudiante();
    renderizarTareas();
    chatUI.init();
}

function cerrarSesion() {
    AUTENTICACION.cerrarSesion();
    window.location.href = 'auth/login.html';
}

function cambiarSeccion(sectionId) {
    document.querySelectorAll('.dashboard').forEach(sec => sec.classList.remove('active-section'));
    const el = document.getElementById(sectionId);
    if (el) el.classList.add('active-section');
    document.querySelectorAll('.menu a, .bottom-nav a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
    });
    if (window.innerWidth <= 768) cerrarSidebar();
    if (sectionId === 'notas') renderizarNotas();
    if (sectionId === 'asistencia') renderizarAsistencia();
    if (sectionId === 'competencias') renderizarCompetencias();
    if (sectionId === 'observaciones') renderizarObservaciones();
    if (sectionId === 'historial') renderizarHistorial();
    if (sectionId === 'reportes') renderizarReportes();
    if (sectionId === 'carrera') renderizarRecomendacionCarrera();
    if (sectionId === 'materias') renderizarMaterias();
    if (sectionId === 'tareas') renderizarTareas();
    if (sectionId === 'grupos') renderizarGruposEstudiante();
    if (sectionId === 'chat') {
        document.body.classList.add('chat-active');
        chatUI.renderizarConversaciones();
        chatUI.actualizarNotificaciones();
    } else {
        document.body.classList.remove('chat-active');
        document.body.classList.remove('chat-conversacion-open');
    }
}

function toggleSidebar() {
    document.getElementById('mainSidebar').classList.add('mobile-open');
    document.getElementById('sidebarOverlay').classList.add('active');
}

function cerrarSidebar() {
    document.getElementById('mainSidebar').classList.remove('mobile-open');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// ========== PERFIL ==========

function cargarPerfil() {
    if (!usuarioActual) return;
    const u = usuarioActual;
    document.getElementById('perfilNombre').textContent = u.nombre;
    document.getElementById('perfilEmail').textContent = u.correo;
    document.getElementById('perfilCodigo').textContent = `Código: ${u.codigo || 'N/A'}`;
    document.getElementById('perfilGrado').textContent = `${u.grado || 'N/A'} - Sección ${u.seccion || 'N/A'}`;
    document.getElementById('perfilInstituto').textContent = u.instituto || 'No especificado';
    document.getElementById('perfilTelefono').textContent = u.telefono || 'No registrado';
    document.getElementById('perfilDireccion').textContent = u.direccion || 'No registrada';
    document.getElementById('perfilTutor').textContent = u.tutor || 'No registrado';
    document.getElementById('perfilFecha').textContent = u.fechaRegistro || '2024';
    const prom = PERFIL_ALUMNO.getPromedioGeneral(u.id);
    document.getElementById('perfilPromedio').innerHTML = `Promedio General: <strong style="color:${PERFILES.obtenerNotaColor(prom)}">${prom}%</strong>`;
    const avatarSrc = PERFILES.obtenerAvatar(u.id);
    document.getElementById('avatarImg').src = avatarSrc;
}

function cambiarAvatar(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            PERFILES.guardarAvatar(usuarioActual.id, e.target.result);
            document.getElementById('avatarImg').src = e.target.result;
            PERFILES.mostrarToast('Foto de perfil actualizada', 'success');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ========== DASHBOARD ==========

function renderizarDashboard() {
    const materias = PERFIL_ALUMNO.getMateriasEstudiante(usuarioActual.id);
    const prom = PERFIL_ALUMNO.getPromedioGeneral(usuarioActual.id);
    const asisPct = PERFIL_ALUMNO.getAsistenciaPorcentaje(usuarioActual.id);
    document.getElementById('totalMaterias').textContent = materias.length;
    document.getElementById('totalPromedio').textContent = `${prom}%`;
    document.getElementById('totalPromedio').style.color = PERFILES.obtenerNotaColor(prom);
    document.getElementById('totalAsistencia').textContent = `${asisPct}%`;

    const ranking = PERFIL_ALUMNO.getRankingEstudiante(usuarioActual.id);
    document.getElementById('totalRanking').textContent = ranking ? `#${ranking.posicion}/${ranking.total}` : '-';

    const materiasHtml = materias.map(m => `
        <div class="tarea-card" onclick="abrirModalMateria('${m.materiaId}')" style="cursor:pointer;border-left-color:${PERFILES.obtenerNotaColor(m.promedio)}">
            <div class="tarea-header"><span class="tarea-titulo"><i class="fa-solid fa-book"></i> ${PERFILES.escapeHtml(m.materiaNombre)}</span><span class="badge-nota" style="background:${PERFILES.obtenerNotaColor(m.promedio)};color:white">${m.promedio}%</span></div>
            <div class="tarea-desc">Docente: ${PERFILES.escapeHtml(m.docenteNombre)} | ${PERFILES.escapeHtml(m.horario)}</div>
            <div class="tarea-footer"><span>${PERFILES.escapeHtml(m.grado)} - Sección ${PERFILES.escapeHtml(m.seccion)}</span><span>${m.evaluaciones.length} evaluaciones</span></div>
        </div>
    `).join('') || '<div class="empty-message"><i class="fa-regular fa-book"></i><p>No hay materias asignadas</p></div>';
    document.getElementById('listaMateriasDashboard').innerHTML = materiasHtml;

    renderizarChartRendimiento();
    renderizarChartCompetenciasDash();
}

function renderizarChartRendimiento() {
    const materias = PERFIL_ALUMNO.getMateriasEstudiante(usuarioActual.id);
    const labels = materias.map(m => m.materiaNombre.length > 12 ? m.materiaNombre.slice(0, 10) + '...' : m.materiaNombre);
    const data = materias.map(m => m.promedio);
    const colores = data.map(d => PERFILES.obtenerNotaColor(d));

    if (charts.chartRendimiento) charts.chartRendimiento.destroy();
    const ctx = document.getElementById('chartRendimiento').getContext('2d');
    charts.chartRendimiento = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Promedio',
                data,
                backgroundColor: function(context) {
                    const c = context.chart;
                    const { ctx: ctx2, chartArea } = c;
                    if (!chartArea) return colores[context.dataIndex];
                    const grad = ctx2.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    const base = colores[context.dataIndex] || '#6366f1';
                    grad.addColorStop(0, base + '55');
                    grad.addColorStop(1, base);
                    return grad;
                },
                borderColor: colores,
                borderWidth: { top: 0, right: 0, bottom: 0, left: 0 },
                borderRadius: 6,
                borderSkipped: false,
                hoverBackgroundColor: colores.map(c => c + 'dd'),
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 800, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleFont: { size: 12, weight: '600' },
                    bodyFont: { size: 13, weight: '500' },
                    padding: 12,
                    cornerRadius: 8,
                    boxPadding: 6,
                    callbacks: {
                        label: function(ctx) {
                            const m = materias[ctx.dataIndex];
                            return ` ${m.materiaNombre}: ${m.promedio}%`;
                        }
                    }
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
}

function renderizarChartCompetenciasDash() {
    const comps = PERFIL_ALUMNO.getCompetencias(usuarioActual.id);
    const labels = comps.map(c => c.nombre);
    const data = comps.map(c => c.nivel);

    if (charts.chartCompetencias) charts.chartCompetencias.destroy();
    const ctx = document.getElementById('chartCompetencias').getContext('2d');

    const gradientBg = ctx.createRadialGradient(0, 0, 0, 0, 0, 120);
    gradientBg.addColorStop(0, 'rgba(99,102,241,0.35)');
    gradientBg.addColorStop(0.6, 'rgba(99,102,241,0.15)');
    gradientBg.addColorStop(1, 'rgba(99,102,241,0.02)');

    charts.chartCompetencias = new Chart(ctx, {
        type: 'radar',
        data: {
            labels,
            datasets: [{
                label: 'Nivel',
                data,
                backgroundColor: gradientBg,
                borderColor: '#6366f1',
                borderWidth: 2.5,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#4f46e5',
                hoverBorderColor: '#4f46e5',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 1000, easing: 'easeOutElastic' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { size: 12, weight: '600' },
                    bodyFont: { size: 13, weight: '500' },
                    callbacks: {
                        label: function(ctx) { return ` ${ctx.parsed.r}%`; }
                    }
                }
            },
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 25,
                        font: { size: 9 },
                        backdropColor: 'transparent',
                        color: '#94a3b8',
                    },
                    grid: {
                        color: [
                            'rgba(99,102,241,0.08)',
                            'rgba(99,102,241,0.08)',
                            'rgba(99,102,241,0.08)',
                            'rgba(99,102,241,0.08)',
                        ],
                    },
                    angleLines: {
                        color: 'rgba(99,102,241,0.08)',
                    },
                    pointLabels: {
                        font: { size: 10, weight: '600' },
                        color: '#475569',
                    }
                }
            }
        }
    });
}

// ========== MATERIAS ==========

function renderizarMaterias() {
    const materias = PERFIL_ALUMNO.getMateriasEstudiante(usuarioActual.id);
    document.getElementById('listaMaterias').innerHTML = materias.map(m => `
        <div class="tarea-card" onclick="abrirModalMateria('${m.materiaId}')" style="cursor:pointer;border-left-color:${PERFILES.obtenerNotaColor(m.promedio)}">
            <div class="tarea-header">
                <span class="tarea-titulo"><i class="fa-solid fa-book"></i> ${PERFILES.escapeHtml(m.materiaNombre)}</span>
                <span class="badge-nota" style="background:${PERFILES.obtenerNotaColor(m.promedio)};color:white">${m.promedio}%</span>
            </div>
            <div class="tarea-desc">
                <div><i class="fa-solid fa-chalkboard-user"></i> Docente: ${PERFILES.escapeHtml(m.docenteNombre)}</div>
                <div><i class="fa-solid fa-clock"></i> Horario: ${PERFILES.escapeHtml(m.horario)}</div>
                <div><i class="fa-solid fa-layer-group"></i> ${PERFILES.escapeHtml(m.grado)} - Sección ${PERFILES.escapeHtml(m.seccion)}</div>
            </div>
            <div class="tarea-footer">
                <span><i class="fa-solid fa-file-pen"></i> ${m.evaluaciones.length} evaluaciones</span>
                <span><i class="fa-solid fa-brain"></i> ${m.competencias.length} competencias</span>
            </div>
        </div>
    `).join('') || '<div class="empty-message"><i class="fa-regular fa-book"></i><p>No hay materias asignadas</p></div>';

    const select = document.getElementById('filtroMateriaNotas');
    if (select) {
        select.innerHTML = '<option value="">Todas las materias</option>' +
            materias.map(m => `<option value="${m.materiaId}">${PERFILES.escapeHtml(m.materiaNombre)}</option>`).join('');
    }
}

function abrirModalMateria(materiaId) {
    const materias = PERFIL_ALUMNO.getMateriasEstudiante(usuarioActual.id);
    const m = materias.find(mt => mt.materiaId === materiaId);
    if (!m) return;
    document.getElementById('modalMateriaTitulo').innerHTML = `<i class="fa-solid fa-book-open"></i> ${PERFILES.escapeHtml(m.materiaNombre)}`;
    const evsHtml = m.evaluaciones.map(ev => {
        const cal = m.calificaciones.find(c => c.evaluacionId === ev.id);
        const nota = cal ? cal.nota : '-';
        const color = cal ? PERFILES.obtenerNotaColor(cal.nota) : '#94a3b8';
        return `<div class="tarea-card" style="border-left-color:${color}">
            <div class="tarea-header"><span class="tarea-titulo">${PERFILES.escapeHtml(ev.nombre)}</span><span class="badge-nota" style="background:${color};color:white">${nota}${cal ? '/'+ev.puntajeMaximo : ''}</span></div>
            <div class="tarea-desc">${PERFILES.escapeHtml(ev.descripcion)}</div>
            <div class="tarea-footer"><span><i class="fa-regular fa-calendar"></i> ${PERFILES.formatearFecha(ev.fecha)}</span><span>Valor: ${ev.valor}%</span></div>
        </div>`;
    }).join('') || '<div class="empty-message">Sin evaluaciones</div>';

    const compsHtml = m.competencias.map(c =>
        `<span class="badge-competencia" style="background:#e0e7ff;color:#4f46e5;padding:4px 12px;border-radius:20px;font-size:12px;display:inline-block;margin:3px">${PERFILES.escapeHtml(c)}</span>`
    ).join('');

    document.getElementById('modalMateriaBody').innerHTML = `
        <div style="margin-bottom:20px">
            <p><strong>Docente:</strong> ${PERFILES.escapeHtml(m.docenteNombre)}</p>
            <p><strong>Horario:</strong> ${PERFILES.escapeHtml(m.horario)}</p>
            <p><strong>Grado:</strong> ${PERFILES.escapeHtml(m.grado)} - Sección ${PERFILES.escapeHtml(m.seccion)}</p>
            <p><strong>Promedio:</strong> <span style="color:${PERFILES.obtenerNotaColor(m.promedio)};font-weight:700">${m.promedio}%</span></p>
            <div style="margin-top:10px"><strong>Competencias:</strong><br>${compsHtml}</div>
            <p style="margin-top:10px"><strong>Fortaleza:</strong> ${PERFILES.escapeHtml(m.fortaleza)}</p>
            <p><strong>Debilidad:</strong> ${PERFILES.escapeHtml(m.debilidad)}</p>
        </div>
        <div class="bloque-header"><h3 style="font-size:1rem"><i class="fa-solid fa-file-pen"></i> Evaluaciones y Calificaciones</h3></div>
        ${evsHtml}
    `;
    document.getElementById('modalMateriaOverlay').style.display = 'flex';
}

function cerrarModalMateria() {
    document.getElementById('modalMateriaOverlay').style.display = 'none';
}

// ========== CALIFICACIONES ==========

function renderizarNotas() {
    const materiaId = document.getElementById('filtroMateriaNotas')?.value || '';
    const materias = PERFIL_ALUMNO.getMateriasEstudiante(usuarioActual.id);
    const filtradas = materiaId ? materias.filter(m => m.materiaId === materiaId) : materias;
    let html = '';
    filtradas.forEach(m => {
        html += `<div class="bloque-header" style="margin-top:15px"><h3 style="font-size:1rem"><i class="fa-solid fa-book"></i> ${PERFILES.escapeHtml(m.materiaNombre)} - Promedio: <span style="color:${PERFILES.obtenerNotaColor(m.promedio)}">${m.promedio}%</span></h3></div>`;
        m.calificaciones.forEach(c => {
            const ev = m.evaluaciones.find(e => e.id === c.evaluacionId);
            html += `<div class="tarea-card" style="border-left-color:${PERFILES.obtenerNotaColor(c.nota)}">
                <div class="tarea-header"><span class="tarea-titulo">${PERFILES.escapeHtml(ev?.nombre || 'Evaluación')}</span><span class="badge-nota" style="background:${PERFILES.obtenerNotaColor(c.nota)};color:white">${c.nota}/${c.puntajeMaximo}</span></div>
                <div class="tarea-footer"><span><i class="fa-regular fa-calendar"></i> ${PERFILES.formatearFecha(c.fecha)}</span><span>Letra: ${PERFILES.obtenerLetraNota(c.nota)}</span></div>
            </div>`;
        });
    });
    document.getElementById('listaNotas').innerHTML = html || '<div class="empty-message"><i class="fa-regular fa-star"></i><p>No hay calificaciones disponibles</p></div>';
}

// ========== ASISTENCIA ==========

function renderizarAsistencia() {
    const asistencias = PERFIL_ALUMNO.getAsistencias(usuarioActual.id);
    const presentes = asistencias.filter(a => a.tipo === 'Presente').length;
    const ausentes = asistencias.filter(a => a.tipo === 'Ausente').length;
    const tardes = asistencias.filter(a => a.tipo === 'Tarde').length;
    const justificados = asistencias.filter(a => a.tipo === 'Justificado').length;
    document.getElementById('asisPresentes').textContent = presentes;
    document.getElementById('asisAusentes').textContent = ausentes;
    document.getElementById('asisTardes').textContent = tardes;
    document.getElementById('asisJustificados').textContent = justificados;

    if (charts.chartAsistencia) charts.chartAsistencia.destroy();
    const ctx = document.getElementById('chartAsistencia').getContext('2d');
    const total = presentes + ausentes + tardes + justificados;
    charts.chartAsistencia = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Presentes', 'Ausentes', 'Tardes', 'Justificados'],
            datasets: [{
                data: [presentes, ausentes, tardes, justificados],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#6366f1'],
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
                        color: '#475569',
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { size: 12, weight: '600' },
                    bodyFont: { size: 13, weight: '500' },
                    callbacks: {
                        label: function(ctx) {
                            const pct = total > 0 ? Math.round(ctx.parsed / total * 100) : 0;
                            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    const html = asistencias.slice(-20).reverse().map(a => `
        <div class="tarea-card" style="border-left-color:${a.tipo === 'Presente' ? '#10b981' : a.tipo === 'Ausente' ? '#ef4444' : a.tipo === 'Tarde' ? '#f59e0b' : '#6366f1'}">
            <div class="tarea-header"><span class="tarea-titulo"><i class="fa-regular fa-calendar"></i> ${PERFILES.formatearFecha(a.fecha)}</span><span class="badge-nota" style="background:${a.tipo === 'Presente' ? '#dcfce7' : a.tipo === 'Ausente' ? '#fee2e2' : a.tipo === 'Tarde' ? '#fef3c7' : '#e0e7ff'};color:${a.tipo === 'Presente' ? '#16a34a' : a.tipo === 'Ausente' ? '#ef4444' : a.tipo === 'Tarde' ? '#d97706' : '#4f46e5'}">${PERFILES.escapeHtml(a.tipo)}</span></div>
        </div>
    `).join('');
    document.getElementById('listaAsistencia').innerHTML = html || '<div class="empty-message"><i class="fa-regular fa-calendar"></i><p>No hay registros de asistencia</p></div>';
}

// ========== COMPETENCIAS ==========

function renderizarCompetencias() {
    const comps = PERFIL_ALUMNO.getCompetencias(usuarioActual.id);
    const fortalezas = PERFIL_ALUMNO.getFortalezas(usuarioActual.id);
    const debilidades = PERFIL_ALUMNO.getDebilidades(usuarioActual.id);

    if (charts.chartCompetenciasDetalle) charts.chartCompetenciasDetalle.destroy();
    if (comps.length > 0) {
        const ctx = document.getElementById('chartCompetenciasDetalle').getContext('2d');
        charts.chartCompetenciasDetalle = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: comps.map(c => c.nombre),
                datasets: [{
                    label: 'Nivel',
                    data: comps.map(c => c.nivel),
                    backgroundColor: function(context) {
                        const c = context.chart;
                        const { ctx: ctx2, chartArea } = c;
                        if (!chartArea) return PERFILES.obtenerNotaColor(comps[context.dataIndex]?.nivel || 0);
                        const grad = ctx2.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                        const base = PERFILES.obtenerNotaColor(comps[context.dataIndex]?.nivel || 0);
                        grad.addColorStop(0, base + '99');
                        grad.addColorStop(1, base);
                        return grad;
                    },
                    borderColor: comps.map(c => PERFILES.obtenerNotaColor(c.nivel)),
                    borderWidth: 0,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                animation: { duration: 800, easing: 'easeOutQuart' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        padding: 12,
                        cornerRadius: 8,
                        bodyFont: { size: 13, weight: '500' },
                        callbacks: {
                            label: function(ctx) { return ` ${ctx.parsed.x}%`; }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
                        ticks: { font: { size: 9 } }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { size: 10, weight: '600' }, color: '#475569' }
                    }
                }
            }
        });
    }

    document.getElementById('listaCompetencias').innerHTML = comps.map(c =>
        `<div class="tarea-card" style="border-left-color:${PERFILES.obtenerNotaColor(c.nivel)}">
            <div class="tarea-header"><span class="tarea-titulo">${PERFILES.escapeHtml(c.nombre)}</span><span class="badge-nota" style="background:${PERFILES.obtenerNotaColor(c.nivel)};color:white">${c.nivel}%</span></div>
            <div class="tarea-footer"><span>Tendencia: ${PERFILES.escapeHtml(c.tendencia || 'estable')}</span></div>
        </div>`
    ).join('') || '<div class="empty-message">Sin competencias registradas</div>';

    document.getElementById('listaFortalezas').innerHTML = fortalezas.map(f =>
        `<div class="tarea-card" style="border-left-color:#10b981"><div class="tarea-titulo"><i class="fa-solid fa-thumbs-up" style="color:#10b981"></i> ${PERFILES.escapeHtml(f)}</div></div>`
    ).join('') || '<div class="empty-message">Sin fortalezas registradas</div>';

    document.getElementById('listaDebilidades').innerHTML = debilidades.map(d =>
        `<div class="tarea-card" style="border-left-color:#f59e0b"><div class="tarea-titulo"><i class="fa-solid fa-thumbs-down" style="color:#f59e0b"></i> ${PERFILES.escapeHtml(d)}</div></div>`
    ).join('') || '<div class="empty-message">Sin áreas por mejorar</div>';
}

// ========== OBSERVACIONES ==========

function renderizarObservaciones() {
    const obs = PERFIL_ALUMNO.getObservaciones(usuarioActual.id);
    document.getElementById('listaObservaciones').innerHTML = obs.map(o =>
        `<div class="tarea-card" style="border-left-color:#8b5cf6">
            <div class="tarea-header"><span class="tarea-titulo"><i class="fa-solid fa-clipboard"></i> ${PERFILES.escapeHtml(o.tipo)}</span><span class="badge-nota" style="background:#e0e7ff;color:#4f46e5">${PERFILES.formatearFecha(o.fecha)}</span></div>
            <div class="tarea-desc">${PERFILES.escapeHtml(o.descripcion)}</div>
            <div class="tarea-footer"><span>Por: ${PERFILES.escapeHtml(o.docenteNombre || 'Docente')}</span></div>
        </div>`
    ).join('') || '<div class="empty-message"><i class="fa-regular fa-clipboard"></i><p>Sin observaciones registradas</p></div>';
}

// ========== HISTORIAL ==========

function renderizarHistorial() {
    const materias = PERFIL_ALUMNO.getMateriasEstudiante(usuarioActual.id);
    const html = materias.map(m => `
        <div class="tarea-card" style="border-left-color:${PERFILES.obtenerNotaColor(m.promedio)}">
            <div class="tarea-header"><span class="tarea-titulo"><i class="fa-solid fa-book"></i> ${PERFILES.escapeHtml(m.materiaNombre)}</span></div>
            <div class="tarea-desc">
                <div><strong>Promedio:</strong> <span style="color:${PERFILES.obtenerNotaColor(m.promedio)}">${m.promedio}% (${PERFILES.obtenerLetraNota(m.promedio)})</span></div>
                <div><strong>Evaluaciones:</strong> ${m.evaluaciones.length} | <strong>Calificadas:</strong> ${m.calificaciones.length}</div>
                <div><strong>Fortaleza:</strong> ${PERFILES.escapeHtml(m.fortaleza)}</div>
                <div><strong>Debilidad:</strong> ${PERFILES.escapeHtml(m.debilidad)}</div>
            </div>
        </div>
    `).join('');
    document.getElementById('listaHistorial').innerHTML = html || '<div class="empty-message"><i class="fa-regular fa-clock"></i><p>Sin historial disponible</p></div>';
}

// ========== REPORTES ==========

function renderizarReportes() {
    const materias = PERFIL_ALUMNO.getMateriasEstudiante(usuarioActual.id);
    const est = PERFIL_ALUMNO.getEstadisticasEstudiante(usuarioActual.id);

    if (charts.chartReporteMaterias) charts.chartReporteMaterias.destroy();
    const ctx = document.getElementById('chartReporteMaterias').getContext('2d');
    const materiasData = materias.map(m => m.promedio);
    const materiasColors = materias.map(m => PERFILES.obtenerNotaColor(m.promedio));
    charts.chartReporteMaterias = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: materias.map(m => m.materiaNombre),
            datasets: [{
                label: 'Promedio',
                data: materiasData,
                backgroundColor: function(context) {
                    const c = context.chart;
                    const { ctx: ctx2, chartArea } = c;
                    if (!chartArea) return materiasColors[context.dataIndex];
                    const grad = ctx2.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    const base = materiasColors[context.dataIndex] || '#6366f1';
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
                    backgroundColor: '#1e293b',
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

    document.getElementById('resumenReportes').innerHTML = `
        <div class="detalle-item"><i class="fa-solid fa-star"></i> <strong>Promedio General:</strong> <span style="color:${PERFILES.obtenerNotaColor(est.promedioGeneral)}">${est.promedioGeneral}%</span></div>
        <div class="detalle-item"><i class="fa-solid fa-book-open"></i> <strong>Materias Cursando:</strong> ${est.materiasCursando}</div>
        <div class="detalle-item"><i class="fa-solid fa-check-circle" style="color:#10b981"></i> <strong>Aprobadas:</strong> ${est.materiasAprobadas}</div>
        <div class="detalle-item"><i class="fa-solid fa-xmark-circle" style="color:#ef4444"></i> <strong>Reprobadas:</strong> ${est.materiasReprobadas}</div>
        <div class="detalle-item"><i class="fa-solid fa-calendar-check"></i> <strong>Asistencia:</strong> ${est.asistenciaPorcentaje}%</div>
        <div class="detalle-item"><i class="fa-solid fa-arrow-up" style="color:#10b981"></i> <strong>Mejor Materia:</strong> ${est.mejorMateria}%</div>
        <div class="detalle-item"><i class="fa-solid fa-arrow-down" style="color:#ef4444"></i> <strong>Peor Materia:</strong> ${est.peorMateria}%</div>
        <div class="detalle-item"><i class="fa-solid fa-chart-line"></i> <strong>Rendimiento:</strong> ${est.rendimiento}%</div>
    `;
}

// ========== CARRERA ==========

function renderizarRecomendacionCarrera() {
    const rec = PERFIL_ALUMNO.recomendarCarrera(usuarioActual.id);
    if (!rec) return;
    document.getElementById('recomendacionCarrera').innerHTML = `
        <div style="text-align:center;padding:20px">
            <div style="font-size:60px;margin-bottom:15px"><i class="fa-solid fa-graduation-cap" style="color:#60a5fa"></i></div>
            <h2 style="color:white;font-size:1.8rem;margin-bottom:5px">${PERFILES.escapeHtml(rec.carreraRecomendada)}</h2>
            <div style="display:flex;justify-content:center;gap:20px;margin:15px 0;flex-wrap:wrap">
                <span class="badge-nota" style="background:${rec.confianza === 'Muy Alto' ? '#10b981' : rec.confianza === 'Alto' ? '#3b82f6' : rec.confianza === 'Moderado' ? '#f59e0b' : '#ef4444'};color:white;font-size:14px;padding:6px 18px">Confianza: ${rec.confianza}</span>
                <span class="badge-nota" style="background:#6366f1;color:white;font-size:14px;padding:6px 18px">Puntaje: ${rec.puntaje}%</span>
            </div>
            <p style="color:#94a3b8;font-size:14px;max-width:600px;margin:auto">${PERFILES.escapeHtml(rec.justificacion)}</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:20px">
            <div style="background:rgba(255,255,255,0.1);border-radius:16px;padding:20px">
                <h4 style="color:#60a5fa;margin-bottom:10px"><i class="fa-solid fa-brain"></i> Competencias Relacionadas</h4>
                ${rec.competenciasRelacionadas.map(c => `<span class="badge-nota" style="background:rgba(96,165,250,0.2);color:#93c5fd;margin:3px;display:inline-block">${PERFILES.escapeHtml(c)}</span>`).join('')}
            </div>
            <div style="background:rgba(255,255,255,0.1);border-radius:16px;padding:20px">
                <h4 style="color:#fbbf24;margin-bottom:10px"><i class="fa-solid fa-thumbs-up"></i> Fortalezas</h4>
                ${rec.fortalezas.map(f => `<div style="color:#d1d5db;padding:4px 0"><i class="fa-solid fa-check" style="color:#10b981"></i> ${PERFILES.escapeHtml(f)}</div>`).join('')}
            </div>
        </div>
        <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px;margin-top:15px">
            <h4 style="color:#fbbf24;margin-bottom:10px"><i class="fa-solid fa-arrow-up"></i> Áreas por Mejorar</h4>
            ${rec.areasMejorar.map(a => `<span class="badge-nota" style="background:rgba(251,191,36,0.2);color:#fcd34d;margin:3px;display:inline-block">${PERFILES.escapeHtml(a)}</span>`).join('')}
        </div>
    `;

    const gustariaEl = document.querySelector('#carreraGustaria .carrera-secundaria');
    if (gustariaEl && rec.masGustaria) {
        gustariaEl.innerHTML = `
            <div style="text-align:center;padding:15px">
                <div style="font-size:40px;margin-bottom:10px"><i class="fa-solid fa-heart" style="color:#ef4444"></i></div>
                <h3>${PERFILES.escapeHtml(rec.masGustaria.nombre)}</h3>
                <div style="margin-top:10px"><span class="badge-nota" style="background:#6366f1;color:white">${rec.masGustaria.puntaje}% afinidad</span></div>
                <div style="margin-top:10px">${rec.masGustaria.competencias.map(c => `<span class="badge-nota" style="background:#e0e7ff;color:#4f46e5;margin:3px">${PERFILES.escapeHtml(c)}</span>`).join('')}</div>
            </div>`;
    }

    const exitoEl = document.querySelector('#carreraExito .carrera-secundaria');
    if (exitoEl && rec.mayorExito && rec.mayorExito.length > 1) {
        exitoEl.innerHTML = rec.mayorExito.slice(0, 3).map(c => `
            <div class="tarea-card" style="border-left-color:#10b981;margin-bottom:8px">
                <div class="tarea-header"><span class="tarea-titulo">${PERFILES.escapeHtml(c.nombre)}</span><span class="badge-nota" style="background:#10b981;color:white">${c.puntaje}%</span></div>
            </div>
        `).join('');
    }
}

// ========== RANKING HELPER ==========

PERFIL_ALUMNO.getRankingEstudiante = function(id) {
    const materias = this.getMateriasEstudiante(id);
    const materiaId = materias.length > 0 ? materias[0].materiaId : null;
    if (!materiaId) return null;
    return this.getRankingEstudiantes(id, materiaId);
};

// ========== EVENT LISTENERS ==========

document.querySelectorAll('.menu a, .bottom-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sec = link.getAttribute('data-section');
        if (sec) cambiarSeccion(sec);
    });
});

document.getElementById('buscarGeneral')?.addEventListener('input', (e) => {
    const txt = e.target.value.toLowerCase();
    document.querySelectorAll('.tarea-card, .grupo-card, .chat-card').forEach(c => {
        c.style.display = c.innerText.toLowerCase().includes(txt) ? 'flex' : 'none';
    });
});

// ========== GRUPOS ESTUDIANTE ==========

function renderizarGruposEstudiante() {
    const grupos = GRUPOS.getGruposEstudiante(usuarioActual.id);
    const html = grupos.map(g => `
        <div class="grupo-card" style="border-left-color:#2563eb">
            <div style="flex:1">
                <div class="grupo-nombre"><i class="fa-solid fa-layer-group"></i> ${PERFILES.escapeHtml(g.nombre)}</div>
                <div class="grupo-desc">${PERFILES.escapeHtml(g.materiaNombre)} | ${PERFILES.escapeHtml(g.grado)} - Sección ${PERFILES.escapeHtml(g.seccion)}</div>
                <div class="grupo-footer" style="margin-top:6px">
                    <span><i class="fa-solid fa-chalkboard-user"></i> Docente: ${PERFILES.escapeHtml(g.docenteNombre)}</span>
                    <span class="badge-nota" style="background:#e0e7ff;color:#4f46e5;font-family:monospace;font-size:10px">Código: ${g.codigo}</span>
                </div>
            </div>
        </div>
    `).join('');
    document.getElementById('listaGruposEstudiante').innerHTML = html || '<div class="empty-message"><i class="fa-solid fa-layer-group"></i><p>No estás inscrito en ningún grupo. Ingresa un código para unirte.</p></div>';
}

function unirseAGrupo() {
    const codigo = document.getElementById('codigoGrupoInput').value.trim().toUpperCase();
    if (!codigo) {
        PERFILES.mostrarToast('Ingresa un código de grupo', 'error');
        return;
    }
    if (!usuarioActual.instituto) {
        PERFILES.mostrarToast('Debes pertenecer a un instituto para unirte a un grupo', 'error');
        return;
    }
    const resultado = GRUPOS.unirseAGrupo(codigo, usuarioActual, usuarioActual.instituto);
    if (resultado.exito) {
        PERFILES.mostrarToast(`Te has unido a "${resultado.grupo.nombre}"`, 'success');
        document.getElementById('codigoGrupoInput').value = '';
        renderizarGruposEstudiante();
    } else {
        const mensajes = {
            codigo_invalido: 'El código ingresado no es válido o no existe.',
            instituto_diferente: 'Este grupo pertenece a otro instituto. No puedes unirte.',
            ya_inscrito: 'Ya estás inscrito en este grupo.'
        };
        PERFILES.mostrarToast(mensajes[resultado.mensaje] || 'Error al unirse al grupo', 'error');
    }
}

// ========== TAREAS ESTUDIANTE ==========

function renderizarTareas() {
    const tareas = TAREAS.getTareasEstudiante(usuarioActual);
    const estadoFiltro = document.getElementById('filtroTareaEstado')?.value || '';
    const grupoFiltro = document.getElementById('filtroTareaGrupo')?.value || '';

    const grupos = GRUPOS.getGruposEstudiante(usuarioActual.id);
    const grupoSelect = document.getElementById('filtroTareaGrupo');
    if (grupoSelect) {
        grupoSelect.innerHTML = '<option value="">Todos los grupos</option>' +
            grupos.map(g => `<option value="${g.codigo}">${PERFILES.escapeHtml(g.nombre)}</option>`).join('');
    }

    let filtradas = tareas;
    if (estadoFiltro) {
        filtradas = filtradas.filter(t => {
            const estado = TAREAS.getEstadoTarea(t);
            if (estadoFiltro === 'pendiente') return estado === 'pendiente';
            if (estadoFiltro === 'caducada') return estado === 'caducada';
            if (estadoFiltro === 'entregada') return TAREAS.getEntrega(t.id, usuarioActual.id)?.estado === 'entregada';
            if (estadoFiltro === 'calificada') return TAREAS.getEntrega(t.id, usuarioActual.id)?.estado === 'calificada';
            return true;
        });
    }
    if (grupoFiltro) filtradas = filtradas.filter(t => t.grupoCodigo === grupoFiltro);

    const ahora = new Date();
    document.getElementById('listaTareas').innerHTML = filtradas.map(t => {
        const entrega = TAREAS.getEntrega(t.id, usuarioActual.id);
        const estadoTarea = TAREAS.getEstadoTarea(t);
        const limite = new Date(t.fechaLimite);
        const diasRestantes = Math.ceil((limite - ahora) / (1000 * 60 * 60 * 24));

        let estadoBadge, estadoColor, accionHtml;
        if (entrega?.estado === 'calificada') {
            estadoBadge = `Calificada: ${entrega.calificacion}%`;
            estadoColor = '#10b981';
            accionHtml = `<button class="btn-primary" style="padding:6px 14px;font-size:11px;background:#64748b" onclick="abrirModalEntrega('${t.id}')"><i class="fa-solid fa-eye"></i> Ver</button>`;
        } else if (entrega?.estado === 'entregada') {
            estadoBadge = 'Entregada';
            estadoColor = '#3b82f6';
            accionHtml = `<button class="btn-primary" style="padding:6px 14px;font-size:11px;background:#f59e0b" onclick="abrirModalEntrega('${t.id}')"><i class="fa-solid fa-pen"></i> Editar</button>`;
        } else if (estadoTarea === 'caducada') {
            estadoBadge = 'Caducada';
            estadoColor = '#ef4444';
            accionHtml = '';
        } else {
            estadoBadge = `${diasRestantes > 0 ? diasRestantes + 'd' : 'Hoy'}`;
            estadoColor = diasRestantes <= 1 ? '#ef4444' : diasRestantes <= 3 ? '#f59e0b' : '#3b82f6';
            accionHtml = `<button class="btn-primary" style="padding:6px 14px;font-size:11px" onclick="abrirModalEntrega('${t.id}')"><i class="fa-solid fa-upload"></i> Entregar</button>`;
        }

        return `<div class="tarea-card" style="border-left-color:${estadoColor}">
            <div style="flex:1;min-width:200px">
                <div class="tarea-header">
                    <span class="tarea-titulo"><i class="fa-solid fa-tasks"></i> ${PERFILES.escapeHtml(t.titulo)}</span>
                    <span class="badge-nota" style="background:${estadoColor}15;color:${estadoColor};font-size:11px">${estadoBadge}</span>
                </div>
                <div class="tarea-desc">${PERFILES.escapeHtml(t.descripcion)}</div>
                <div class="tarea-footer">
                    <span><i class="fa-regular fa-calendar"></i> Límite: ${PERFILES.formatearFecha(t.fechaLimite)}</span>
                    <span><i class="fa-solid fa-layer-group"></i> ${PERFILES.escapeHtml(t.grupoNombre)}</span>
                    <span><i class="fa-solid fa-file-pen"></i> Valor: ${t.valor}%</span>
                </div>
            </div>
            <div style="display:flex;align-items:center">${accionHtml}</div>
        </div>`;
    }).join('') || '<div class="empty-message"><i class="fa-solid fa-tasks"></i><p>No hay tareas disponibles</p></div>';
}

let tareaEntregaActual = null;

function abrirModalEntrega(tareaId) {
    tareaEntregaActual = tareaId;
    const tareas = TAREAS.getTareas();
    const tarea = tareas.find(t => t.id === tareaId);
    if (!tarea) return;
    const entrega = TAREAS.getEntrega(tareaId, usuarioActual.id);

    document.getElementById('modalEntregarTitulo').innerHTML = `<i class="fa-solid fa-upload"></i> ${PERFILES.escapeHtml(tarea.titulo)}`;
    document.getElementById('entregaContenido').value = entrega?.contenido || '';
    document.getElementById('entregaArchivo').value = entrega?.archivos?.[0]?.nombre || '';

    const historial = TAREAS.getHistorialEntregas(usuarioActual.id).filter(e => e.tareaId === tareaId);
    if (historial.length > 0) {
        document.getElementById('entregaHistorial').innerHTML = `<div style="font-size:12px;color:#64748b;margin-bottom:6px"><i class="fa-regular fa-clock"></i> Historial:</div>
            ${historial.map(e => `<div style="font-size:12px;padding:6px 10px;background:#f1f5f9;border-radius:8px;margin:3px 0;display:flex;justify-content:space-between">
                <span>${e.estado === 'calificada' ? `Calificación: ${e.calificacion}%` : 'Entregado'}</span>
                <span style="color:#94a3b8">${e.fechaEntrega} ${e.horaEntrega || ''}</span>
            </div>`).join('')}`;
    } else {
        document.getElementById('entregaHistorial').innerHTML = '';
    }

    document.getElementById('modalEntregarTarea').style.display = 'flex';
}

function guardarEntrega() {
    if (!tareaEntregaActual) return;
    const contenido = document.getElementById('entregaContenido').value.trim();
    const archivoNombre = document.getElementById('entregaArchivo').value.trim();
    const archivos = archivoNombre ? [{ nombre: archivoNombre, tipo: 'simulado' }] : [];
    const entrega = TAREAS.entregarTarea(usuarioActual, tareaEntregaActual, { contenido, archivos });
    PERFILES.mostrarToast('Tarea entregada exitosamente', 'success');
    document.getElementById('modalEntregarTarea').style.display = 'none';
    renderizarTareas();
}

// ========== INICIAR CHAT ESTUDIANTE (legacy support) ==========

function iniciarChatConEstudiante(docenteId, docenteNombre) {
    chatUI.iniciarChatCon(docenteId, docenteNombre);
    cambiarSeccion('chat');
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', inicializar);
