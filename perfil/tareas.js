
const TAREAS = {
    TAREAS_KEY: 'eduTareas',
    ENTREGAS_KEY: 'eduEntregas',

    getTareas() {
        return JSON.parse(localStorage.getItem(this.TAREAS_KEY)) || [];
    },

    guardarTareas(d) {
        localStorage.setItem(this.TAREAS_KEY, JSON.stringify(d));
    },

    getEntregas() {
        return JSON.parse(localStorage.getItem(this.ENTREGAS_KEY)) || [];
    },

    guardarEntregas(d) {
        localStorage.setItem(this.ENTREGAS_KEY, JSON.stringify(d));
    },

    crearTarea(docente, datos) {
        const tareas = this.getTareas();
        const fechaActual = new Date().toISOString().split('T')[0];
        const tarea = {
            id: PERFILES.generarId(),
            docenteId: docente.id,
            docenteNombre: docente.nombre,
            materiaId: datos.materiaId || '',
            materiaNombre: datos.materiaNombre || '',
            grupoCodigo: datos.grupoCodigo || '',
            grupoNombre: datos.grupoNombre || '',
            grado: datos.grado || '',
            seccion: datos.seccion || '',
            titulo: datos.titulo,
            descripcion: datos.descripcion || '',
            fechaCreacion: fechaActual,
            fechaLimite: datos.fechaLimite,
            valor: Math.min(100, Math.max(0, Number(datos.valor) || 0)),
            archivos: datos.archivos || [],
            estado: 'pendiente',
            activa: true
        };
        tareas.push(tarea);
        this.guardarTareas(tareas);
        NOTIFICACIONES.agregar('nueva_tarea', `Nueva tarea: "${tarea.titulo}" - Límite: ${PERFILES.formatearFecha(tarea.fechaLimite)}`, {
            tareaId: tarea.id,
            grupoCodigo: datos.grupoCodigo,
            grado: datos.grado,
            seccion: datos.seccion
        });
        return tarea;
    },

    editarTarea(tareaId, cambios) {
        const tareas = this.getTareas();
        const idx = tareas.findIndex(t => t.id === tareaId);
        if (idx < 0) return null;
        Object.assign(tareas[idx], cambios);
        this.guardarTareas(tareas);
        return tareas[idx];
    },

    eliminarTarea(tareaId) {
        let tareas = this.getTareas();
        tareas = tareas.filter(t => t.id !== tareaId);
        this.guardarTareas(tareas);
        let entregas = this.getEntregas();
        entregas = entregas.filter(e => e.tareaId !== tareaId);
        this.guardarEntregas(entregas);
    },

    getTareasPorGrupo(codigoGrupo) {
        return this.getTareas().filter(t => t.grupoCodigo === codigoGrupo && t.activa);
    },

    getTareasDocente(docenteId) {
        return this.getTareas().filter(t => t.docenteId === docenteId).sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    },

    getTareasEstudiante(estudiante) {
        const grupos = GRUPOS.getGruposEstudiante(estudiante.id);
        const codigos = grupos.map(g => g.codigo);
        return this.getTareas().filter(t => codigos.includes(t.grupoCodigo) && t.activa).sort((a, b) => new Date(a.fechaLimite) - new Date(b.fechaLimite));
    },

    getEstadoTarea(tarea) {
        const ahora = new Date();
        const limite = new Date(tarea.fechaLimite);
        if (!tarea.activa) return 'inactiva';
        if (limite < ahora) return 'caducada';
        return 'pendiente';
    },

    entregarTarea(estudiante, tareaId, datos) {
        const entregas = this.getEntregas();
        const existente = entregas.find(e => e.tareaId === tareaId && e.estudianteId === estudiante.id);
        const ahora = new Date();
        const ahoraStr = ahora.toISOString();
        const entrega = {
            id: existente ? existente.id : PERFILES.generarId(),
            tareaId,
            estudianteId: estudiante.id,
            estudianteNombre: estudiante.nombre,
            contenido: datos.contenido || '',
            archivos: datos.archivos || [],
            comentarios: datos.comentarios || '',
            fechaEntrega: ahoraStr.split('T')[0],
            horaEntrega: ahora.toTimeString().split(' ')[0].slice(0, 5),
            timestamp: ahora.getTime(),
            estado: 'entregada',
            calificacion: null,
            retroalimentacion: '',
            fechaCalificacion: null
        };
        if (existente) {
            Object.assign(existente, entrega);
        } else {
            entregas.push(entrega);
        }
        this.guardarEntregas(entregas);
        NOTIFICACIONES.agregar('nueva_entrega', `${estudiante.nombre} entregó: "${(this.getTareas().find(t => t.id === tareaId) || {}).titulo}"`, {
            tareaId,
            estudianteId: estudiante.id
        });
        return entrega;
    },

    getEntrega(tareaId, estudianteId) {
        return this.getEntregas().find(e => e.tareaId === tareaId && e.estudianteId === estudianteId) || null;
    },

    getEntregasTarea(tareaId) {
        return this.getEntregas().filter(e => e.tareaId === tareaId);
    },

    getHistorialEntregas(estudianteId) {
        return this.getEntregas().filter(e => e.estudianteId === estudianteId).sort((a, b) => b.timestamp - a.timestamp);
    },

    calificarEntrega(entregaId, nota, retro = '') {
        const entregas = this.getEntregas();
        const entrega = entregas.find(e => e.id === entregaId);
        if (!entrega) return null;
        const tareas = this.getTareas();
        const tarea = tareas.find(t => t.id === entrega.tareaId);
        if (!tarea) return null;

        entrega.estado = 'calificada';
        entrega.calificacion = Math.min(100, Math.max(0, Number(nota)));
        entrega.retroalimentacion = retro;
        entrega.fechaCalificacion = new Date().toISOString().split('T')[0];
        this.guardarEntregas(entregas);

        const estudiantes = JSON.parse(localStorage.getItem('eduEstudiantes')) || [];
        const est = estudiantes.find(e => e.id === entrega.estudianteId);
        if (est) {
            if (!est.estadisticasTareas) est.estadisticasTareas = { total: 0, entregadas: 0, calificadas: 0, promedio: 0 };
            est.estadisticasTareas.total = (est.estadisticasTareas.total || 0) + 1;
            est.estadisticasTareas.calificadas = (est.estadisticasTareas.calificadas || 0) + 1;
            const cals = entregas.filter(e => e.estudianteId === entrega.estudianteId && e.calificacion != null).map(e => e.calificacion);
            est.estadisticasTareas.promedio = cals.length > 0 ? Math.round(cals.reduce((s, c) => s + c, 0) / cals.length) : 0;

            if (est.estadisticasTareas.promedio >= 90) {
                if (!est.competenciasGlobales) est.competenciasGlobales = [];
                if (!est.competenciasGlobales.some(c => c.nombre === 'Responsabilidad')) {
                    est.competenciasGlobales.push({ nombre: 'Responsabilidad', nivel: Math.min(100, (est.estadisticasTareas.promedio || 0)), tendencia: 'mejorando' });
                } else {
                    const c = est.competenciasGlobales.find(c => c.nombre === 'Responsabilidad');
                    if (c) c.nivel = Math.min(100, (c.nivel + 5));
                }
            }
            localStorage.setItem('eduEstudiantes', JSON.stringify(estudiantes));
        }

        const tareaNom = tarea.titulo || 'Tarea';
        NOTIFICACIONES.agregar('entrega_calificada', `Tu tarea "${tareaNom}" fue calificada: ${entrega.calificacion}%`, {
            tareaId: entrega.tareaId,
            estudianteId: entrega.estudianteId
        });
        return entrega;
    },

    getEstadisticasTarea(tareaId) {
        const entregas = this.getEntregasTarea(tareaId);
        const total = entregas.length;
        const calificadas = entregas.filter(e => e.calificacion != null);
        const promedio = calificadas.length > 0 ? Math.round(calificadas.reduce((s, c) => s + c.calificacion, 0) / calificadas.length) : 0;
        return { total, entregadas: total, calificadas: calificadas.length, promedio };
    }
};
