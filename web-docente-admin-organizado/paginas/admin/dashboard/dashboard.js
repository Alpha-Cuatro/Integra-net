// Panel de control del administrador.
// Lee directamente de las claves edu* que produce datosIniciales.js.
// Antes se leia de claves admin_*, que el propio inicializador borra
// en cada arranque, por lo que el panel siempre mostraba cero datos.

document.addEventListener('DOMContentLoaded', () => {
    cargarPanel();
});

function leerClave(clave, porDefecto = []) {
    try {
        const valor = JSON.parse(localStorage.getItem(clave));
        return valor ?? porDefecto;
    } catch (e) {
        return porDefecto;
    }
}

function escapar(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function formatearFecha(iso) {
    if (!iso) return '—';
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return '—';
    return fecha.toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });
}

function promedio(notas) {
    const validas = notas.filter(n => typeof n.nota === 'number' && !Number.isNaN(n.nota));
    if (validas.length === 0) return null;
    return Math.round(validas.reduce((s, n) => s + n.nota, 0) / validas.length);
}

function cargarPanel() {
    const usuarios = leerClave('eduUsuarios');
    const estudiantes = leerClave('eduEstudiantes');
    const materias = leerClave('eduMaterias');
    const calificaciones = leerClave('eduCalificaciones');
    const evaluaciones = leerClave('eduEvaluaciones');
    const asistencias = leerClave('eduAsistencias');
    const tareas = leerClave('eduTareas');
    const entregas = leerClave('eduEntregas');
    const observaciones = leerClave('eduObservaciones');

    const docentes = usuarios.filter(u => u && u.rol === 'docente');
    const admins = usuarios.filter(u => u && u.rol === 'admin');

    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    const tareasPendientes = tareas.filter(t => {
        if (t.estado === 'Entregada' || t.estado === 'Completada') return false;
        return t.fechaEntrega ? new Date(t.fechaEntrega) <= hoy : true;
    });

    const promGeneral = promedio(calificaciones);
    const asistenciaTotal = asistencias.length;
    const asistenciaAusente = asistencias.filter(a => a.tipo === 'Ausente' || a.tipo === 'Tarde').length;
    const pctAsistencia = asistenciaTotal
        ? Math.round(((asistenciaTotal - asistenciaAusente) / asistenciaTotal) * 100)
        : null;

    // ----- Tarjetas de resumen -----
    document.getElementById('stats-container').innerHTML = `
        <div class="stat-card">
            <i class="fa-solid fa-user-graduate stat-icon"></i>
            <div class="stat-valor">${estudiantes.length}</div>
            <div class="stat-label">Estudiantes</div>
        </div>
        <div class="stat-card">
            <i class="fa-solid fa-chalkboard-user stat-icon"></i>
            <div class="stat-valor">${docentes.length}</div>
            <div class="stat-label">Docentes</div>
        </div>
        <div class="stat-card">
            <i class="fa-solid fa-user-shield stat-icon"></i>
            <div class="stat-valor">${admins.length}</div>
            <div class="stat-label">Administradores</div>
        </div>
        <div class="stat-card">
            <i class="fa-solid fa-book stat-icon"></i>
            <div class="stat-valor">${materias.length}</div>
            <div class="stat-label">Módulos</div>
        </div>
        <div class="stat-card">
            <i class="fa-solid fa-clipboard-check stat-icon"></i>
            <div class="stat-valor">${tareasPendientes.length}</div>
            <div class="stat-label">Tareas pendientes</div>
        </div>
        <div class="stat-card">
            <i class="fa-solid fa-star stat-icon"></i>
            <div class="stat-valor">${promGeneral ?? '—'}</div>
            <div class="stat-label">Promedio general</div>
        </div>
        <div class="stat-card">
            <i class="fa-solid fa-user-check stat-icon"></i>
            <div class="stat-valor">${pctAsistencia !== null ? pctAsistencia + '%' : '—'}</div>
            <div class="stat-label">Asistencia global</div>
        </div>
        <div class="stat-card">
            <i class="fa-solid fa-file-lines stat-icon"></i>
            <div class="stat-valor">${observaciones.length}</div>
            <div class="stat-label">Observaciones</div>
        </div>
    `;

    // ----- Próximas tareas -----
    const contenedorTareas = document.getElementById('next-tasks');
    if (tareasPendientes.length === 0) {
        contenedorTareas.innerHTML = '<p class="vacio">No hay tareas pendientes registradas.</p>';
    } else {
        contenedorTareas.innerHTML = `<ul class="lista-panel">` +
            tareasPendientes
                .slice()
                .sort((a, b) => new Date(a.fechaEntrega || 0) - new Date(b.fechaEntrega || 0))
                .slice(0, 6)
                .map(t => `
                    <li>
                        <span class="lista-titulo">${escapar(t.titulo)}</span>
                        <span class="lista-meta">${escapar(t.materia || 'Sin materia')} · entrega ${formatearFecha(t.fechaEntrega)}</span>
                    </li>
                `)
                .join('') +
            '</ul>';
    }

    // ----- Actividades (= evaluaciones registradas) -----
    const contenedorActividades = document.getElementById('recent-activities');
    if (evaluaciones.length === 0) {
        contenedorActividades.innerHTML = '<p class="vacio">No hay evaluaciones registradas.</p>';
    } else {
        const porMateria = new Map();
        evaluaciones.forEach(ev => {
            const clave = ev.materiaNombre || 'Sin materia';
            porMateria.set(clave, (porMateria.get(clave) || 0) + 1);
        });
        contenedorActividades.innerHTML = `<ul class="lista-panel">` +
            [...porMateria.entries()]
                .map(([materia, total]) => `
                    <li>
                        <span class="lista-titulo">${escapar(materia)}</span>
                        <span class="lista-meta">${total} ${total === 1 ? 'evaluación' : 'evaluaciones'} · ${calificaciones.filter(c => c.materiaNombre === materia).length} notas registradas</span>
                    </li>
                `)
                .join('') +
            '</ul>';
    }

    // ----- Docentes registrados -----
    const contenedorDocentes = document.getElementById('docentes-list');
    if (docentes.length === 0) {
        contenedorDocentes.innerHTML = '<p class="vacio">No hay docentes registrados.</p>';
    } else {
        contenedorDocentes.innerHTML = `<ul class="lista-panel">` +
            docentes.map(d => `
                <li>
                    <span class="lista-titulo">${escapar(d.nombre)}</span>
                    <span class="lista-meta">${escapar(d.correo)} · ${escapar(d.especialidad || d.materiaAsignada || 'sin especialidad')}</span>
                </li>
            `).join('') +
            '</ul>';
    }

    // ----- Entregas registradas -----
    const contenedorEntregas = document.getElementById('entregas-resumen');
    if (entregas.length === 0) {
        contenedorEntregas.innerHTML = '<p class="vacio">Aún no se han registrado entregas.</p>';
    } else {
        contenedorEntregas.innerHTML = `<p class="entregas-total"><strong>${entregas.length}</strong> entregas registradas en el sistema.</p>`;
    }

    // Navegación del panel
    document.querySelectorAll('[data-admin-nav]').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = btn.dataset.adminNav;
        });
    });

    // Gráfico de cobertura de asistencia por módulo
    const canvas = document.getElementById('chartAsistenciaAdmin');
    if (canvas && typeof Chart !== 'undefined') {
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: materias.map(m => m.nombre),
                datasets: [{
                    label: 'Asistencia (%)',
                    data: materias.map(m => {
                        const notas = asistencias.filter(a => a.materiaId === m.id);
                        if (notas.length === 0) return 0;
                        const ausentes = notas.filter(a => a.tipo === 'Ausente' || a.tipo === 'Tarde').length;
                        return Math.round(((notas.length - ausentes) / notas.length) * 100);
                    }),
                    backgroundColor: 'rgba(86, 5, 145, 0.65)',
                    borderColor: '#560591',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } },
                    x: { ticks: { maxRotation: 45, minRotation: 30 } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
}
