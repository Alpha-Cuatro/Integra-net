
const PERFIL_ALUMNO = {
    ESTUDIANTES_KEY: 'eduEstudiantes',
    EVALUACIONES_KEY: 'eduEvaluaciones',
    CALIFICACIONES_KEY: 'eduCalificaciones',
    ASISTENCIAS_KEY: 'eduAsistencias',
    OBSERVACIONES_KEY: 'eduObservaciones',
    MATERIAS_KEY: 'eduMaterias',
    GRADOS_KEY: 'eduGradosSecciones',

    getEstudiantes() {
        return JSON.parse(localStorage.getItem(this.ESTUDIANTES_KEY)) || [];
    },

    getMaterias() {
        return JSON.parse(localStorage.getItem(this.MATERIAS_KEY)) || [];
    },

    getGradosSecciones() {
        return JSON.parse(localStorage.getItem(this.GRADOS_KEY)) || {};
    },

    getEstudiante(id) {
        return this.getEstudiantes().find(e => e.id === id) || null;
    },

    getMateriasEstudiante(id) {
        const est = this.getEstudiante(id);
        return est ? (est.materias || []) : [];
    },

    getPromedioGeneral(id) {
        const est = this.getEstudiante(id);
        return est ? (est.promedioGeneral || 0) : 0;
    },

    getAsistencias(id) {
        const est = this.getEstudiante(id);
        return est ? (est.asistencias || []) : [];
    },

    getAsistenciaPorcentaje(id) {
        const asistencias = this.getAsistencias(id);
        if (asistencias.length === 0) return 0;
        const presentes = asistencias.filter(a => a.tipo === 'Presente').length;
        return Math.round((presentes / asistencias.length) * 100);
    },

    getObservaciones(id) {
        const est = this.getEstudiante(id);
        return est ? (est.observaciones || []) : [];
    },

    getCompetencias(id) {
        const est = this.getEstudiante(id);
        return est ? (est.competenciasGlobales || []) : [];
    },

    getFortalezas(id) {
        const est = this.getEstudiante(id);
        return est ? (est.fortalezas || []) : [];
    },

    getDebilidades(id) {
        const est = this.getEstudiante(id);
        return est ? (est.debilidades || []) : [];
    },

    recomendarCarrera(id) {
        const competencias = this.getCompetencias(id);
        const fortalezas = this.getFortalezas(id);
        const materias = this.getMateriasEstudiante(id);

        const carreraMap = [
            { nombre: 'Vocero/a de Derechos Humanos', competencias: ['Conciencia de derechos', 'Comunicación', 'Pensamiento crítico'], materias: ['Derechos de la Mujer: Fundamentos', 'Ciudadanía, Participación y Liderazgo'], peso: 0 },
            { nombre: 'Mediador/a Escolar', competencias: ['Comunicación asertiva', 'Escucha activa', 'Manejo de conflictos'], materias: ['Comunicación Asertiva y Resolución de Conflictos'], peso: 0 },
            { nombre: 'Promotor/a de Equidad de Género', competencias: ['Análisis crítico de estereotipos', 'Conciencia social', 'Investigación'], materias: ['Equidad de Género', 'Corresponsabilidad y Roles de Género'], peso: 0 },
            { nombre: 'Consejero/a de Bienestar', competencias: ['Autoestima', 'Autocuidado', 'Bienestar emocional'], materias: ['Autoestima y Empoderamiento', 'Salud y Bienestar Integral'], peso: 0 },
            { nombre: 'Defensor/a de la No Violencia', competencias: ['Detección de señales de riesgo', 'Empatía', 'Autoprotección'], materias: ['Prevención de la Violencia de Género'], peso: 0 },
            { nombre: 'Líder Comunitario/a', competencias: ['Liderazgo', 'Trabajo en equipo', 'Participación ciudadana'], materias: ['Ciudadanía, Participación y Liderazgo'], peso: 0 },
            { nombre: 'Facilitador/a de Talleres', competencias: ['Comunicación', 'Liderazgo', 'Empatía'], materias: ['Comunicación Asertiva y Resolución de Conflictos', 'Autoestima y Empoderamiento'], peso: 0 },
            { nombre: 'Investigador/a Social', competencias: ['Investigación', 'Pensamiento crítico', 'Análisis de casos'], materias: ['Derechos de la Mujer: Fundamentos', 'Equidad de Género'], peso: 0 }
        ];

        const compNiveles = {};
        competencias.forEach(c => { compNiveles[c.nombre] = c.nivel || 50; });

        const promediosMaterias = {};
        materias.forEach(m => { promediosMaterias[m.materiaNombre] = m.promedio || 0; });

        carreraMap.forEach(carrera => {
            let puntaje = 0;
            let maxPuntaje = 0;

            carrera.competencias.forEach(comp => {
                maxPuntaje += 100;
                puntaje += compNiveles[comp] || 50;
            });

            carrera.materias.forEach(mat => {
                maxPuntaje += 100;
                puntaje += promediosMaterias[mat] || 50;
            });

            carrera.peso = maxPuntaje > 0 ? Math.round((puntaje / maxPuntaje) * 100) : 0;
        });

        carreraMap.sort((a, b) => b.peso - a.peso);

        const principal = carreraMap[0];
        const segundaOpcion = carreraMap[1] || null;

        let nivelConfianza = 'Bajo';
        if (principal.peso >= 80) nivelConfianza = 'Muy Alto';
        else if (principal.peso >= 65) nivelConfianza = 'Alto';
        else if (principal.peso >= 45) nivelConfianza = 'Moderado';

        return {
            carreraRecomendada: principal.nombre,
            confianza: nivelConfianza,
            puntaje: principal.peso,
            justificacion: `Basado en tus competencias (${compNiveles[principal.competencias[0]] || 'desarrolladas'}% en ${principal.competencias[0]}) y rendimiento académico, tienes un perfil adecuado para ${principal.nombre}.`,
            competenciasRelacionadas: principal.competencias,
            fortalezas: fortalezas,
            areasMejorar: this.getDebilidades(id),
            masGustaria: segundaOpcion ? {
                nombre: segundaOpcion.nombre,
                puntaje: segundaOpcion.peso,
                competencias: segundaOpcion.competencias
            } : null,
            mayorExito: carreraMap.slice(0, 3).map(c => ({
                nombre: c.nombre,
                puntaje: c.peso
            }))
        };
    },

    getRankingEstudiantes(id, materiaId) {
        const estudiantes = this.getEstudiantes();
        const rankings = estudiantes.map(e => {
            const m = e.materias.find(mt => mt.materiaId === materiaId);
            return { id: e.id, nombre: e.nombre, promedio: m ? m.promedio : 0 };
        }).filter(r => r.promedio > 0);
        rankings.sort((a, b) => b.promedio - a.promedio);
        const posicion = rankings.findIndex(r => r.id === id) + 1;
        return { rankings, posicion, total: rankings.length };
    },

    getEstadisticasEstudiante(id) {
        const materias = this.getMateriasEstudiante(id);
        const promedios = materias.map(m => m.promedio).filter(p => p > 0);
        return {
            promedioGeneral: this.getPromedioGeneral(id),
            materiasCursando: materias.length,
            materiasAprobadas: promedios.filter(p => p >= 60).length,
            materiasReprobadas: promedios.filter(p => p < 60).length,
            asistenciaPorcentaje: this.getAsistenciaPorcentaje(id),
            mejorMateria: promedios.length > 0 ? Math.max(...promedios) : 0,
            peorMateria: promedios.length > 0 ? Math.min(...promedios) : 0,
            rendimiento: promedios.length > 0
                ? Math.round((promedios.filter(p => p >= 60).length / promedios.length) * 100)
                : 0
        };
    }
};
