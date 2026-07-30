
const SISTEMA_CONFIG = {
    claveUnica: 'eduSistema',
    version: '2.0.0',
    initialized: false
};

const INSTITUTOS_PREDETERMINADOS = [
    { id: 'inst001', nombre: 'Colegio San José' },
    { id: 'inst002', nombre: 'Instituto Nacional Manuel Hernández Martínez' },
    { id: 'inst003', nombre: 'Centro Escolar José Martí' },
    { id: 'inst004', nombre: 'Colegio Santa Rosa de Lima' },
    { id: 'inst005', nombre: 'Colegio Génesis' },
    { id: 'inst006', nombre: 'Instituto Nac. Ramón Matus Acevedo' },
    { id: 'inst007', nombre: 'Instituto Nacional Juan José Rodríguez' },
    { id: 'inst008', nombre: 'Academia de Santa María' },
    { id: 'inst009', nombre: 'Centro Escolar Pedro Joaquín Chamorro' },
    { id: 'inst010', nombre: 'Colegio Corazón de María' }
];

const GRADOS_SECCIONES = {
    '7mo': ['A', 'B', 'C'],
    '8vo': ['A', 'B', 'C'],
    '9no': ['A', 'B', 'C'],
    '10mo': ['A', 'B', 'C'],
    '11vo': ['A', 'B', 'C', 'D']
};

const MATERIAS_SECUNDARIA = [
    { id: 'mat01', nombre: 'Derechos de la Mujer: Fundamentos' },
    { id: 'mat02', nombre: 'Prevención de la Violencia de Género' },
    { id: 'mat03', nombre: 'Equidad de Género' },
    { id: 'mat04', nombre: 'Autoestima y Empoderamiento' },
    { id: 'mat05', nombre: 'Comunicación Asertiva y Resolución de Conflictos' },
    { id: 'mat06', nombre: 'Corresponsabilidad y Roles de Género' },
    { id: 'mat07', nombre: 'Salud y Bienestar Integral' },
    { id: 'mat08', nombre: 'Ciudadanía, Participación y Liderazgo' }
];

function getCompromisosByMateria(materiaId) {
    const mapa = {
        mat01: { competencias: ['Pensamiento crítico', 'Conciencia de derechos', 'Análisis de casos', 'Memoria histórica'], fortaleza: 'Comprensión de los derechos fundamentales', debilidad: 'Aplicación de los derechos a casos cotidianos' },
        mat02: { competencias: ['Detección de señales de riesgo', 'Empatía', 'Búsqueda de ayuda', 'Autoprotección'], fortaleza: 'Reconocimiento de situaciones de violencia', debilidad: 'Rutas de denuncia y acompañamiento' },
        mat03: { competencias: ['Análisis crítico de estereotipos', 'Pensamiento crítico', 'Conciencia social', 'Igualdad de oportunidades'], fortaleza: 'Identificación de estereotipos de género', debilidad: 'Propuestas de cambio en el entorno cercano' },
        mat04: { competencias: ['Autoconocimiento', 'Autoestima', 'Toma de decisiones', 'Expresión personal'], fortaleza: 'Reconocimiento del propio valor', debilidad: 'Manejo de la presión social' },
        mat05: { competencias: ['Comunicación asertiva', 'Escucha activa', 'Negociación', 'Manejo de conflictos'], fortaleza: 'Expresión clara de necesidades y límites', debilidad: 'Manejo de conflictos bajo presión' },
        mat06: { competencias: ['Corresponsabilidad', 'Análisis de roles', 'Pensamiento crítico', 'Vida en comunidad'], fortaleza: 'Identificación de roles de género en el hogar', debilidad: 'Propuesta de acuerdos equitativos' },
        mat07: { competencias: ['Autocuidado', 'Bienestar emocional', 'Hábitos saludables', 'Prevención'], fortaleza: 'Reconocimiento de hábitos saludables', debilidad: 'Manejo del estrés y las emociones' },
        mat08: { competencias: ['Liderazgo', 'Participación ciudadana', 'Trabajo en equipo', 'Incidencia social'], fortaleza: 'Iniciativa para proponer cambios', debilidad: 'Organización de acciones colectivas' }
    };
    return mapa[materiaId] || { competencias: ['Pensamiento crítico', 'Investigación'], fortaleza: 'Dedicación', debilidad: 'Gestión del tiempo' };
}

