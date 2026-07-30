
const GRUPOS = {
    GRUPOS_KEY: 'eduGrupos',
    CODIGOS_USADOS_KEY: 'eduCodigosUsados',

    getGrupos() {
        return JSON.parse(localStorage.getItem(this.GRUPOS_KEY)) || [];
    },

    guardarGrupos(data) {
        localStorage.setItem(this.GRUPOS_KEY, JSON.stringify(data));
    },

    generarCodigo(materiaNombre, grado) {
        const prefijo = materiaNombre.toUpperCase().slice(0, 3) + '-' + grado.replace('mo', '').replace('vo', '').replace('no', '') + '-';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let codigo;
        do {
            let sufijo = '';
            for (let i = 0; i < 5; i++) {
                sufijo += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            codigo = prefijo + sufijo;
        } while (this.getGrupos().some(g => g.codigo === codigo));
        return codigo;
    },

    crearGrupo(docente, datos) {
        const grupos = this.getGrupos();
        const grupo = {
            id: PERFILES.generarId(),
            nombre: datos.nombre,
            codigo: datos.codigo || this.generarCodigo(datos.materiaNombre, datos.grado),
            materiaId: datos.materiaId,
            materiaNombre: datos.materiaNombre,
            grado: datos.grado,
            seccion: datos.seccion,
            instituto: docente.instituto,
            docenteId: docente.id,
            docenteNombre: docente.nombre,
            fechaCreacion: new Date().toISOString().split('T')[0],
            descripcion: datos.descripcion || '',
            imagen: datos.imagen || '',
            estudiantes: []
        };
        grupos.push(grupo);
        this.guardarGrupos(grupos);
        return grupo;
    },

    unirseAGrupo(codigo, estudiante, instituto) {
        const grupos = this.getGrupos();
        const grupo = grupos.find(g => g.codigo === codigo.toUpperCase());
        if (!grupo) return { exito: false, mensaje: 'codigo_invalido' };
        if (grupo.instituto !== instituto) return { exito: false, mensaje: 'instituto_diferente' };
        if (grupo.estudiantes.includes(estudiante.id)) return { exito: false, mensaje: 'ya_inscrito' };
        grupo.estudiantes.push(estudiante.id);
        this.guardarGrupos(grupos);

        const estudiantes = JSON.parse(localStorage.getItem('eduEstudiantes')) || [];
        const est = estudiantes.find(e => e.id === estudiante.id);
        if (est) {
            if (!est.grupos) est.grupos = [];
            if (!est.grupos.find(g => g.id === grupo.id)) {
                est.grupos.push({
                    id: grupo.id,
                    nombre: grupo.nombre,
                    codigo: grupo.codigo,
                    materiaId: grupo.materiaId,
                    materiaNombre: grupo.materiaNombre,
                    grado: grupo.grado,
                    seccion: grupo.seccion,
                    docenteId: grupo.docenteId,
                    docenteNombre: grupo.docenteNombre
                });
            }
            localStorage.setItem('eduEstudiantes', JSON.stringify(estudiantes));
        }
        return { exito: true, grupo };
    },

    getGruposDocente(docenteId) {
        return this.getGrupos().filter(g => g.docenteId === docenteId);
    },

    getGruposEstudiante(estudianteId) {
        return this.getGrupos().filter(g => g.estudiantes.includes(estudianteId));
    },

    getGruposPorInstituto(instituto) {
        return this.getGrupos().filter(g => g.instituto === instituto);
    },

    getEstudiantesDelGrupo(grupoId) {
        const grupo = this.getGrupos().find(g => g.id === grupoId);
        if (!grupo) return [];
        const estudiantes = JSON.parse(localStorage.getItem('eduEstudiantes')) || [];
        return estudiantes.filter(e => grupo.estudiantes.includes(e.id));
    },

    obtenerDocentesPorInstituto(instituto) {
        const usuarios = JSON.parse(localStorage.getItem('eduUsuarios')) || [];
        return usuarios.filter(u => u.rol === 'docente' && u.instituto === instituto);
    },

    obtenerEstudiantesPorInstituto(instituto) {
        const usuarios = JSON.parse(localStorage.getItem('eduUsuarios')) || [];
        return usuarios.filter(u => u.rol === 'estudiante' && u.instituto === instituto);
    }
};
