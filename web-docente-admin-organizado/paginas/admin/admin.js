class AdminManager {
    constructor() {
        this.data = {};
        this.loadInitialData();
    }
    
    loadInitialData() {
        this.data.estudiantes = JSON.parse(localStorage.getItem('admin_estudiantes')) || this.getDefaultEstudiantes();
        this.data.docentes = JSON.parse(localStorage.getItem('admin_docentes')) || this.getDefaultDocentes();
        this.data.tareas = JSON.parse(localStorage.getItem('admin_tareas')) || this.getDefaultTareas();
        this.data.actividades = JSON.parse(localStorage.getItem('admin_actividades')) || this.getDefaultActividades();
        this.data.recursos = JSON.parse(localStorage.getItem('admin_recursos')) || this.getDefaultRecursos();
        this.data.notificaciones = JSON.parse(localStorage.getItem('admin_notificaciones')) || this.getDefaultNotificaciones();
    }
    
    getDefaultEstudiantes() {
        return [
            { id: 1, nombre: 'María González', email: 'maria@example.com', grado: '10°', promedio: 85 },
            { id: 2, nombre: 'Carlos López', email: 'carlos@example.com', grado: '10°', promedio: 78 },
            { id: 3, nombre: 'Ana Martínez', email: 'ana@example.com', grado: '11°', promedio: 92 }
        ];
    }
    
    getDefaultDocentes() {
        return [
            { id: 1, nombre: 'Prof. Juan Pérez', email: 'juan.perez@Integra-net.com', materia: 'Prevención de la Violencia de Género', telefono: '8888-1111' },
            { id: 2, nombre: 'Prof. María Rodríguez', email: 'maria.rodriguez@Integra-net.com', materia: 'Derechos de la Mujer: Fundamentos', telefono: '8888-2222' }
        ];
    }
    
    getDefaultTareas() {
        return [
            { id: 1, titulo: 'Análisis de un caso de violencia de género', materia: 'Prevención de la Violencia de Género', fechaEntrega: '2026-06-15', estado: 'Pendiente' },
            { id: 2, titulo: 'Ensayo sobre equidad en la comunidad', materia: 'Equidad de Género', fechaEntrega: '2026-06-18', estado: 'Pendiente' }
        ];
    }
    
    getDefaultActividades() {
        return [
            { id: 1, nombre: 'Cuestionario de Derechos de la Mujer', tipo: 'Cuestionario', puntajeMax: 100, fechaInicio: '2026-06-10' },
            { id: 2, nombre: 'Taller de Comunicación Asertiva', tipo: 'Taller', puntajeMax: 50, fechaInicio: '2026-06-12' }
        ];
    }
    
    getDefaultRecursos() {
        return [
            { id: 1, nombre: 'Guía de Derechos de la Mujer', tipo: 'PDF', url: '#', descargas: 45 },
            { id: 2, nombre: 'Video: Prevención de la Violencia de Género', tipo: 'Video', url: '#', descargas: 32 }
        ];
    }
    
    getDefaultNotificaciones() {
        return [
            { id: 1, mensaje: 'Nueva tarea asignada', fecha: '2026-06-09', leida: false },
            { id: 2, mensaje: 'Recordatorio: Examen la próxima semana', fecha: '2026-06-08', leida: true }
        ];
    }
    
    saveAll() {
        localStorage.setItem('admin_estudiantes', JSON.stringify(this.data.estudiantes));
        localStorage.setItem('admin_docentes', JSON.stringify(this.data.docentes));
        localStorage.setItem('admin_tareas', JSON.stringify(this.data.tareas));
        localStorage.setItem('admin_actividades', JSON.stringify(this.data.actividades));
        localStorage.setItem('admin_recursos', JSON.stringify(this.data.recursos));
        localStorage.setItem('admin_notificaciones', JSON.stringify(this.data.notificaciones));
    }
    
    getEstudiantes() { return this.data.estudiantes; }
    addEstudiante(estudiante) {
        estudiante.id = Date.now();
        this.data.estudiantes.push(estudiante);
        this.saveAll();
        return estudiante;
    }
    updateEstudiante(id, data) {
        const index = this.data.estudiantes.findIndex(e => e.id == id);
        if (index !== -1) {
            this.data.estudiantes[index] = { ...this.data.estudiantes[index], ...data };
            this.saveAll();
            return true;
        }
        return false;
    }
    deleteEstudiante(id) {
        this.data.estudiantes = this.data.estudiantes.filter(e => e.id != id);
        this.saveAll();
    }
    
    getDocentes() { return this.data.docentes; }
    addDocente(docente) {
        docente.id = Date.now();
        this.data.docentes.push(docente);
        this.saveAll();
        return docente;
    }
    updateDocente(id, data) {
        const index = this.data.docentes.findIndex(d => d.id == id);
        if (index !== -1) {
            this.data.docentes[index] = { ...this.data.docentes[index], ...data };
            this.saveAll();
            return true;
        }
        return false;
    }
    deleteDocente(id) {
        this.data.docentes = this.data.docentes.filter(d => d.id != id);
        this.saveAll();
    }
    
    getTareas() { return this.data.tareas; }
    addTarea(tarea) {
        tarea.id = Date.now();
        this.data.tareas.push(tarea);
        this.saveAll();
        return tarea;
    }
    updateTarea(id, data) {
        const index = this.data.tareas.findIndex(t => t.id == id);
        if (index !== -1) {
            this.data.tareas[index] = { ...this.data.tareas[index], ...data };
            this.saveAll();
            return true;
        }
        return false;
    }
    deleteTarea(id) {
        this.data.tareas = this.data.tareas.filter(t => t.id != id);
        this.saveAll();
    }
    
    getActividades() { return this.data.actividades; }
    getRecursos() { return this.data.recursos; }
    getNotificaciones() { return this.data.notificaciones; }
}

const adminManager = new AdminManager();