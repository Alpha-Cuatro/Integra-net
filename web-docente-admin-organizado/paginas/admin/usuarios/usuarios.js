// Listado de usuarios del panel de administración.
// Lee de eduUsuarios y eduEstudiantes (promedio por usuario).

const COLUMNAS_USUARIOS = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'correo', label: 'Correo' },
    { key: 'rol', label: 'Rol' },
    { key: 'instituto', label: 'Centro educativo' },
    { key: 'promedio', label: 'Promedio' },
    { key: 'estado', label: 'Estado', type: 'status' }
];

document.addEventListener('DOMContentLoaded', () => {
    cargarUsuarios();
    document.getElementById('buscarUsuario').addEventListener('input', aplicarFiltros);
    document.getElementById('filtroRol').addEventListener('change', aplicarFiltros);
});

function leer(clave) {
    try {
        return JSON.parse(localStorage.getItem(clave)) ?? [];
    } catch (e) {
        return [];
    }
}

function construirUsuarios() {
    const usuarios = leer('eduUsuarios');
    const estudiantes = leer('eduEstudiantes');

    const promedioPorCorreo = new Map();
    estudiantes.forEach(e => {
        if (e.correo && typeof e.promedioGeneral === 'number') {
            promedioPorCorreo.set(e.correo.toLowerCase(), e.promedioGeneral);
        }
    });

    return usuarios.map(u => ({
        nombre: u.nombre,
        correo: u.correo,
        rol: u.rol,
        instituto: u.instituto || '—',
        promedio: promedioPorCorreo.has(String(u.correo).toLowerCase())
            ? promedioPorCorreo.get(String(u.correo).toLowerCase())
            : '—',
        estado: u.estado || u.estadoAcademico || 'Activo'
    }));
}

function aplicarFiltros() {
    const texto = document.getElementById('buscarUsuario').value.trim().toLowerCase();
    const rol = document.getElementById('filtroRol').value;

    const filtrados = construirUsuarios().filter(u => {
        const coincideTexto = !texto
            || (u.nombre || '').toLowerCase().includes(texto)
            || (u.correo || '').toLowerCase().includes(texto);
        const coincideRol = !rol || u.rol === rol;
        return coincideTexto && coincideRol;
    });

    TableGenerator.createTable('tabla-usuarios', COLUMNAS_USUARIOS, filtrados, {
        emptyMessage: 'No hay usuarios que coincidan con el filtro.'
    });
}

function cargarUsuarios() {
    aplicarFiltros();
}
