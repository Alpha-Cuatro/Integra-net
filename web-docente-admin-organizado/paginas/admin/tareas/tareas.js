// Listado de tareas y entregas del panel de administración.
// Reutiliza TableGenerator de ../table.js y las claves edu*.

document.addEventListener('DOMContentLoaded', () => {
    cargarTareas();

    document.getElementById('buscarTarea')?.addEventListener('input', aplicarFiltros);
    document.getElementById('filtroEstado')?.addEventListener('change', aplicarFiltros);
});

const COLUMNAS_TAREAS = [
    { key: 'titulo', label: 'Título' },
    { key: 'materia', label: 'Módulo' },
    { key: 'docente', label: 'Docente' },
    { key: 'fechaEntrega', label: 'Entrega', type: 'date' },
    { key: 'estado', label: 'Estado', type: 'status' }
];

const COLUMNAS_ENTREGAS = [
    { key: 'tareaTitulo', label: 'Tarea' },
    { key: 'estudiante', label: 'Estudiante' },
    { key: 'fecha', label: 'Recibida', type: 'date' }
];

function leer(clave) {
    try {
        return JSON.parse(localStorage.getItem(clave)) ?? [];
    } catch (e) {
        return [];
    }
}

function aplicarFiltros() {
    const texto = document.getElementById('buscarTarea').value.trim().toLowerCase();
    const estado = document.getElementById('filtroEstado').value;

    const tareas = leer('eduTareas').filter(t => {
        const coincideTexto = !texto
            || (t.titulo || '').toLowerCase().includes(texto)
            || (t.materia || '').toLowerCase().includes(texto);
        const coincideEstado = !estado || t.estado === estado;
        return coincideTexto && coincideEstado;
    });

    TableGenerator.createTable('tabla-tareas', COLUMNAS_TAREAS, tareas, {
        emptyMessage: 'No hay tareas que coincidan con el filtro.'
    });
}

function cargarTareas() {
    aplicarFiltros();

    const entregas = leer('eduEntregas');
    TableGenerator.createTable('tabla-entregas', COLUMNAS_ENTREGAS, entregas, {
        emptyMessage: 'Aún no se han registrado entregas de tareas.'
    });
}