function getEvaluacionesPredeterminadas(materiaId, materiaNombre, docenteId, grado, seccion) {
    const base = [
        { nombre: 'Evaluación Diagnóstica', descripcion: 'Evaluación inicial de conocimientos previos', valor: 15, puntajeMaximo: 100 },
        { nombre: 'Examen Parcial I', descripcion: 'Primer examen parcial del período', valor: 25, puntajeMaximo: 100 },
        { nombre: 'Examen Parcial II', descripcion: 'Segundo examen parcial del período', valor: 25, puntajeMaximo: 100 },
        { nombre: 'Proyecto Final', descripcion: 'Proyecto integrador del período', valor: 20, puntajeMaximo: 100 },
        { nombre: 'Tareas y Actividades', descripcion: 'Acumulado de tareas y actividades en clase', valor: 15, puntajeMaximo: 100 }
    ];
    return base.map((ev, i) => ({
        id: `${materiaId}_${grado}_${seccion}_${i}_${Date.now()}`,
        materiaId,
        materiaNombre,
        docenteId,
        grado,
        seccion,
        fecha: new Date(2026, 5 + i, 10 + i * 15).toISOString().split('T')[0],
        ...ev
    }));
}

function generarNotasAleatorias(estudianteId, materiaId, evaluaciones) {
    return evaluaciones.map(ev => ({
        id: `cal_${estudianteId}_${ev.id}_${Date.now()}`,
        estudianteId,
        materiaId,
        evaluacionId: ev.id,
        docenteId: ev.docenteId,
        grado: ev.grado,
        seccion: ev.seccion,
        nota: Math.max(40, Math.min(100, Math.round(60 + Math.random() * 35 + (Math.random() > 0.7 ? -20 : 0)))),
        puntajeMaximo: ev.puntajeMaximo,
        fecha: ev.fecha,
        retroalimentacion: ''
    }));
}

