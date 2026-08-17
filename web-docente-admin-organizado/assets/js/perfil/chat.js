const CHAT = {
    KEY_CONV: 'eduConversaciones',
    KEY_MSG: 'eduMensajes',
    KEY_GRUPOS: 'eduGruposChat',
    KEY_ENCUESTAS: 'eduEncuestasChat',

    getConversaciones() {
        return JSON.parse(localStorage.getItem(this.KEY_CONV)) || [];
    },
    guardarConversaciones(d) {
        localStorage.setItem(this.KEY_CONV, JSON.stringify(d));
    },
    getMensajes() {
        return JSON.parse(localStorage.getItem(this.KEY_MSG)) || [];
    },
    guardarMensajes(d) {
        localStorage.setItem(this.KEY_MSG, JSON.stringify(d));
    },
    getGruposChat() {
        return JSON.parse(localStorage.getItem(this.KEY_GRUPOS)) || [];
    },
    guardarGruposChat(d) {
        localStorage.setItem(this.KEY_GRUPOS, JSON.stringify(d));
    },
    getEncuestas() {
        return JSON.parse(localStorage.getItem(this.KEY_ENCUESTAS)) || [];
    },
    guardarEncuestas(d) {
        localStorage.setItem(this.KEY_ENCUESTAS, JSON.stringify(d));
    },

    generarId() {
        return Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    },

    ahora() {
        const d = new Date();
        return {
            fecha: d.toISOString().split('T')[0],
            hora: d.toTimeString().split(' ')[0].slice(0, 5),
            timestamp: d.getTime(),
            iso: d.toISOString()
        };
    },

    // --- USERS / CONTACTS ---
    getUsuario(id) {
        const usuarios = JSON.parse(localStorage.getItem('eduUsuarios')) || [];
        return usuarios.find(u => u.id === id) || null;
    },

    getEstudiantesPorInstituto(instituto) {
        const usuarios = JSON.parse(localStorage.getItem('eduUsuarios')) || [];
        return usuarios.filter(u => u.rol === 'estudiante' && u.instituto === instituto);
    },

    getDocentesPorInstituto(instituto) {
        const usuarios = JSON.parse(localStorage.getItem('eduUsuarios')) || [];
        return usuarios.filter(u => u.rol === 'docente' && u.instituto === instituto);
    },

    getEstudianteCompleto(id) {
        const estudiantes = JSON.parse(localStorage.getItem('eduEstudiantes')) || [];
        return estudiantes.find(e => e.id === id) || null;
    },

    // --- CONVERSATIONS ---
    obtenerConversacionIndividual(id1, id2, instituto) {
        const convs = this.getConversaciones();
        return convs.find(c =>
            c.tipo === 'individual' &&
            c.participantes.includes(id1) &&
            c.participantes.includes(id2) &&
            c.instituto === instituto
        );
    },

    crearConversacionIndividual(remitente, destinatario, instituto) {
        let conv = this.obtenerConversacionIndividual(remitente.id, destinatario.id, instituto);
        if (!conv) {
            const convs = this.getConversaciones();
            conv = {
                id: this.generarId(),
                tipo: 'individual',
                participantes: [remitente.id, destinatario.id],
                nombres: { [remitente.id]: remitente.nombre, [destinatario.id]: destinatario.nombre },
                instituto,
                ultimoMensaje: '',
                ultimaFecha: '',
                noLeidos: {},
                fijado: false,
                archivado: false,
                silenciado: false,
                silenciadoHasta: null,
                favorito: false,
                fondo: null,
                colorBurbujas: null,
                notificacionPersonalizada: null
            };
            convs.push(conv);
            this.guardarConversaciones(convs);
        }
        return conv;
    },

    // --- GROUPS ---
    crearGrupoChat(docente, datos) {
        const grupos = this.getGruposChat();
        const codigo = this.generarCodigoGrupo();
        const ahora = this.ahora();
        const grupo = {
            id: this.generarId(),
            nombre: datos.nombre,
            descripcion: datos.descripcion || '',
            foto: datos.foto || '',
            codigo,
            instituto: docente.instituto,
            docenteCreador: { id: docente.id, nombre: docente.nombre },
            fechaCreacion: ahora.fecha,
            cerrado: false,
            soloAnuncios: false,
            multimediaBloqueada: false,
            documentosBloqueados: false,
            horarioEscritura: null,
            miembros: [{
                id: docente.id,
                nombre: docente.nombre,
                rol: 'docente',
                esAdmin: true,
                suspendido: false,
                suspendidoHasta: null,
                permisos: ['enviar_mensajes', 'enviar_multimedia', 'enviar_documentos', 'crear_encuestas']
            }],
            fondo: null,
            colorBurbujas: null
        };
        if (datos.estudiantes) {
            datos.estudiantes.forEach(eId => {
                const u = this.getUsuario(eId);
                if (u && !grupo.miembros.some(m => m.id === eId)) {
                    grupo.miembros.push({
                        id: eId,
                        nombre: u.nombre,
                        rol: 'estudiante',
                        esAdmin: false,
                        suspendido: false,
                        suspendidoHasta: null,
                        permisos: ['enviar_mensajes', 'enviar_multimedia']
                    });
                }
            });
        }
        grupos.push(grupo);
        this.guardarGruposChat(grupos);

        const convs = this.getConversaciones();
        const conv = {
            id: grupo.id,
            tipo: 'grupo',
            grupoId: grupo.id,
            participantes: grupo.miembros.map(m => m.id),
            nombres: grupo.miembros.reduce((acc, m) => { acc[m.id] = m.nombre; return acc; }, {}),
            instituto: docente.instituto,
            nombre: grupo.nombre,
            foto: grupo.foto,
            ultimoMensaje: 'Grupo creado',
            ultimaFecha: ahora.iso,
            noLeidos: {},
            fijado: false,
            archivado: false,
            silenciado: false,
            silenciadoHasta: null,
            favorito: false,
            fondo: null,
            colorBurbujas: null,
            notificacionPersonalizada: null
        };
        convs.push(conv);
        this.guardarConversaciones(convs);

        return grupo;
    },

    generarCodigoGrupo() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let codigo;
        do {
            codigo = 'GC-';
            for (let i = 0; i < 8; i++) codigo += chars.charAt(Math.floor(Math.random() * chars.length));
        } while (this.getGruposChat().some(g => g.codigo === codigo));
        return codigo;
    },

    unirseAGrupoChat(codigo, usuario, instituto) {
        const grupos = this.getGruposChat();
        const grupo = grupos.find(g => g.codigo === codigo.toUpperCase());
        if (!grupo) return { exito: false, mensaje: 'codigo_invalido' };
        if (grupo.instituto !== instituto) return { exito: false, mensaje: 'instituto_diferente' };
        if (grupo.miembros.some(m => m.id === usuario.id)) return { exito: false, mensaje: 'ya_miembro' };
        if (grupo.cerrado) return { exito: false, mensaje: 'grupo_cerrado' };
        grupo.miembros.push({
            id: usuario.id,
            nombre: usuario.nombre,
            rol: 'estudiante',
            esAdmin: false,
            suspendido: false,
            suspendidoHasta: null,
            permisos: ['enviar_mensajes', 'enviar_multimedia']
        });
        this.guardarGruposChat(grupos);

        const convs = this.getConversaciones();
        let conv = convs.find(c => c.id === grupo.id);
        if (conv) {
            conv.participantes.push(usuario.id);
            conv.nombres[usuario.id] = usuario.nombre;
            this.guardarConversaciones(convs);
        }
        return { exito: true, grupo };
    },

    getGruposChatUsuario(usuarioId) {
        return this.getGruposChat().filter(g => g.miembros.some(m => m.id === usuarioId));
    },

    // --- MESSAGES ---
    enviarMensaje(remitente, convId, datos) {
        const mensajes = this.getMensajes();
        const ahora = this.ahora();
        const msg = {
            id: this.generarId(),
            conversacionId: convId,
            remitenteId: remitente.id,
            remitenteNombre: remitente.nombre,
            tipo: datos.tipo || 'texto',
            contenido: datos.contenido || {},
            fecha: ahora.fecha,
            hora: ahora.hora,
            timestamp: ahora.timestamp,
            estado: 'enviado',
            editado: false,
            editadoFecha: null,
            reacciones: [],
            leidoPor: [{ usuarioId: remitente.id, usuarioNombre: remitente.nombre, fecha: ahora.iso }],
            eliminadoPara: [],
            eliminadoParaTodos: false,
            destacado: false,
            reenviado: datos.reenviado || false
        };
        if (datos.respondeA) msg.respondeA = datos.respondeA;

        mensajes.push(msg);
        this.guardarMensajes(mensajes);

        const convs = this.getConversaciones();
        const conv = convs.find(c => c.id === convId);
        if (conv) {
            const txt = datos.tipo === 'texto' ? (datos.contenido.texto || '') :
                datos.tipo === 'imagen' ? '📷 Foto' :
                datos.tipo === 'video' ? '🎥 Video' :
                datos.tipo === 'audio' ? '🎵 Audio' :
                datos.tipo === 'documento' ? '📎 Documento' :
                datos.tipo === 'encuesta' ? '📊 Encuesta' :
                datos.tipo === 'ubicacion' ? '📍 Ubicación' :
                datos.tipo === 'contacto' ? '👤 Contacto' :
                datos.tipo === 'gif' ? '🎭 GIF' :
                datos.tipo === 'sticker' ? '🏷️ Sticker' : '📝 Mensaje';
            conv.ultimoMensaje = txt;
            conv.ultimaFecha = ahora.iso;
            conv.participantes.forEach(pId => {
                if (pId !== remitente.id) {
                    conv.noLeidos[pId] = (conv.noLeidos[pId] || 0) + 1;
                }
            });
            this.guardarConversaciones(convs);

            const grupo = this.getGruposChat().find(g => g.id === convId);
            if (grupo) {
                grupo.miembros.forEach(m => {
                    if (m.id !== remitente.id && m.rol === 'estudiante') {
                        m.notifsNoLeidas = (m.notifsNoLeidas || 0) + 1;
                    }
                });
                this.guardarGruposChat(grupos);
            }
        }
        return msg;
    },

    getMensajesConversacion(convId) {
        return this.getMensajes()
            .filter(m => m.conversacionId === convId && !m.eliminadoParaTodos)
            .sort((a, b) => a.timestamp - b.timestamp);
    },

    marcarComoLeido(convId, usuarioId) {
        const convs = this.getConversaciones();
        const conv = convs.find(c => c.id === convId);
        if (conv) {
            conv.noLeidos[usuarioId] = 0;
            this.guardarConversaciones(convs);
        }
        this.marcarTodosComoLeidos(convId, usuarioId);
    },

    getConversacionesUsuario(usuarioId, instituto) {
        return this.getConversaciones()
            .filter(c => c.participantes.includes(usuarioId) && c.instituto === instituto)
            .sort((a, b) => {
                if (a.fijado && !b.fijado) return -1;
                if (!a.fijado && b.fijado) return 1;
                const dA = a.ultimaFecha ? new Date(a.ultimaFecha) : new Date(0);
                const dB = b.ultimaFecha ? new Date(b.ultimaFecha) : new Date(0);
                return dB - dA;
            });
    },

    getTotalNoLeidos(usuarioId) {
        return this.getConversaciones()
            .reduce((total, c) => total + (c.noLeidos[usuarioId] || 0), 0);
    },

    getOtroParticipante(conv, usuarioId) {
        if (conv.tipo === 'grupo') {
            return { id: conv.id, nombre: conv.nombre || 'Grupo', esGrupo: true };
        }
        const otroId = conv.participantes.find(p => p !== usuarioId);
        const u = this.getUsuario(otroId);
        return { id: otroId, nombre: conv.nombres[otroId] || 'Usuario', rol: u?.rol || '', esGrupo: false };
    },

    // --- MESSAGE STATUS ---
    getLeidoPorMensaje(mensajeId) {
        const mensajes = this.getMensajes();
        const msg = mensajes.find(m => m.id === mensajeId);
        if (!msg) return [];
        return msg.leidoPor || [];
    },

    marcarComoEntregado(convId, usuarioId) {
        const mensajes = this.getMensajes();
        let cambios = false;
        mensajes.forEach(m => {
            if (m.conversacionId === convId && m.remitenteId !== usuarioId && m.estado === 'enviado') {
                m.estado = 'entregado';
                cambios = true;
            }
        });
        if (cambios) this.guardarMensajes(mensajes);
    },

    marcarTodosComoLeidos(convId, usuarioId) {
        this.marcarComoEntregado(convId, usuarioId);
        const mensajes = this.getMensajes();
        let cambios = false;
        mensajes.forEach(m => {
            if (m.conversacionId === convId && m.remitenteId !== usuarioId) {
                if (!m.leidoPor) m.leidoPor = [];
                if (!m.leidoPor.some(l => l.usuarioId === usuarioId)) {
                    m.leidoPor.push({ usuarioId, usuarioNombre: this.getUsuario(usuarioId)?.nombre || '', fecha: this.ahora().iso });
                    cambios = true;
                }
                if (m.estado !== 'leido') {
                    m.estado = 'leido';
                    cambios = true;
                }
            }
        });
        if (cambios) this.guardarMensajes(mensajes);
    },

    // --- MESSAGE ACTIONS ---
    reaccionar(mensajeId, usuarioId, usuarioNombre, emoji) {
        const mensajes = this.getMensajes();
        const msg = mensajes.find(m => m.id === mensajeId);
        if (!msg) return;
        if (!msg.reacciones) msg.reacciones = [];
        const existente = msg.reacciones.findIndex(r => r.usuarioId === usuarioId && r.emoji === emoji);
        if (existente >= 0) {
            msg.reacciones.splice(existente, 1);
        } else {
            const existenteOtro = msg.reacciones.findIndex(r => r.usuarioId === usuarioId);
            if (existenteOtro >= 0) msg.reacciones.splice(existenteOtro, 1);
            msg.reacciones.push({ emoji, usuarioId, usuarioNombre });
        }
        this.guardarMensajes(mensajes);
    },

    editarMensaje(mensajeId, nuevoTexto) {
        const mensajes = this.getMensajes();
        const msg = mensajes.find(m => m.id === mensajeId);
        if (!msg || msg.tipo !== 'texto') return false;
        msg.contenido.texto = nuevoTexto;
        msg.editado = true;
        msg.editadoFecha = this.ahora().iso;
        this.guardarMensajes(mensajes);
        return true;
    },

    eliminarParaMi(mensajeId, usuarioId) {
        const mensajes = this.getMensajes();
        const msg = mensajes.find(m => m.id === mensajeId);
        if (!msg) return;
        if (!msg.eliminadoPara) msg.eliminadoPara = [];
        if (!msg.eliminadoPara.includes(usuarioId)) msg.eliminadoPara.push(usuarioId);
        this.guardarMensajes(mensajes);
    },

    eliminarParaTodos(mensajeId, usuarioId) {
        const mensajes = this.getMensajes();
        const msg = mensajes.find(m => m.id === mensajeId);
        if (!msg) return;
        msg.eliminadoParaTodos = true;
        this.guardarMensajes(mensajes);
    },

    destacarMensaje(mensajeId) {
        const mensajes = this.getMensajes();
        const msg = mensajes.find(m => m.id === mensajeId);
        if (!msg) return;
        msg.destacado = !msg.destacado;
        this.guardarMensajes(mensajes);
    },

    // --- POLLS ---
    crearEncuesta(remitente, convId, datos) {
        const encuestas = this.getEncuestas();
        const ahora = this.ahora();
        const encuesta = {
            id: this.generarId(),
            conversacionId: convId,
            creadorId: remitente.id,
            creadorNombre: remitente.nombre,
            pregunta: datos.pregunta,
            opciones: datos.opciones.map(o => ({
                id: this.generarId(),
                texto: o,
                votos: []
            })),
            tipo: datos.tipo || 'multiple',
            activa: true,
            fechaCreacion: ahora.iso,
            fechaCierre: datos.fechaCierre || null
        };
        encuestas.push(encuesta);
        this.guardarEncuestas(encuestas);

        this.enviarMensaje(remitente, convId, {
            tipo: 'encuesta',
            contenido: { encuestaId: encuesta.id, pregunta: datos.pregunta, opciones: datos.opciones }
        });
        return encuesta;
    },

    votarEncuesta(encuestaId, opcionId, usuarioId) {
        const encuestas = this.getEncuestas();
        const enc = encuestas.find(e => e.id === encuestaId);
        if (!enc || !enc.activa) return false;
        const opcion = enc.opciones.find(o => o.id === opcionId);
        if (!opcion) return false;
        if (enc.tipo === 'unica') {
            enc.opciones.forEach(o => {
                o.votos = o.votos.filter(v => v !== usuarioId);
            });
        }
        if (!opcion.votos.includes(usuarioId)) {
            opcion.votos.push(usuarioId);
        }
        this.guardarEncuestas(encuestas);
        return true;
    },

    // --- MODERATION ---
    limpiarSuspensionesExpiradas() {
        const grupos = this.getGruposChat();
        let cambios = false;
        grupos.forEach(g => {
            g.miembros.forEach(m => {
                if (m.suspendido && m.suspendidoHasta && new Date(m.suspendidoHasta) <= new Date()) {
                    m.suspendido = false;
                    m.suspendidoHasta = null;
                    cambios = true;
                }
            });
        });
        if (cambios) this.guardarGruposChat(grupos);
    },

    miembroEstaSuspendido(grupoId, miembroId) {
        this.limpiarSuspensionesExpiradas();
        const grupos = this.getGruposChat();
        const grupo = grupos.find(g => g.id === grupoId);
        if (!grupo) return false;
        const miembro = grupo.miembros.find(m => m.id === miembroId);
        if (!miembro) return false;
        return miembro.suspendido;
    },

    suspenderMiembro(grupoId, miembroId, horas) {
        const grupos = this.getGruposChat();
        const grupo = grupos.find(g => g.id === grupoId);
        if (!grupo) return false;
        const miembro = grupo.miembros.find(m => m.id === miembroId);
        if (!miembro || miembro.rol === 'docente') return false;
        miembro.suspendido = true;
        miembro.suspendidoHasta = horas ? new Date(Date.now() + horas * 3600000).toISOString() : null;
        this.guardarGruposChat(grupos);
        return true;
    },

    reactivarMiembro(grupoId, miembroId) {
        const grupos = this.getGruposChat();
        const grupo = grupos.find(g => g.id === grupoId);
        if (!grupo) return false;
        const miembro = grupo.miembros.find(m => m.id === miembroId);
        if (!miembro) return false;
        miembro.suspendido = false;
        miembro.suspendidoHasta = null;
        this.guardarGruposChat(grupos);
        return true;
    },

    expulsarMiembro(grupoId, miembroId) {
        const grupos = this.getGruposChat();
        const grupo = grupos.find(g => g.id === grupoId);
        if (!grupo) return false;
        const idx = grupo.miembros.findIndex(m => m.id === miembroId);
        if (idx < 0 || grupo.miembros[idx].rol === 'docente') return false;
        grupo.miembros.splice(idx, 1);
        this.guardarGruposChat(grupos);

        const convs = this.getConversaciones();
        const conv = convs.find(c => c.id === grupoId);
        if (conv) {
            conv.participantes = conv.participantes.filter(p => p !== miembroId);
            this.guardarConversaciones(convs);
        }
        return true;
    },

    hacerAdmin(grupoId, miembroId) {
        const grupos = this.getGruposChat();
        const grupo = grupos.find(g => g.id === grupoId);
        if (!grupo) return false;
        const miembro = grupo.miembros.find(m => m.id === miembroId);
        if (!miembro || miembro.rol === 'docente') return false;
        miembro.esAdmin = !miembro.esAdmin;
        this.guardarGruposChat(grupos);
        return true;
    },

    cambiarPermiso(grupoId, miembroId, permiso, valor) {
        const grupos = this.getGruposChat();
        const grupo = grupos.find(g => g.id === grupoId);
        if (!grupo) return false;
        const miembro = grupo.miembros.find(m => m.id === miembroId);
        if (!miembro) return false;
        if (valor) {
            if (!miembro.permisos.includes(permiso)) miembro.permisos.push(permiso);
        } else {
            miembro.permisos = miembro.permisos.filter(p => p !== permiso);
        }
        this.guardarGruposChat(grupos);
        return true;
    },

    // --- CONVERSATION ACTIONS ---
    toggleFijar(convId) {
        const convs = this.getConversaciones();
        const conv = convs.find(c => c.id === convId);
        if (conv) { conv.fijado = !conv.fijado; this.guardarConversaciones(convs); }
    },

    toggleArchivar(convId) {
        const convs = this.getConversaciones();
        const conv = convs.find(c => c.id === convId);
        if (conv) { conv.archivado = !conv.archivado; this.guardarConversaciones(convs); }
    },

    toggleFavorito(convId) {
        const convs = this.getConversaciones();
        const conv = convs.find(c => c.id === convId);
        if (conv) { conv.favorito = !conv.favorito; this.guardarConversaciones(convs); }
    },

    silenciar(convId, horas) {
        const convs = this.getConversaciones();
        const conv = convs.find(c => c.id === convId);
        if (conv) {
            conv.silenciado = true;
            conv.silenciadoHasta = horas ? new Date(Date.now() + horas * 3600000).toISOString() : null;
            this.guardarConversaciones(convs);
        }
    },

    desSilenciar(convId) {
        const convs = this.getConversaciones();
        const conv = convs.find(c => c.id === convId);
        if (conv) { conv.silenciado = false; conv.silenciadoHasta = null; this.guardarConversaciones(convs); }
    },

    eliminarConversacion(convId) {
        let convs = this.getConversaciones();
        convs = convs.filter(c => c.id !== convId);
        this.guardarConversaciones(convs);
        let mensajes = this.getMensajes();
        mensajes = mensajes.filter(m => m.conversacionId !== convId);
        this.guardarMensajes(mensajes);
    },

    // --- EXPORT ---
    exportarConversacion(convId, fechaInicio, fechaFin) {
        const mensajes = this.getMensajesConversacion(convId)
            .filter(m => {
                if (fechaInicio && m.fecha < fechaInicio) return false;
                if (fechaFin && m.fecha > fechaFin) return false;
                return true;
            });
        const conv = this.getConversaciones().find(c => c.id === convId);
        if (!conv) return null;
        let csv = 'Fecha,Hora,Remitente,Mensaje,Tipo\n';
        mensajes.forEach(m => {
            const txt = (m.contenido.texto || '').replace(/"/g, '""');
            csv += `${m.fecha},${m.hora},"${m.remitenteNombre}","${txt}",${m.tipo}\n`;
        });
        return csv;
    },

    // --- FORMATING ---
    formatearHora(fecha, hora) {
        return hora || '';
    },

    formatearFechaRelativa(fechaIso) {
        if (!fechaIso) return '';
        const d = new Date(fechaIso);
        const ahora = new Date();
        const diffMs = ahora - d;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHoras = Math.floor(diffMs / 3600000);
        const diffDias = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'Ahora';
        if (diffMin < 60) return `Hace ${diffMin} min`;
        if (diffHoras < 24) return `Hace ${diffHoras} h`;
        if (diffDias < 7) return `Hace ${diffDias} d`;
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    },

    formatearHoraCorta(fechaIso) {
        if (!fechaIso) return '';
        const d = new Date(fechaIso);
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    },

    obtenerEstado(usuarioId) {
        const estados = JSON.parse(localStorage.getItem('eduEstadosUsuarios')) || {};
        const estado = estados[usuarioId];
        if (!estado) return { texto: 'offline', conectado: false, ultimaVez: null };
        const ahora = Date.now();
        const diff = ahora - estado.ultimaVez;
        if (diff < 60000) return { texto: 'En línea', conectado: true, ultimaVez: estado.ultimaVez };
        if (diff < 300000) return { texto: 'Hace unos minutos', conectado: false, ultimaVez: estado.ultimaVez };
        if (diff < 3600000) return { texto: `Hace ${Math.floor(diff / 60000)} min`, conectado: false, ultimaVez: estado.ultimaVez };
        return { texto: `Hace ${Math.floor(diff / 3600000)} h`, conectado: false, ultimaVez: estado.ultimaVez };
    },

    actualizarEstado(usuarioId) {
        const estados = JSON.parse(localStorage.getItem('eduEstadosUsuarios')) || {};
        estados[usuarioId] = { ultimaVez: Date.now() };
        localStorage.setItem('eduEstadosUsuarios', JSON.stringify(estados));
    }
};
