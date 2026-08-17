
const AUTENTICACION = {
    SESION_KEY: 'eduSesion',
    USUARIOS_KEY: 'eduUsuarios',

    getUsuarios() {
        return JSON.parse(localStorage.getItem(this.USUARIOS_KEY)) || [];
    },

    getSesion() {
        const s = localStorage.getItem(this.SESION_KEY);
        return s ? JSON.parse(s) : null;
    },

    guardarSesion(usuario) {
        const sesion = {
            usuarioId: usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
            inicio: new Date().toISOString()
        };
        localStorage.setItem(this.SESION_KEY, JSON.stringify(sesion));
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
        localStorage.setItem('sesionActiva', 'true');
    },

    iniciarSesion(correo, password) {
        const usuarios = this.getUsuarios();
        const usuario = usuarios.find(u =>
            u.correo.toLowerCase() === correo.toLowerCase()
        );
        if (!usuario) return { exito: false, mensaje: 'cuenta_no_encontrada' };
        if (usuario.password !== password) return { exito: false, mensaje: 'password_incorrecta' };
        this.guardarSesion(usuario);
        return { exito: true, usuario };
    },

    cerrarSesion() {
        localStorage.removeItem(this.SESION_KEY);
        localStorage.removeItem('usuarioActual');
        localStorage.removeItem('sesionActiva');
    },

    sesionActiva() {
        return !!this.getSesion();
    },

    usuarioActual() {
        const sesion = this.getSesion();
        if (!sesion) return null;
        const usuarios = this.getUsuarios();
        return usuarios.find(u => u.id === sesion.usuarioId) || null;
    },

    verificarAcceso(rolRequerido) {
        const sesion = this.getSesion();
        if (!sesion) {
            window.location.href = '../auth/login.html';
            return false;
        }
        if (rolRequerido && sesion.rol !== rolRequerido) {
            window.location.href = sesion.rol === 'docente' ? '../docente/index.html' : '../index.html';
            return false;
        }
        return true;
    },

    bloquearAtras() {
        window.history.pushState(null, null, window.location.href);
        window.addEventListener('popstate', () => {
            if (!this.sesionActiva()) {
                window.location.href = '../auth/login.html';
            } else {
                window.history.pushState(null, null, window.location.href);
            }
        });
    },

    registrarUsuario(datos) {
        const usuarios = this.getUsuarios();
        const existe = usuarios.find(u => u.correo.toLowerCase() === datos.correo.toLowerCase());
        if (existe) return { exito: false, mensaje: 'correo_existente' };
        const nuevo = {
            id: Date.now(),
            nombre: datos.nombre,
            correo: datos.correo,
            password: datos.password,
            rol: datos.rol,
            instituto: datos.instituto || '',
            fechaRegistro: new Date().toLocaleDateString(),
            fotografia: '',
            telefono: datos.telefono || '',
            direccion: datos.direccion || '',
            ...(datos.rol === 'estudiante' ? {
                codigo: `EST-${Date.now().toString().slice(-6)}`,
                grado: datos.grado || '',
                seccion: datos.seccion || '',
                estadoAcademico: 'Activo',
                materias: [],
                asistencias: [],
                observaciones: [],
                competenciasGlobales: [],
                fortalezas: [],
                debilidades: [],
                promedioGeneral: 0
            } : {
                codigoDocente: `DOC-${Date.now().toString().slice(-6)}`,
                especialidad: datos.especialidad || '',
                estado: 'Activo',
                fechaIngreso: new Date().toISOString().split('T')[0]
            })
        };
        usuarios.push(nuevo);
        localStorage.setItem(this.USUARIOS_KEY, JSON.stringify(usuarios));
        this.guardarSesion(nuevo);
        return { exito: true, usuario: nuevo };
    }
};

function protegerRuta(rolRequerido) {
    if (!AUTENTICACION.verificarAcceso(rolRequerido)) return false;
    AUTENTICACION.bloquearAtras();
    return true;
}