function inicializarDatosSiEsNecesario() {
    if (localStorage.getItem(SISTEMA_CONFIG.claveUnica)) {
        console.log('[Integra-net] Sistema ya inicializado, cargando datos existentes.');
        SISTEMA_CONFIG.initialized = true;
        return false;
    }

    console.log('[Integra-net] Primera inicialización del sistema. Creando datos predeterminados...');

    const docenteId = 1001;
    const estudianteId = 2001;
    const ahora = new Date().toISOString();

    const docente = {
        id: docenteId,
        nombre: 'Manuel Antonio',
        correo: 'manuel.antonio@colegio.edu',
        password: 'Manuel@2026',
        rol: 'docente',
        fotografia: '',
        codigoDocente: 'DOC-2026-001',
        especialidad: 'Matemáticas',
        direccion: 'Colonia San Miguel, Calle Principal #123',
        telefono: '+505 8888-7777',
        estado: 'Activo',
        fechaIngreso: '2020-01-15',
        instituto: 'Colegio San José',
        fechaRegistro: '2024-01-01'
    };

    const docenteMateria = {
        docenteId: docenteId,
        materiaId: 'mat01',
        materiaNombre: 'Matemáticas',
        gradosSecciones: {}
    };

    Object.keys(GRADOS_SECCIONES).forEach(grado => {
        docenteMateria.gradosSecciones[grado] = GRADOS_SECCIONES[grado];
    });

    const estudiante = {
        id: estudianteId,
        nombre: 'Juan Carlos',
        correo: 'juan.carlos@colegio.edu',
        password: 'JuanCarlos@2026',
        rol: 'estudiante',
        fotografia: '',
        codigo: 'EST-2026-001',
        identificacion: '001-260105-1001K',
        fechaNacimiento: '2005-01-26',
        edad: 21,
        direccion: 'Residencial Los Robles, Casa #45',
        telefono: '+505 8888-9999',
        tutor: 'María López',
        padre: 'Carlos Pérez',
        madre: 'María López',
        emergencia: '+505 7777-8888',
        grado: '11vo',
        seccion: 'A',
        estadoAcademico: 'Activo',
        instituto: 'Colegio San José',
        fechaRegistro: '2024-01-01',
        promedioGeneral: 0,
        materias: [],
        asistencias: [],
        observaciones: [],
        competenciasGlobales: [],
        fortalezas: [],
        debilidades: [],
        historial: [],
        reportes: [],
        estadisticas: {}
    };

    const estudiantesPorGrupo = [];
    const nombresEstudiantes = [
        'María González', 'Carlos López', 'Ana Martínez', 'Pedro Ramírez', 'Lucía Fernández',
        'Diego Torres', 'Valentina Ruiz', 'Andrés Herrera', 'Camila Vargas', 'Santiago Mendoza',
        'Gabriela Castillo', 'Mateo Romero', 'Isabella Álvarez', 'Sebastián Delgado', 'Sofía Peña',
        'Emilio Guerrero', 'Ximena Rivas', 'Joaquín Soto', 'Regina Flores', 'Mateo Acosta'
    ];

    let estIdCounter = 2002;
    nombresEstudiantes.forEach((nombre, idx) => {
        const grado = Object.keys(GRADOS_SECCIONES)[idx % 5];
        const secciones = GRADOS_SECCIONES[grado];
        const seccion = secciones[idx % secciones.length];
        estudiantesPorGrupo.push({
            id: estIdCounter + idx,
            nombre,
            correo: `${nombre.toLowerCase().replace(/\s+/g, '.')}@colegio.edu`,
            password: 'Estudiante@2026',
            rol: 'estudiante',
            fotografia: '',
            codigo: `EST-2026-${String(estIdCounter + idx).slice(-3)}`,
            identificacion: `001-${String(2005 + (idx % 3))}0${String(15 + idx).padStart(2, '0')}-1001K`,
            fechaNacimiento: `${2005 + (idx % 3)}-${String(1 + (idx % 12)).padStart(2, '0')}-${String(10 + idx).padStart(2, '0')}`,
            edad: 21 - (idx % 3),
            direccion: `Dirección de ${nombre}`,
            telefono: `+505 8000-${String(1000 + idx).slice(-4)}`,
            tutor: `Tutor de ${nombre}`,
            padre: `Padre de ${nombre}`,
            madre: `Madre de ${nombre}`,
            emergencia: `+505 7000-${String(1000 + idx).slice(-4)}`,
            grado,
            seccion,
            estadoAcademico: 'Activo',
            instituto: 'Colegio San José',
            fechaRegistro: '2024-01-01',
            promedioGeneral: 0,
            materias: [],
            asistencias: [],
            observaciones: [],
            competenciasGlobales: [],
            fortalezas: [],
            debilidades: [],
            historial: [],
            reportes: [],
            estadisticas: {}
        });
    });

    const allEstudiantes = [estudiante, ...estudiantesPorGrupo];
    const allUsuarios = [docente, ...allEstudiantes];

    const todasLasMaterias = {};
    MATERIAS_SECUNDARIA.forEach(m => { todasLasMaterias[m.id] = m; });

    allEstudiantes.forEach(est => {
        const materiasEstudiante = MATERIAS_SECUNDARIA.map(m => {
            const comp = getCompromisosByMateria(m.id);
            const evaluciones = getEvaluacionesPredeterminadas(m.id, m.nombre, docenteId, est.grado, est.seccion);
            const calificaciones = generarNotasAleatorias(est.id, m.id, evaluciones);
            const promedioMateria = calificaciones.length > 0
                ? Math.round(calificaciones.reduce((s, c) => s + c.nota, 0) / calificaciones.length)
                : 0;
            return {
                materiaId: m.id,
                materiaNombre: m.nombre,
                docenteId: docenteId,
                docenteNombre: 'Manuel Antonio',
                horario: `${m.nombre === 'Matemáticas' ? 'Lun/Mié 8-9am' : m.nombre === 'Español' ? 'Mar/Jue 8-9am' : m.nombre === 'Ciencias Naturales' ? 'Lun/Mié 9-10am' : m.nombre === 'Ciencias Sociales' ? 'Mar/Jue 9-10am' : m.nombre === 'Inglés' ? 'Lun/Mié 10-11am' : m.nombre === 'Informática' ? 'Mar/Jue 10-11am' : m.nombre === 'Educación Física' ? 'Vie 8-10am' : 'Vie 10-12am'}`,
                grado: est.grado,
                seccion: est.seccion,
                evaluaciones: evaluciones,
                calificaciones: calificaciones,
                promedio: promedioMateria,
                competencias: comp.competencias,
                fortaleza: comp.fortaleza,
                debilidad: comp.debilidad,
                observaciones: []
            };
        });

        const promGeneral = materiasEstudiante.length > 0
            ? Math.round(materiasEstudiante.reduce((s, m) => s + m.promedio, 0) / materiasEstudiante.length)
            : 0;

        est.materias = materiasEstudiante;
        est.promedioGeneral = promGeneral;

        est.asistencias = Array.from({ length: 30 }, (_, i) => {
            const tipos = ['Presente', 'Presente', 'Presente', 'Presente', 'Ausente', 'Presente', 'Presente', 'Tarde', 'Presente', 'Justificado'];
            const idx = Math.floor(Math.random() * tipos.length);
            const fecha = new Date(2026, 2, 1 + i);
            if (fecha.getDay() === 0 || fecha.getDay() === 6) return null;
            return {
                id: `asist_${est.id}_${i}`,
                fecha: fecha.toISOString().split('T')[0],
                tipo: tipos[idx],
                materia: 'General'
            };
        }).filter(Boolean);

        const todasComp = ['Pensamiento lógico', 'Comunicación', 'Investigación', 'Liderazgo', 'Creatividad', 'Programación', 'Ciencias', 'Trabajo en equipo'];
        est.competenciasGlobales = todasComp.map(c => ({
            nombre: c,
            nivel: Math.round(60 + Math.random() * 35),
            tendencia: Math.random() > 0.7 ? 'mejorando' : 'estable'
        }));
        est.fortalezas = ['Responsabilidad', 'Participación activa', 'Trabajo en equipo'];
        est.debilidades = ['Gestión del tiempo', 'Exposición oral'];
        est.observaciones = [
            { id: `obs_${est.id}_1`, fecha: '2026-03-15', tipo: 'Rendimiento', descripcion: 'Buen desempeño general en el período.', docenteNombre: 'Manuel Antonio' },
            { id: `obs_${est.id}_2`, fecha: '2026-04-20', tipo: 'Disciplina', descripcion: 'Participa activamente en clase.', docenteNombre: 'Manuel Antonio' }
        ];
    });

    const evaluacionesGenerales = [];
    allEstudiantes.forEach(est => {
        est.materias.forEach(m => {
            m.evaluaciones.forEach(ev => {
                if (!evaluacionesGenerales.some(e => e.id === ev.id)) {
                    evaluacionesGenerales.push(ev);
                }
            });
        });
    });

    const calificacionesGenerales = [];
    allEstudiantes.forEach(est => {
        est.materias.forEach(m => {
            m.calificaciones.forEach(c => {
                calificacionesGenerales.push(c);
            });
        });
    });

    const asistenciasGenerales = [];
    allEstudiantes.forEach(est => {
        est.asistencias.forEach(a => {
            asistenciasGenerales.push({ ...a, estudianteId: est.id });
        });
    });

    const observacionesGenerales = [];
    allEstudiantes.forEach(est => {
        est.observaciones.forEach(o => {
            observacionesGenerales.push({ ...o, estudianteId: est.id });
        });
    });

    const institutos = JSON.parse(localStorage.getItem('eduInstitutos')) || INSTITUTOS_PREDETERMINADOS;
    const grupos = JSON.parse(localStorage.getItem('eduGrupos')) || [];
    const conversaciones = JSON.parse(localStorage.getItem('eduConversaciones')) || [];
    const mensajes = JSON.parse(localStorage.getItem('eduMensajes')) || [];
    const gruposChat = JSON.parse(localStorage.getItem('eduGruposChat')) || [];
    const encuestasChat = JSON.parse(localStorage.getItem('eduEncuestasChat')) || [];
    const estadosUsuarios = JSON.parse(localStorage.getItem('eduEstadosUsuarios')) || {};
    const avatares = JSON.parse(localStorage.getItem('eduAvatares')) || {};
    const chatTema = localStorage.getItem('eduChatTema') || null;
    const tareas = JSON.parse(localStorage.getItem('eduTareas')) || [];
    const entregas = JSON.parse(localStorage.getItem('eduEntregas')) || [];
    const notificaciones = JSON.parse(localStorage.getItem('eduNotificaciones')) || [];

    localStorage.setItem('eduUsuarios', JSON.stringify(allUsuarios));
    localStorage.setItem('eduDocente', JSON.stringify(docente));
    localStorage.setItem('eduDocenteMateria', JSON.stringify(docenteMateria));
    localStorage.setItem('eduEstudiantes', JSON.stringify(allEstudiantes));
    localStorage.setItem('eduMaterias', JSON.stringify(MATERIAS_SECUNDARIA));
    localStorage.setItem('eduEvaluaciones', JSON.stringify(evaluacionesGenerales));
    localStorage.setItem('eduCalificaciones', JSON.stringify(calificacionesGenerales));
    localStorage.setItem('eduAsistencias', JSON.stringify(asistenciasGenerales));
    localStorage.setItem('eduObservaciones', JSON.stringify(observacionesGenerales));
    localStorage.setItem('eduGradosSecciones', JSON.stringify(GRADOS_SECCIONES));
    localStorage.setItem('eduInstitutos', JSON.stringify(institutos));
    localStorage.setItem('eduGrupos', JSON.stringify(grupos));
    localStorage.setItem('eduConversaciones', JSON.stringify(conversaciones));
    localStorage.setItem('eduMensajes', JSON.stringify(mensajes));
    localStorage.setItem('eduGruposChat', JSON.stringify(gruposChat));
    localStorage.setItem('eduEncuestasChat', JSON.stringify(encuestasChat));
    localStorage.setItem('eduEstadosUsuarios', JSON.stringify(estadosUsuarios));
    localStorage.setItem('eduAvatares', JSON.stringify(avatares));
    if (chatTema) localStorage.setItem('eduChatTema', chatTema);
    localStorage.setItem('eduTareas', JSON.stringify(tareas));
    localStorage.setItem('eduEntregas', JSON.stringify(entregas));
    localStorage.setItem('eduNotificaciones', JSON.stringify(notificaciones));
    localStorage.setItem(SISTEMA_CONFIG.claveUnica, JSON.stringify(SISTEMA_CONFIG));

    // Also keep old keys for backward compatibility
    const oldUserKeys = ['usuariosIntegra-net', 'usuarioActual', 'sesionActiva', 'gruposDocente', 'trabajosDocente', 'entregasEstudiante', 'mensajesIntegra-net', 'admin_tareas', 'admin_notificaciones', 'admin_estudiantes', 'admin_docentes', 'admin_recursos', 'admin_actividades'];
    oldUserKeys.forEach(k => localStorage.removeItem(k));

    console.log('[Integra-net] Sistema inicializado exitosamente con datos predeterminados.');
    SISTEMA_CONFIG.initialized = true;
    return true;
}

inicializarDatosSiEsNecesario();
