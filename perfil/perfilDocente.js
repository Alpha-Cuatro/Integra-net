
const PERFIL_DOCENTE = {
    DOCENTE_KEY: 'eduDocente',
    MATERIA_KEY: 'eduDocenteMateria',
    ESTUDIANTES_KEY: 'eduEstudiantes',
    EVALUACIONES_KEY: 'eduEvaluaciones',
    CALIFICACIONES_KEY: 'eduCalificaciones',
    ASISTENCIAS_KEY: 'eduAsistencias',
    OBSERVACIONES_KEY: 'eduObservaciones',
    GRADOS_KEY: 'eduGradosSecciones',

    getDocente() {
        return JSON.parse(localStorage.getItem(this.DOCENTE_KEY)) || null;
    },

    getMateriaAsignada() {
        return JSON.parse(localStorage.getItem(this.MATERIA_KEY)) || null;
    },

    getEstudiantes() {
        return JSON.parse(localStorage.getItem(this.ESTUDIANTES_KEY)) || [];
    },

    getEvaluaciones() {
        return JSON.parse(localStorage.getItem(this.EVALUACIONES_KEY)) || [];
    },

    getCalificaciones() {
        return JSON.parse(localStorage.getItem(this.CALIFICACIONES_KEY)) || [];
    },

    getAsistencias() {
        return JSON.parse(localStorage.getItem(this.ASISTENCIAS_KEY)) || [];
    },

    getObservaciones() {
        return JSON.parse(localStorage.getItem(this.OBSERVACIONES_KEY)) || [];
    },

    getGradosSecciones() {
        return JSON.parse(localStorage.getItem(this.GRADOS_KEY)) || {};
    },

    guardarEstudiantes(data) {
        localStorage.setItem(this.ESTUDIANTES_KEY, JSON.stringify(data));
    },

    guardarEvaluaciones(data) {
        localStorage.setItem(this.EVALUACIONES_KEY, JSON.stringify(data));
    },

    guardarCalificaciones(data) {
        localStorage.setItem(this.CALIFICACIONES_KEY, JSON.stringify(data));
    },

    guardarAsistencias(data) {
        localStorage.setItem(this.ASISTENCIAS_KEY, JSON.stringify(data));
    },

    guardarObservaciones(data) {
        localStorage.setItem(this.OBSERVACIONES_KEY, JSON.stringify(data));
    },

    getEstudiantesPorGradoSeccion(grado, seccion) {
        return this.getEstudiantes().filter(e => e.grado === grado && e.seccion === seccion);
    },

    getEstudiantesAgrupados() {
        const materia = this.getMateriaAsignada();
        if (!materia) return {};
        const grupos = {};
        Object.entries(materia.gradosSecciones).forEach(([grado, secciones]) => {
            secciones.forEach(seccion => {
                const key = `${grado}_${seccion}`;
                grupos[key] = {
                    grado,
                    seccion,
                    estudiantes: this.getEstudiantesPorGradoSeccion(grado, seccion)
                };
            });
        });
        return grupos;
    },

    getEvaluacionesPorGrupo(grado, seccion) {
        const materia = this.getMateriaAsignada();
        if (!materia) return [];
        return this.getEvaluaciones().filter(ev =>
            ev.materiaId === materia.materiaId &&
            ev.grado === grado &&
            ev.seccion === seccion
        );
    },

    getCalificacionesPorEstudiante(estudianteId) {
        return this.getCalificaciones().filter(c => c.estudianteId === estudianteId);
    },

    crearEvaluacion(datos) {
        const evaluaciones = this.getEvaluaciones();
        const materia = this.getMateriaAsignada();
        const ev = {
            id: PERFILES.generarId(),
            materiaId: materia.materiaId,
            materiaNombre: materia.materiaNombre,
            docenteId: materia.docenteId,
            ...datos
        };
        evaluaciones.push(ev);
        this.guardarEvaluaciones(evaluaciones);

        const estudiantes = this.getEstudiantes();
        const afectados = estudiantes.filter(e => e.grado === datos.grado && e.seccion === datos.seccion);
        afectados.forEach(est => {
            const materiaEst = est.materias.find(m => m.materiaId === materia.materiaId);
            if (materiaEst) {
                materiaEst.evaluaciones.push(ev);
            }
        });
        this.guardarEstudiantes(estudiantes);
        return ev;
    },

    calificarEstudiante(evaluacionId, estudianteId, nota, retro = '') {
        const calificaciones = this.getCalificaciones();
        const materia = this.getMateriaAsignada();
        const ev = this.getEvaluaciones().find(e => e.id === evaluacionId);
        if (!ev) return null;
        const existente = calificaciones.findIndex(c =>
            c.evaluacionId === evaluacionId && c.estudianteId === estudianteId
        );
        const cal = {
            id: existente >= 0 ? calificaciones[existente].id : PERFILES.generarId(),
            estudianteId,
            materiaId: materia.materiaId,
            evaluacionId,
            docenteId: materia.docenteId,
            grado: ev.grado,
            seccion: ev.seccion,
            nota: Math.min(100, Math.max(0, Number(nota))),
            puntajeMaximo: ev.puntajeMaximo || 100,
            fecha: new Date().toISOString().split('T')[0],
            retroalimentacion: retro
        };
        if (existente >= 0) {
            calificaciones[existente] = cal;
        } else {
            calificaciones.push(cal);
        }
        this.guardarCalificaciones(calificaciones);

        const estudiantes = this.getEstudiantes();
        const est = estudiantes.find(e => e.id === estudianteId);
        if (est) {
            const materiaEst = est.materias.find(m => m.materiaId === materia.materiaId);
            if (materiaEst) {
                const idx = materiaEst.calificaciones.findIndex(c =>
                    c.evaluacionId === evaluacionId && c.estudianteId === estudianteId
                );
                if (idx >= 0) {
                    materiaEst.calificaciones[idx] = cal;
                } else {
                    materiaEst.calificaciones.push(cal);
                }
                materiaEst.promedio = PERFILES.calcularPromedio(materiaEst.calificaciones);
            }
            const promedios = est.materias.map(m => m.promedio).filter(p => p > 0);
            est.promedioGeneral = promedios.length > 0
                ? Math.round(promedios.reduce((s, p) => s + p, 0) / promedios.length)
                : 0;
        }
        this.guardarEstudiantes(estudiantes);
        return cal;
    },

    registrarAsistencia(estudianteId, fecha, tipo) {
        const asistencias = this.getAsistencias();
        const existente = asistencias.findIndex(a =>
            a.estudianteId === estudianteId && a.fecha === fecha
        );
        const registro = {
            id: existente >= 0 ? asistencias[existente].id : PERFILES.generarId(),
            estudianteId,
            fecha,
            tipo,
            materia: 'Derechos de la Mujer'
        };
        if (existente >= 0) {
            asistencias[existente] = registro;
        } else {
            asistencias.push(registro);
        }
        this.guardarAsistencias(asistencias);

        const estudiantes = this.getEstudiantes();
        const est = estudiantes.find(e => e.id === estudianteId);
        if (est) {
            const idx = est.asistencias.findIndex(a => a.fecha === fecha);
            if (idx >= 0) {
                est.asistencias[idx] = registro;
            } else {
                est.asistencias.push(registro);
            }
        }
        this.guardarEstudiantes(estudiantes);
        return registro;
    },

    crearObservacion(estudianteId, tipo, descripcion) {
        const observaciones = this.getObservaciones();
        const obs = {
            id: PERFILES.generarId(),
            estudianteId,
            fecha: new Date().toISOString().split('T')[0],
            tipo,
            descripcion,
            docenteNombre: 'Manuel Antonio'
        };
        observaciones.push(obs);
        this.guardarObservaciones(observaciones);

        const estudiantes = this.getEstudiantes();
        const est = estudiantes.find(e => e.id === estudianteId);
        if (est) {
            est.observaciones.push(obs);
        }
        this.guardarEstudiantes(estudiantes);
        return obs;
    },

    getEstadisticasDocente() {
        const materia = this.getMateriaAsignada();
        if (!materia) return {};
        const estudiantes = this.getEstudiantes();
        const evaluaciones = this.getEvaluaciones().filter(ev => ev.materiaId === materia.materiaId);
        const calificaciones = this.getCalificaciones().filter(c => c.materiaId === materia.materiaId);
        const misEstudiantes = estudiantes.filter(e =>
            e.materias && e.materias.some(m => m.materiaId === materia.materiaId)
        );

        const promedios = misEstudiantes.map(e => {
            const m = e.materias.find(mt => mt.materiaId === materia.materiaId);
            return m ? m.promedio : 0;
        }).filter(p => p > 0);

        return {
            totalEstudiantes: misEstudiantes.length,
            totalEvaluaciones: evaluaciones.length,
            totalCalificaciones: calificaciones.length,
            promedioGeneral: promedios.length > 0 ? Math.round(promedios.reduce((s, p) => s + p, 0) / promedios.length) : 0,
            aprobados: promedios.filter(p => p >= 60).length,
            reprobados: promedios.filter(p => p < 60).length,
            rendimiento: promedios.length > 0 ? Math.round((promedios.filter(p => p >= 60).length / promedios.length) * 100) : 0
        };
    }
};
