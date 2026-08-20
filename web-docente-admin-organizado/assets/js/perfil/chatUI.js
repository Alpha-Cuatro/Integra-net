const chatUI = {
    conversacionActiva: null,
    avatarBase: './images/',

    avatarPath(userId) {
        const url = PERFILES.obtenerAvatar(userId);
        if (this.esDocente) {
            if (url === './images/avatar.png' || !url) return '../images/avatar.png';
            return url;
        } else {
            if (url === '../images/avatar.png' || !url) return './images/avatar.png';
            return url;
        }
    },

    defaultAvatar() {
        return this.avatarBase + 'avatar.png';
    },
    mensajeContexto: null,
    respondiendoA: null,
    adjuntos: [],
    esDocente: false,
    intervalId: null,

    init() {
        this.esDocente = usuarioActual?.rol === 'docente';
        this.avatarBase = this.esDocente ? '../images/' : './images/';
        this.initTema();
        CHAT.actualizarEstado(usuarioActual?.id);
        this.renderizarConversaciones();
        this.actualizarNotificaciones();
        this.initContactFilters();

        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = setInterval(() => {
            if (document.getElementById('chat')?.classList.contains('active-section')) {
                this.renderizarConversaciones();
                if (this.conversacionActiva) this.cargarMensajes(this.conversacionActiva);
            }
            this.actualizarNotificaciones();
        }, 3000);

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.chat-context-menu') && !e.target.closest('.chat-msg-burbuja') && !e.target.closest('.chat-reaction-picker')) {
                document.getElementById('chatContextMenu').style.display = 'none';
                document.getElementById('chatReactionPicker').style.display = 'none';
            }
        });
    },

    // --- RENDER CONVERSATIONS ---
    renderizarConversaciones(tab) {
        const lista = document.getElementById('listaConversaciones');
        if (!lista) return;
        const convs = CHAT.getConversacionesUsuario(usuarioActual.id, usuarioActual.instituto)
            .filter(c => !c.archivado);

        let filtradas = convs;
        if (tab === 'noLeidos') filtradas = convs.filter(c => (c.noLeidos[usuarioActual.id] || 0) > 0);
        if (tab === 'grupos') filtradas = convs.filter(c => c.tipo === 'grupo');

        if (filtradas.length === 0) {
            lista.innerHTML = `<div class="empty-message" style="padding:30px 16px">
                <i class="fa-solid fa-comments" style="font-size:2rem;color:var(--border);display:block;margin-bottom:10px"></i>
                <p style="font-size:0.85rem">${tab === 'grupos' ? 'No hay grupos aún' : tab === 'noLeidos' ? 'No hay mensajes sin leer' : 'No tienes conversaciones aún'}</p>
            </div>`;
            return;
        }

        lista.innerHTML = filtradas.map(c => {
            const esGrupo = c.tipo === 'grupo';
            const noLeidos = c.noLeidos[usuarioActual.id] || 0;
            const convName = esGrupo ? (c.nombre || 'Grupo') : (c.nombres[Object.keys(c.nombres).find(k => k != usuarioActual.id)] || 'Usuario');
            const ultimo = c.ultimoMensaje || 'Sin mensajes';
            const fecha = c.ultimaFecha ? CHAT.formatearFechaRelativa(c.ultimaFecha) : '';
            const hora = c.ultimaFecha ? CHAT.formatearHoraCorta(c.ultimaFecha) : '';
            const avatarUrl = esGrupo ? (c.foto || '') : chatUI.avatarPath(Object.keys(c.nombres).find(k => k != usuarioActual.id));
            const activa = c.id === this.conversacionActiva;
            const fijado = c.fijado;
            const silenciado = c.silenciado;
            const muted = c.silenciado && (!c.silenciadoHasta || new Date(c.silenciadoHasta) > new Date());

            let avatarHtml;
            if (esGrupo) {
                avatarHtml = `<div class="chat-avatar-grupo"><i class="fa-solid fa-users"></i></div>`;
            } else if (avatarUrl) {
                avatarHtml = `<img src="${avatarUrl}" onerror="this.src='${chatUI.defaultAvatar()}'" alt="">`;
            } else {
                avatarHtml = `<img src="${chatUI.defaultAvatar()}" alt="">`;
            }

            let onlineDot = '';
            if (!esGrupo) {
                const otroId = parseInt(Object.keys(c.nombres).find(k => k != usuarioActual.id));
                const estado = CHAT.obtenerEstado(otroId);
                if (estado.conectado) onlineDot = '<span class="chat-avatar-online"></span>';
            }

            const rolBadge = !esGrupo ? (() => {
                const otroId = Object.keys(c.nombres).find(k => k != usuarioActual.id);
                const u = CHAT.getUsuario(parseInt(otroId));
                if (!u) return '';
                return u.rol === 'docente' ? '<span class="chat-rol-badge chat-rol-docente">Docente</span>' :
                    u.rol === 'estudiante' ? '<span class="chat-rol-badge chat-rol-estudiante">Alumno</span>' : '';
            })() : '';

            return `<div class="chat-conv-item ${activa ? 'active' : ''} ${c.archivado ? 'chat-conv-item-archived' : ''}"
                        onclick="chatUI.abrirConversacion('${c.id}')" data-conv-id="${c.id}">
                <div class="chat-conv-avatar">
                    ${avatarHtml}
                    ${onlineDot}
                </div>
                <div class="chat-conv-info">
                    <div class="chat-conv-nombre">
                        ${convName}
                        ${rolBadge}
                        ${muted ? '<i class="fa-solid fa-bell-slash chat-silenciado"></i>' : ''}
                        ${fijado ? '<i class="fa-solid fa-thumbtack chat-conv-fijado"></i>' : ''}
                    </div>
                    <div class="chat-conv-ultimo">${ultimo.length > 50 ? ultimo.slice(0, 50) + '...' : ultimo}</div>
                </div>
                <div class="chat-conv-meta">
                    <span class="chat-conv-hora">${hora || fecha}</span>
                    ${noLeidos > 0 ? `<span class="chat-conv-no-leidos">${noLeidos > 99 ? '99+' : noLeidos}</span>` : ''}
                </div>
            </div>`;
        }).join('');
    },

    // --- OPEN CONVERSATION ---
    abrirConversacion(convId) {
        this.conversacionActiva = convId;
        CHAT.limpiarSuspensionesExpiradas();
        CHAT.marcarComoLeido(convId, usuarioActual.id);
        this.renderizarConversaciones();
        this.actualizarNotificaciones();

        const convs = CHAT.getConversaciones();
        const conv = convs.find(c => c.id === convId);
        if (!conv) return;

        const esGrupo = conv.tipo === 'grupo';
        const otro = CHAT.getOtroParticipante(conv, usuarioActual.id);

        document.getElementById('chatPlaceholder').style.display = 'none';
        document.getElementById('chatConversacion').style.display = 'flex';

        const avatarUrl = !esGrupo ? chatUI.avatarPath(otro.id) : (conv.foto || '');
        document.getElementById('chatAvatar').src = avatarUrl || chatUI.defaultAvatar();
        document.getElementById('chatContactoNombre').textContent = conv.nombre || otro.nombre;

        const grupoInfoBtn = document.getElementById('chatBtnGrupoInfo');
        if (esGrupo) {
            grupoInfoBtn.style.display = 'flex';
            const grupo = CHAT.getGruposChat().find(g => g.id === convId);
            const miembrosActivos = grupo ? grupo.miembros.filter(m => !m.suspendido || (m.suspendidoHasta && new Date(m.suspendidoHasta) < new Date())).length : 0;
            document.getElementById('chatContactoStatus').textContent = `${miembrosActivos} miembros`;
        } else {
            grupoInfoBtn.style.display = 'none';
            const u = CHAT.getUsuario(otro.id);
            const estado = CHAT.obtenerEstado(otro.id);
            document.getElementById('chatContactoStatus').textContent = u ? (estado.texto) : '...';
            const dot = document.getElementById('chatOnlineDot');
            dot.style.display = estado.conectado ? 'block' : 'none';
        }

        this.cargarMensajes(convId);

        if (conv.fondo) {
            const mensajesArea = document.getElementById('chatMensajes');
            mensajesArea.style.background = conv.fondo;
            mensajesArea.style.backgroundSize = 'cover';
        } else {
            document.getElementById('chatMensajes').style.background = '';
        }
        if (conv.colorBurbujas) {
            document.documentElement.style.setProperty('--chat-bubble-color', conv.colorBurbujas);
            document.documentElement.style.setProperty('--chat-bubble-color-light', conv.colorBurbujas + '20');
        } else {
            document.documentElement.style.removeProperty('--chat-bubble-color');
            document.documentElement.style.removeProperty('--chat-bubble-color-light');
        }

        if (window.innerWidth < 1024) {
            document.getElementById('chatSidebar').classList.add('hidden');
            document.getElementById('chatMainPanel').classList.add('open');
            document.body.classList.add('chat-conversacion-open');
        }
    },

    cerrarConversacion() {
        this.conversacionActiva = null;
        document.getElementById('chatPlaceholder').style.display = 'flex';
        document.getElementById('chatConversacion').style.display = 'none';
        if (window.innerWidth < 1024) {
            document.getElementById('chatSidebar').classList.remove('hidden');
            document.getElementById('chatMainPanel').classList.remove('open');
            document.body.classList.remove('chat-conversacion-open');
        }
        this.cancelarRespuesta();
    },

    // --- SEND MESSAGE ---
    enviarMensaje() {
        const input = document.getElementById('chatInput');
        const texto = input.value.trim();
        if (!texto && this.adjuntos.length === 0) return;
        if (!this.conversacionActiva) return;

        const conv = CHAT.getConversaciones().find(c => c.id === this.conversacionActiva);
        if (!conv) return;

        if (conv.tipo === 'grupo') {
            const grupo = CHAT.getGruposChat().find(g => g.id === this.conversacionActiva);
            if (grupo) {
                if (CHAT.miembroEstaSuspendido(this.conversacionActiva, usuarioActual.id)) {
                    PERFILES.mostrarToast('Has sido suspendido en este grupo', 'error');
                    return;
                }
                if (grupo.cerrado) { PERFILES.mostrarToast('El grupo está cerrado', 'error'); return; }
                if (grupo.soloAnuncios) {
                    const miembro = grupo.miembros.find(m => m.id === usuarioActual.id);
                    if (miembro?.rol !== 'docente') { PERFILES.mostrarToast('Solo el docente puede enviar mensajes', 'error'); return; }
                }
            }
        }

        const datos = {
            tipo: 'texto',
            contenido: { texto },
            respondeA: this.respondiendoA || null,
            reenviado: false
        };

        CHAT.enviarMensaje(usuarioActual, this.conversacionActiva, datos);
        input.value = '';
        this.adjuntos = [];
        this.cancelarRespuesta();
        document.getElementById('chatInputAdjuntos').style.display = 'none';
        this.cargarMensajes(this.conversacionActiva);
        this.renderizarConversaciones();
        this.onInputChange();
    },

    onInputChange() {
        const input = document.getElementById('chatInput');
        const btn = document.getElementById('chatBtnSend');
        const hasContent = input.value.trim() || this.adjuntos.length > 0;
        btn.disabled = !hasContent;
        btn.classList.toggle('has-content', hasContent);
    },

    // --- LOAD MESSAGES ---
    cargarMensajes(convId) {
        const container = document.getElementById('chatMensajes');
        const userId = usuarioActual.id;
        const mensajes = CHAT.getMensajesConversacion(convId)
            .filter(m => !(m.eliminadoPara && m.eliminadoPara.includes(userId)));

        if (mensajes.length === 0) {
            container.innerHTML = `<div class="chat-msg chat-msg-sistema" style="animation-delay:0.1s"><div class="chat-msg-burbuja">No hay mensajes aún. ¡Envía el primero!</div></div>`;
            return;
        }

        const estabaAbajo = container.scrollTop + container.clientHeight >= container.scrollHeight - 60;
        container.innerHTML = mensajes.map((m, i) => {
            const html = this.renderizarMensaje(m, userId);
            const delay = Math.min(i * 15, 300);
            return html.replace('class="chat-msg', `style="animation-delay:${delay}ms" class="chat-msg`);
        }).join('');
        requestAnimationFrame(() => {
            if (estabaAbajo) container.scrollTop = container.scrollHeight;
        });
    },

    renderizarMensaje(m, userId) {
        const esMio = m.remitenteId === userId;
        const esSistema = m.tipo === 'sistema';
        const eliminado = m.eliminadoParaTodos;

        if (eliminado) {
            return `<div class="chat-msg ${esMio ? 'chat-msg-propio' : 'chat-msg-otro'}">
                <div class="chat-msg-burbuja" style="background:${esMio ? 'rgba(86,5,145,0.3)' : 'var(--bg-alt)'};font-style:italic;opacity:0.6">
                    <span style="font-size:0.8rem">Este mensaje fue eliminado</span>
                </div>
            </div>`;
        }

        if (esSistema) {
            return `<div class="chat-msg chat-msg-sistema"><div class="chat-msg-burbuja">${m.contenido?.texto || ''}</div></div>`;
        }

        const estadoIcono = m.estado === 'leido' ? 'fa-check-double' : m.estado === 'entregado' ? 'fa-check-double' : 'fa-check';
        const estadoColor = m.estado === 'leido' ? '#D8A1FF' : m.estado === 'entregado' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.6)';
        const estadoClass = m.estado || 'enviado';

        let contenidoHtml = '';
        switch (m.tipo) {
            case 'texto':
                contenidoHtml = `<div class="chat-msg-texto">${PERFILES.escapeHtml(m.contenido?.texto || '')}</div>`;
                break;
            case 'imagen':
                contenidoHtml = `<img src="${m.contenido?.archivo?.url || ''}" class="chat-msg-imagen" alt="Imagen" onclick="window.open(this.src)">`;
                break;
            case 'video':
                contenidoHtml = `<video src="${m.contenido?.archivo?.url || ''}" class="chat-msg-video" controls preload="metadata" style="max-width:280px;max-height:300px;border-radius:12px;display:block"></video>`;
                break;
            case 'documento':
                const docIcon = m.contenido?.archivo?.nombre?.match(/\.pdf$/i) ? 'fa-file-pdf' :
                    m.contenido?.archivo?.nombre?.match(/\.(doc|docx)$/i) ? 'fa-file-word' :
                    m.contenido?.archivo?.nombre?.match(/\.(xls|xlsx)$/i) ? 'fa-file-excel' :
                    m.contenido?.archivo?.nombre?.match(/\.(zip|rar)$/i) ? 'fa-file-zipper' : 'fa-file';
                const docColor = m.contenido?.archivo?.nombre?.match(/\.pdf$/i) ? '#B02B44' :
                    m.contenido?.archivo?.nombre?.match(/\.(doc|docx)$/i) ? '#560591' :
                    m.contenido?.archivo?.nombre?.match(/\.(xls|xlsx)$/i) ? '#10b981' : '#7A10C0';
                contenidoHtml = `<div class="chat-msg-archivo">
                    <div class="archivo-icono" style="background:${docColor}15;color:${docColor}"><i class="fa-solid ${docIcon}"></i></div>
                    <div class="archivo-info">
                        <div class="archivo-nombre">${PERFILES.escapeHtml(m.contenido?.archivo?.nombre || 'Documento')}</div>
                        <div class="archivo-tamano">${m.contenido?.archivo?.tamaño || ''}</div>
                    </div>
                </div>`;
                break;
            case 'encuesta':
                contenidoHtml = this.renderizarEncuestaEnMensaje(m);
                break;
            case 'ubicacion':
                contenidoHtml = `<div class="chat-msg-ubicacion"><i class="fa-solid fa-location-dot"></i><span>${PERFILES.escapeHtml(m.contenido?.ubicacion?.nombre || 'Ubicación')}</span></div>`;
                break;
            case 'contacto':
                contenidoHtml = `<div class="chat-msg-archivo"><div class="archivo-icono" style="background:#F0E6F7;color:#560591"><i class="fa-solid fa-user"></i></div><div><div class="archivo-nombre">${PERFILES.escapeHtml(m.contenido?.contacto?.nombre || '')}</div></div></div>`;
                break;
            case 'audio':
                contenidoHtml = `<div class="chat-msg-archivo"><div class="archivo-icono" style="background:#F0E6F7;color:#B02B44"><i class="fa-solid fa-headphones"></i></div><div><div class="archivo-nombre">🎵 Audio</div></div></div>`;
                break;
            default:
                contenidoHtml = `<div class="chat-msg-texto">${PERFILES.escapeHtml(m.contenido?.texto || '')}</div>`;
        }

        let replyHtml = '';
        if (m.respondeA) {
            replyHtml = `<div class="chat-msg-reply">
                <span class="chat-msg-reply-nombre">${PERFILES.escapeHtml(m.respondeA.remitenteNombre || '')}</span>
                <span class="chat-msg-reply-texto">${PERFILES.escapeHtml(m.respondeA.texto || '')}</span>
            </div>`;
        }

        let reaccionesHtml = '';
        if (m.reacciones && m.reacciones.length > 0) {
            const agrupadas = {};
            m.reacciones.forEach(r => {
                if (!agrupadas[r.emoji]) agrupadas[r.emoji] = [];
                agrupadas[r.emoji].push(r.usuarioId);
            });
            reaccionesHtml = `<div class="chat-msg-reacciones">` +
                Object.entries(agrupadas).map(([emoji, usuarios]) => {
                    const esMia = usuarios.includes(userId);
                    return `<span class="chat-msg-reaccion ${esMia ? 'mia' : ''}" onclick="chatUI.reaccionarMensaje('${m.id}','${emoji}')">${emoji} <span class="reaccion-count">${usuarios.length}</span></span>`;
                }).join('') + `</div>`;
        }

        const editadoHtml = m.editado ? '<span class="chat-msg-editado">editado</span>' : '';
        const remitenteHtml = !esMio ? `<div style="font-size:0.7rem;font-weight:600;color:var(--primary);margin-bottom:2px">${PERFILES.escapeHtml(m.remitenteNombre)}</div>` : '';

        return `<div class="chat-msg ${esMio ? 'chat-msg-propio' : 'chat-msg-otro'}" data-msg-id="${m.id}">
            <div class="chat-msg-burbuja" oncontextmenu="event.preventDefault();chatUI.mostrarContextMenu(event,'${m.id}')" ondblclick="chatUI.reaccionarMensaje('${m.id}','👍')">
                ${remitenteHtml}
                ${replyHtml}
                ${contenidoHtml}
                ${reaccionesHtml}
                <div class="chat-msg-meta">
                    <span class="chat-msg-hora">${m.hora}</span>
                    ${editadoHtml}
                    ${esMio ? `<i class="fa-solid ${estadoIcono} chat-msg-estado ${estadoClass}" style="color:${estadoColor};font-size:0.6rem;margin-left:2px"></i>` : ''}
                </div>
            </div>
        </div>`;
    },

    renderizarEncuestaEnMensaje(m) {
        const encuestaId = m.contenido?.encuestaId;
        const encuestas = CHAT.getEncuestas();
        const enc = encuestas.find(e => e.id === encuestaId);
        if (!enc) return `<div class="chat-msg-texto">📊 ${PERFILES.escapeHtml(m.contenido?.pregunta || 'Encuesta')}</div>`;

        const totalVotos = enc.opciones.reduce((s, o) => s + o.votos.length, 0);
        const yaVoto = enc.opciones.some(o => o.votos.includes(usuarioActual.id));
        const activa = enc.activa;

        return `<div class="chat-encuesta-card">
            <div class="chat-encuesta-pregunta">📊 ${PERFILES.escapeHtml(enc.pregunta)}</div>
            ${enc.opciones.map(o => {
                const pct = totalVotos > 0 ? Math.round((o.votos.length / totalVotos) * 100) : 0;
                const votado = o.votos.includes(usuarioActual.id);
                return `<div class="chat-encuesta-opcion ${votado ? 'votada' : ''}" onclick="chatUI.votar('${enc.id}','${o.id}')">
                    <div class="encuesta-barra" style="width:${pct}%"></div>
                    <span class="encuesta-texto">${PERFILES.escapeHtml(o.texto)}</span>
                    <span class="encuesta-pct">${pct}%</span>
                </div>`;
            }).join('')}
            <div class="chat-encuesta-total">${totalVotos} votos${!activa ? ' · Cerrada' : ''}</div>
        </div>`;
    },

    votar(encuestaId, opcionId) {
        if (CHAT.votarEncuesta(encuestaId, opcionId, usuarioActual.id)) {
            this.cargarMensajes(this.conversacionActiva);
        }
    },

    // --- CONTEXT MENU ---
    mostrarContextMenu(e, msgId) {
        e.preventDefault();
        this.mensajeContexto = msgId;
        const mensajes = CHAT.getMensajes();
        const msg = mensajes.find(m => m.id === msgId);
        if (!msg) return;

        const esMio = msg.remitenteId === usuarioActual.id;
        const conv = CHAT.getConversaciones().find(c => c.id === this.conversacionActiva);
        const esGrupo = conv?.tipo === 'grupo';
        const esDocente = usuarioActual.rol === 'docente';

        const menu = document.getElementById('chatContextMenu');
        let items = [];

        items.push({ icon: 'fa-reply', text: 'Responder', action: `chatUI.iniciarRespuesta('${msgId}')` });
        items.push({ icon: 'fa-face-smile', text: 'Reaccionar', action: `chatUI.mostrarReactionPicker(event,'${msgId}')` });

        if (esMio && msg.tipo === 'texto') {
            items.push({ icon: 'fa-pen', text: 'Editar', action: `chatUI.editarMensaje('${msgId}')` });
        }

        items.push({ icon: 'fa-copy', text: 'Copiar', action: `chatUI.copiarMensaje('${msgId}')` });
        items.push({ icon: 'fa-share', text: 'Reenviar', action: `chatUI.reenviarMensaje('${msgId}')` });
        items.push({ icon: 'fa-eye', text: 'Ver leído por', action: `chatUI.verLeidoPor('${msgId}')` });

        if (esMio) {
            items.push(null);
            items.push({ icon: 'fa-trash-can', text: 'Eliminar para mí', action: `chatUI.eliminarParaMi('${msgId}')`, danger: true });
            items.push({ icon: 'fa-trash', text: 'Eliminar para todos', action: `chatUI.eliminarParaTodos('${msgId}')`, danger: true });
        }

        if (esDocente && esGrupo) {
            items.push(null);
            items.push({ icon: 'fa-star', text: msg.destacado ? 'Quitar destacado' : 'Destacar', action: `chatUI.destacarMensaje('${msgId}')` });
        }

        menu.innerHTML = items.map(item => {
            if (!item) return '<div class="chat-context-divider"></div>';
            return `<button class="chat-context-item ${item.danger ? 'danger' : ''}" onclick="${item.action}">
                <i class="fa-solid ${item.icon}"></i> ${item.text}
            </button>`;
        }).join('');

        let x = e.clientX || e.pageX;
        let y = e.clientY || e.pageY;
        if (x + 200 > window.innerWidth) x = window.innerWidth - 210;
        if (y + 40 * items.length > window.innerHeight) y = window.innerHeight - 40 * items.length - 10;
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.display = 'block';
    },

    iniciarRespuesta(msgId) {
        const mensajes = CHAT.getMensajes();
        const msg = mensajes.find(m => m.id === msgId);
        if (!msg) return;
        this.respondiendoA = { id: msg.id, remitenteNombre: msg.remitenteNombre, texto: msg.contenido?.texto || '' };
        document.getElementById('chatReplyPreview').style.display = 'block';
        document.getElementById('chatReplyNombre').textContent = msg.remitenteNombre;
        document.getElementById('chatReplyTexto').textContent = msg.contenido?.texto || '';
        document.getElementById('chatContextMenu').style.display = 'none';
        document.getElementById('chatInput').focus();
    },

    cancelarRespuesta() {
        this.respondiendoA = null;
        document.getElementById('chatReplyPreview').style.display = 'none';
    },

    mostrarReactionPicker(e, msgId) {
        this.mensajeContexto = msgId;
        const picker = document.getElementById('chatReactionPicker');
        let x = e.clientX || e.pageX;
        let y = e.clientY || e.pageY;
        if (x + 300 > window.innerWidth) x = window.innerWidth - 320;
        if (y - 60 < 0) y = 60;
        picker.style.left = x + 'px';
        picker.style.top = (y - 50) + 'px';
        picker.style.display = 'flex';
        document.getElementById('chatContextMenu').style.display = 'none';
    },

    reaccionar(emoji) {
        if (this.mensajeContexto) {
            this.reaccionarMensaje(this.mensajeContexto, emoji);
        }
        document.getElementById('chatReactionPicker').style.display = 'none';
    },

    reaccionarMensaje(msgId, emoji) {
        CHAT.reaccionar(msgId, usuarioActual.id, usuarioActual.nombre, emoji);
        this.cargarMensajes(this.conversacionActiva);
    },

    copiarMensaje(msgId) {
        const mensajes = CHAT.getMensajes();
        const msg = mensajes.find(m => m.id === msgId);
        if (msg?.contenido?.texto) {
            navigator.clipboard.writeText(msg.contenido.texto).then(() => {
                PERFILES.mostrarToast('Mensaje copiado', 'success');
            });
        }
        document.getElementById('chatContextMenu').style.display = 'none';
    },

    editarMensaje(msgId) {
        const mensajes = CHAT.getMensajes();
        const msg = mensajes.find(m => m.id === msgId);
        if (!msg) return;
        document.getElementById('chatContextMenu').style.display = 'none';
        const overlay = document.createElement('div');
        overlay.className = 'chat-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="chat-modal" style="max-width:400px" onclick="event.stopPropagation()">
                <div class="chat-modal-header">
                    <h3><i class="fa-solid fa-pen"></i> Editar mensaje</h3>
                    <button class="chat-btn-icon" onclick="this.closest('.chat-modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div style="padding:16px">
                    <textarea id="editMsgText" class="chat-input-full" rows="3" style="resize:none">${PERFILES.escapeHtml(msg.contenido?.texto || '')}</textarea>
                    <button class="chat-btn-primary" onclick="chatUI.confirmarEditar('${msgId}')" style="margin-top:8px;width:100%"><i class="fa-solid fa-check"></i> Guardar</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        setTimeout(() => document.getElementById('editMsgText')?.focus(), 100);
    },

    confirmarEditar(msgId) {
        const nuevoTexto = document.getElementById('editMsgText')?.value?.trim();
        if (!nuevoTexto) { PERFILES.mostrarToast('El mensaje no puede estar vacío', 'error'); return; }
        CHAT.editarMensaje(msgId, nuevoTexto);
        this.cargarMensajes(this.conversacionActiva);
        document.querySelector('.chat-modal-overlay')?.remove();
        PERFILES.mostrarToast('Mensaje editado', 'success');
    },

    eliminarParaMi(msgId) {
        const overlay = document.createElement('div');
        overlay.className = 'chat-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="chat-modal" style="max-width:320px" onclick="event.stopPropagation()">
                <div class="chat-modal-header"><h3><i class="fa-solid fa-trash-can"></i> Eliminar mensaje</h3></div>
                <div style="padding:20px;text-align:center">
                    <p style="margin-bottom:16px;color:var(--text-secondary)">¿Eliminar este mensaje para ti?</p>
                    <div style="display:flex;gap:8px">
                        <button class="chat-btn-primary" style="background:#454546;flex:1" onclick="this.closest('.chat-modal-overlay').remove()">Cancelar</button>
                        <button class="chat-btn-primary" style="background:var(--danger);flex:1" onclick="chatUI.confirmarEliminarParaMi('${msgId}')">Eliminar</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    },

    confirmarEliminarParaMi(msgId) {
        CHAT.eliminarParaMi(msgId, usuarioActual.id);
        this.cargarMensajes(this.conversacionActiva);
        document.querySelector('.chat-modal-overlay')?.remove();
        document.getElementById('chatContextMenu').style.display = 'none';
        PERFILES.mostrarToast('Mensaje eliminado', 'success');
    },

    eliminarParaTodos(msgId) {
        const overlay = document.createElement('div');
        overlay.className = 'chat-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="chat-modal" style="max-width:320px" onclick="event.stopPropagation()">
                <div class="chat-modal-header"><h3><i class="fa-solid fa-trash"></i> Eliminar para todos</h3></div>
                <div style="padding:20px;text-align:center">
                    <p style="margin-bottom:16px;color:var(--text-secondary)">¿Eliminar este mensaje para todos los participantes?</p>
                    <div style="display:flex;gap:8px">
                        <button class="chat-btn-primary" style="background:#454546;flex:1" onclick="this.closest('.chat-modal-overlay').remove()">Cancelar</button>
                        <button class="chat-btn-primary" style="background:var(--danger);flex:1" onclick="chatUI.confirmarEliminarParaTodos('${msgId}')">Eliminar</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    },

    confirmarEliminarParaTodos(msgId) {
        CHAT.eliminarParaTodos(msgId, usuarioActual.id);
        this.cargarMensajes(this.conversacionActiva);
        document.querySelector('.chat-modal-overlay')?.remove();
        document.getElementById('chatContextMenu').style.display = 'none';
        PERFILES.mostrarToast('Mensaje eliminado para todos', 'success');
    },

    destacarMensaje(msgId) {
        CHAT.destacarMensaje(msgId);
        this.cargarMensajes(this.conversacionActiva);
        document.getElementById('chatContextMenu').style.display = 'none';
    },

    verLeidoPor(msgId) {
        document.getElementById('chatContextMenu').style.display = 'none';
        const lectores = CHAT.getLeidoPorMensaje(msgId);
        if (lectores.length === 0) {
            PERFILES.mostrarToast('Nadie ha leído este mensaje aún', 'info');
            return;
        }
        const msgHtml = lectores.map(l =>
            `<div style="display:flex;align-items:center;gap:10px;padding:6px 0">
                <img src="${this.avatarPath(l.usuarioId)}" onerror="this.src='${this.defaultAvatar()}'" style="width:32px;height:32px;border-radius:50%">
                <div><div style="font-weight:600;font-size:0.85rem">${PERFILES.escapeHtml(l.usuarioNombre)}</div>
                <div style="font-size:0.75rem;color:var(--text-tertiary)">${l.fecha ? CHAT.formatearFechaRelativa(l.fecha) : ''}</div></div>
            </div>`
        ).join('');
        const overlay = document.createElement('div');
        overlay.className = 'chat-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="chat-modal" style="max-width:320px" onclick="event.stopPropagation()">
                <div class="chat-modal-header">
                    <h3><i class="fa-solid fa-eye"></i> Leído por (${lectores.length})</h3>
                    <button class="chat-btn-icon" onclick="this.closest('.chat-modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div style="padding:12px 16px">${msgHtml}</div>
            </div>`;
        document.body.appendChild(overlay);
    },

    reenviarMensaje(msgId) {
        document.getElementById('chatContextMenu').style.display = 'none';
        PERFILES.mostrarToast('Selecciona un chat para reenviar', 'info');
    },

    // --- TABS & FILTERS ---
    cambiarTab(btn) {
        document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        this.renderizarConversaciones(btn.dataset.tab);
    },

    filtrarConversaciones(query) {
        const items = document.querySelectorAll('.chat-conv-item');
        const q = query?.toLowerCase() || '';
        items.forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(q) ? 'flex' : 'none';
        });
    },

    // --- NOTIFICATIONS ---
    actualizarNotificaciones() {
        const noLeidos = CHAT.getTotalNoLeidos(usuarioActual.id);
        ['chatNotifSidebar', 'chatNotifBadge'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (noLeidos > 0) { el.style.display = 'inline'; el.textContent = noLeidos > 99 ? '99+' : noLeidos; }
                else el.style.display = 'none';
            }
        });
    },

    // --- CONTACTS (NEW CHAT) ---
    mostrarNuevoContacto() {
        const modal = document.getElementById('modalNuevoContacto');
        modal.style.display = 'flex';
        const header = modal.querySelector('.chat-modal-header h3');
        if (header) header.innerHTML = '<i class="fa-solid fa-user-plus"></i> Nuevo mensaje';
        const btnContainer = modal.querySelector('.chat-modal-header');
        if (btnContainer) {
            let groupBtn = btnContainer.querySelector('#btnCrearGrupoChat');
            if (!groupBtn && this.esDocente) {
                groupBtn = document.createElement('button');
                groupBtn.id = 'btnCrearGrupoChat';
                groupBtn.className = 'chat-btn-icon';
                groupBtn.title = 'Crear grupo';
                groupBtn.innerHTML = '<i class="fa-solid fa-users-gear"></i>';
                groupBtn.onclick = () => this.mostrarCrearGrupoChat();
                btnContainer.insertBefore(groupBtn, btnContainer.lastElementChild);
            }
        }
        this.renderizarContactos();
    },

    mostrarCrearGrupoChat() {
        this.cerrarModal('modalNuevoContacto');
        const estudiantes = CHAT.getEstudiantesPorInstituto(usuarioActual.instituto);
        const checks = estudiantes.map(e =>
            `<label class="chat-contacto-item" style="cursor:pointer;display:flex;align-items:center;gap:10px;padding:8px 12px">
                <input type="checkbox" value="${e.id}" style="width:18px;height:18px">
                <img src="${this.avatarPath(e.id)}" onerror="this.src='${this.defaultAvatar()}'" style="width:36px;height:36px;border-radius:50%">
                <div><div style="font-weight:600;font-size:0.85rem">${PERFILES.escapeHtml(e.nombre)}</div><div style="font-size:0.75rem;color:var(--text-tertiary)">${e.grado || ''} - ${e.seccion || ''}</div></div>
            </label>`
        ).join('');

        const overlay = document.createElement('div');
        overlay.className = 'chat-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="chat-modal chat-modal-lg" style="max-width:450px" onclick="event.stopPropagation()">
                <div class="chat-modal-header">
                    <h3><i class="fa-solid fa-users-gear"></i> Crear grupo de chat</h3>
                    <button class="chat-btn-icon" onclick="this.closest('.chat-modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div style="padding:12px 16px">
                    <input type="text" id="nuevoGrupoNombre" placeholder="Nombre del grupo" class="chat-input-full" style="margin-bottom:8px">
                    <textarea id="nuevoGrupoDesc" class="chat-input-full" placeholder="Descripción (opcional)" rows="2" style="margin-bottom:8px;resize:none"></textarea>
                    <div style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin:8px 0"><i class="fa-solid fa-users"></i> Seleccionar alumnos</div>
                    <div style="max-height:250px;overflow-y:auto;margin-bottom:12px">${checks || '<p style="color:var(--text-tertiary)">No hay alumnos disponibles</p>'}</div>
                    <button class="chat-btn-primary" onclick="chatUI.confirmarCrearGrupoChat()" style="width:100%"><i class="fa-solid fa-check"></i> Crear grupo</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    },

    confirmarCrearGrupoChat() {
        const nombre = document.getElementById('nuevoGrupoNombre')?.value?.trim();
        if (!nombre) { PERFILES.mostrarToast('Escribe un nombre para el grupo', 'error'); return; }
        const desc = document.getElementById('nuevoGrupoDesc')?.value?.trim() || '';
        const checks = document.querySelectorAll('.chat-modal-overlay input[type=checkbox]:checked');
        const ids = Array.from(checks).map(c => parseInt(c.value));
        const overlay = document.querySelector('.chat-modal-overlay');
        if (overlay) overlay.remove();
        this.crearGrupoChat({ nombre, descripcion: desc, estudiantes: ids });
    },

    renderizarContactos(filtroTexto) {
        const lista = document.getElementById('listaContactos');
        let contactos;
        if (this.esDocente) {
            contactos = CHAT.getEstudiantesPorInstituto(usuarioActual.instituto);
        } else {
            contactos = CHAT.getDocentesPorInstituto(usuarioActual.instituto);
        }

        if (filtroTexto) {
            const q = filtroTexto.toLowerCase();
            contactos = contactos.filter(c => c.nombre.toLowerCase().includes(q));
        }

        const gradoFiltro = document.getElementById('filtroGradoContacto')?.value;
        const seccionFiltro = document.getElementById('filtroSeccionContacto')?.value;
        if (gradoFiltro) contactos = contactos.filter(c => c.grado === gradoFiltro);
        if (seccionFiltro) contactos = contactos.filter(c => c.seccion === seccionFiltro);

        if (contactos.length === 0) {
            lista.innerHTML = '<div class="empty-message" style="padding:30px"><p>No hay contactos disponibles</p></div>';
            return;
        }

        lista.innerHTML = contactos.map(c => {
            const yaTieneConv = CHAT.getConversaciones().some(conv =>
                conv.participantes.includes(usuarioActual.id) && conv.participantes.includes(c.id) && conv.instituto === usuarioActual.instituto
            );
            return `<div class="chat-contacto-item" onclick="chatUI.iniciarChatCon(${c.id},'${PERFILES.escapeHtml(c.nombre)}')">
                <img src="${chatUI.avatarPath(c.id)}" onerror="this.src=chatUI.defaultAvatar()">
                <div class="contacto-info">
                    <div class="contacto-nombre">${PERFILES.escapeHtml(c.nombre)}</div>
                    <div class="contacto-detalle">${c.grado ? `${c.grado} - Sección ${c.seccion || ''}` : (c.especialidad || c.rol || '')}</div>
                </div>
                ${yaTieneConv ? '<i class="fa-solid fa-comment-dots contacto-check"></i>' : '<i class="fa-solid fa-circle-plus contacto-check"></i>'}
            </div>`;
        }).join('');
    },

    iniciarChatCon(contactoId, contactoNombre) {
        const usuarios = JSON.parse(localStorage.getItem('eduUsuarios')) || [];
        const contacto = usuarios.find(u => u.id === contactoId);
        if (!contacto || contacto.instituto !== usuarioActual.instituto) {
            PERFILES.mostrarToast('No puedes chatear con este usuario', 'error');
            return;
        }
        const conv = CHAT.crearConversacionIndividual(usuarioActual, contacto, usuarioActual.instituto);
        this.cerrarModal('modalNuevoContacto');
        setTimeout(() => this.abrirConversacion(conv.id), 200);
    },

    filtrarContactos(texto) {
        this.renderizarContactos(texto || document.getElementById('buscarContactos')?.value);
    },

    initContactFilters() {
        const gradoSelect = document.getElementById('filtroGradoContacto');
        if (!gradoSelect) return;
        const grados = ['7mo', '8vo', '9no', '10mo', '11vo'];
        gradoSelect.innerHTML = '<option value="">Todos los grados</option>' + grados.map(g => `<option value="${g}">${g}</option>`).join('');

        gradoSelect.onchange = () => this.filtrarContactos();
        document.getElementById('filtroSeccionContacto').onchange = () => this.filtrarContactos();
    },

    // --- GROUP INFO ---
    abrirInfoGrupo() {
        if (!this.conversacionActiva) return;
        const conv = CHAT.getConversaciones().find(c => c.id === this.conversacionActiva);
        if (!conv || conv.tipo !== 'grupo') return;
        const grupo = CHAT.getGruposChat().find(g => g.id === this.conversacionActiva);
        if (!grupo) return;

        const miembroActual = grupo.miembros.find(m => m.id === usuarioActual.id);
        const esAdmin = miembroActual?.esAdmin || usuarioActual.rol === 'docente';

        const content = document.getElementById('infoGrupoContent');
        content.innerHTML = `
            <div class="chat-info-header">
                <img src="${conv.foto || chatUI.defaultAvatar()}" onerror="this.src=chatUI.defaultAvatar()">
                <div class="info-grupo-nombre">${PERFILES.escapeHtml(grupo.nombre)}</div>
                <div class="info-grupo-desc">${PERFILES.escapeHtml(grupo.descripcion || 'Sin descripción')}</div>
                <div class="info-grupo-codigo" onclick="navigator.clipboard.writeText('${grupo.codigo}');PERFILES.mostrarToast('Código copiado','success')">${grupo.codigo}</div>
            </div>
            <div class="chat-info-detalle">
                <div class="detalle-row"><span class="label">Creador</span><span class="value">${PERFILES.escapeHtml(grupo.docenteCreador?.nombre || '')}</span></div>
                <div class="detalle-row"><span class="label">Miembros</span><span class="value">${grupo.miembros.length}</span></div>
                <div class="detalle-row"><span class="label">Creación</span><span class="value">${grupo.fechaCreacion || ''}</span></div>
                <div class="detalle-row"><span class="label">Estado</span><span class="value">${grupo.cerrado ? '🔴 Cerrado' : '🟢 Abierto'}</span></div>
            </div>
            <div class="chat-info-miembros-titulo"><i class="fa-solid fa-users"></i> Miembros (${grupo.miembros.length})</div>
            <div id="listaMiembrosGrupo">
                ${grupo.miembros.map(m => {
                    const estaSuspendido = m.suspendido && (!m.suspendidoHasta || new Date(m.suspendidoHasta) > new Date());
                    return `<div class="chat-miembro-item" onclick="chatUI.abrirPerfilMiembro('${grupo.id}',${m.id})">
                        <img src="${chatUI.avatarPath(m.id)}" onerror="this.src=chatUI.defaultAvatar()">
                        <div class="miembro-info">
                            <div class="miembro-nombre">${PERFILES.escapeHtml(m.nombre)}</div>
                            <div class="miembro-rol">${m.rol === 'docente' ? 'Docente' : 'Alumno'}</div>
                        </div>
                        ${m.esAdmin ? '<span class="miembro-admin">Admin</span>' : ''}
                        ${estaSuspendido ? '<span class="miembro-suspendido">Suspendido</span>' : ''}
                    </div>`;
                }).join('')}
            </div>
            ${esAdmin ? `
                <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">
                    <button class="chat-btn-primary" onclick="chatUI.mostrarGestionGrupo()" style="background:#D8A1FF"><i class="fa-solid fa-sliders"></i> Gestionar grupo</button>
                </div>
            ` : ''}
        `;
        this.cerrarModal('modalOpcionesConv');
        document.getElementById('modalInfoGrupo').style.display = 'flex';
    },

    abrirPerfilMiembro(grupoId, miembroId) {
        const grupo = CHAT.getGruposChat().find(g => g.id === grupoId);
        const miembro = grupo?.miembros.find(m => m.id === miembroId);
        const u = CHAT.getUsuario(miembroId);
        const est = CHAT.getEstudianteCompleto(miembroId);
        if (!miembro || !u) return;
        const estado = CHAT.obtenerEstado(miembroId);

        const content = document.getElementById('perfilMiembroContent');
        content.innerHTML = `
            <div class="chat-perfil-miembro">
                <img src="${chatUI.avatarPath(miembroId)}" onerror="this.src=chatUI.defaultAvatar()">
                <div class="perfil-nombre">${PERFILES.escapeHtml(miembro.nombre)}</div>
                <div class="perfil-rol">${u.rol === 'docente' ? '👨‍🏫 Docente' : '🎓 Alumno'}</div>
                <div style="font-size:0.8rem;color:var(--text-tertiary);margin-top:2px">${estado.texto}</div>
                <div class="perfil-detalles">
                    ${est ? `
                        <div class="perfil-detalle"><i class="fa-solid fa-layer-group"></i> ${est.grado || ''} - Sección ${est.seccion || ''}</div>
                        <div class="perfil-detalle"><i class="fa-solid fa-envelope"></i> ${PERFILES.escapeHtml(u.correo || '')}</div>
                        <div class="perfil-detalle"><i class="fa-solid fa-building"></i> ${PERFILES.escapeHtml(u.instituto || '')}</div>
                    ` : `
                        <div class="perfil-detalle"><i class="fa-solid fa-envelope"></i> ${PERFILES.escapeHtml(u.correo || '')}</div>
                        <div class="perfil-detalle"><i class="fa-solid fa-building"></i> ${PERFILES.escapeHtml(u.instituto || '')}</div>
                    `}
                </div>
                <div class="perfil-acciones">
                    <button class="chat-btn-primary" onclick="chatUI.iniciarChatCon(${miembroId},'${PERFILES.escapeHtml(miembro.nombre)}')" style="flex:1"><i class="fa-solid fa-comment"></i> Enviar mensaje</button>
                </div>
                ${this.esDocente && miembro.rol !== 'docente' ? `
                    <div style="margin-top:12px;display:flex;flex-direction:column;gap:6px;width:100%">
                        <button class="chat-btn-primary" style="background:${miembro.esAdmin ? '#454546' : '#D8A1FF'}" onclick="chatUI.toggleAdminMiembro('${grupoId}',${miembroId})"><i class="fa-solid fa-user-shield"></i> ${miembro.esAdmin ? 'Quitar admin' : 'Hacer admin'}</button>
                        <button class="chat-btn-primary" style="background:#B02B44" onclick="chatUI.suspenderMiembro('${grupoId}',${miembroId})"><i class="fa-solid fa-ban"></i> Suspender</button>
                        <button class="chat-btn-primary" style="background:#8B1E33" onclick="chatUI.confirmarExpulsarMiembro('${grupoId}',${miembroId},'${PERFILES.escapeHtml(miembro.nombre)}')"><i class="fa-solid fa-user-slash"></i> Expulsar</button>
                    </div>
                ` : ''}
            </div>
        `;
        document.getElementById('modalPerfilMiembro').style.display = 'flex';
    },

    mostrarGestionGrupo() {
        const grupo = CHAT.getGruposChat().find(g => g.id === this.conversacionActiva);
        if (!grupo) return;
        const esCreador = grupo.docenteCreador?.id === usuarioActual.id;
        let html = '<div style="padding:16px;display:flex;flex-direction:column;gap:8px">';
        if (esCreador) {
            html += `
                <button class="chat-btn-primary" onclick="chatUI.editarNombreGrupo()"><i class="fa-solid fa-pen"></i> Editar nombre</button>
                <button class="chat-btn-primary" onclick="chatUI.editarDescGrupo()"><i class="fa-solid fa-align-left"></i> Editar descripción</button>
                <button class="chat-btn-primary" style="background:${grupo.cerrado ? '#10b981' : '#B02B44'}" onclick="chatUI.toggleCerrarGrupo()">
                    <i class="fa-solid ${grupo.cerrado ? 'fa-unlock' : 'fa-lock'}"></i> ${grupo.cerrado ? 'Abrir grupo' : 'Cerrar grupo'}
                </button>
                <button class="chat-btn-primary" style="background:#D8A1FF" onclick="chatUI.agregarMiembrosGrupo()"><i class="fa-solid fa-user-plus"></i> Agregar alumnos</button>
                <button class="chat-btn-primary" style="background:#B02B44" onclick="chatUI.confirmarEliminarGrupo()"><i class="fa-solid fa-trash"></i> Eliminar grupo</button>
            `;
        }
        html += `<button class="chat-btn-primary" style="background:#454546" onclick="chatUI.cerrarModal('modalInfoGrupo');chatUI.cerrarModal('modalOpcionesConv')"><i class="fa-solid fa-arrow-left"></i> Volver</button>`;
        html += '</div>';
        document.getElementById('infoGrupoContent').innerHTML = html;
    },

    editarNombreGrupo() {
        const grupo = CHAT.getGruposChat().find(g => g.id === this.conversacionActiva);
        if (!grupo) return;
        const overlay = document.createElement('div');
        overlay.className = 'chat-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="chat-modal" style="max-width:360px" onclick="event.stopPropagation()">
                <div class="chat-modal-header"><h3><i class="fa-solid fa-pen"></i> Editar nombre</h3></div>
                <div style="padding:20px">
                    <label style="display:block;margin-bottom:6px;font-size:13px;color:var(--text-secondary)">Nuevo nombre del grupo</label>
                    <input type="text" id="modalEditNombreInput" class="chat-input" value="${PERFILES.escapeHtml(grupo.nombre)}" style="width:100%">
                    <div style="display:flex;gap:8px;margin-top:12px">
                        <button class="chat-btn-primary" style="background:#454546;flex:1" onclick="this.closest('.chat-modal-overlay').remove()">Cancelar</button>
                        <button class="chat-btn-primary" style="flex:1" onclick="const i=document.getElementById('modalEditNombreInput');if(i.value.trim()){chatUI.guardarNombreGrupo(i.value.trim());this.closest('.chat-modal-overlay').remove()}">Guardar</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        setTimeout(() => document.getElementById('modalEditNombreInput')?.focus(), 100);
    },

    guardarNombreGrupo(nuevo) {
        const grupo = CHAT.getGruposChat().find(g => g.id === this.conversacionActiva);
        if (!grupo || !nuevo) return;
        grupo.nombre = nuevo;
        CHAT.guardarGruposChat(CHAT.getGruposChat());
        const convs = CHAT.getConversaciones();
        const conv = convs.find(c => c.id === this.conversacionActiva);
        if (conv) conv.nombre = nuevo;
        CHAT.guardarConversaciones(convs);
        this.abrirInfoGrupo();
        this.renderizarConversaciones();
        PERFILES.mostrarToast('Nombre actualizado', 'success');
    },

    editarDescGrupo() {
        const grupo = CHAT.getGruposChat().find(g => g.id === this.conversacionActiva);
        if (!grupo) return;
        const overlay = document.createElement('div');
        overlay.className = 'chat-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="chat-modal" style="max-width:360px" onclick="event.stopPropagation()">
                <div class="chat-modal-header"><h3><i class="fa-solid fa-pen"></i> Editar descripción</h3></div>
                <div style="padding:20px">
                    <label style="display:block;margin-bottom:6px;font-size:13px;color:var(--text-secondary)">Nueva descripción del grupo</label>
                    <textarea id="modalEditDescInput" class="chat-input" style="width:100%;min-height:80px;resize:vertical">${PERFILES.escapeHtml(grupo.descripcion || '')}</textarea>
                    <div style="display:flex;gap:8px;margin-top:12px">
                        <button class="chat-btn-primary" style="background:#454546;flex:1" onclick="this.closest('.chat-modal-overlay').remove()">Cancelar</button>
                        <button class="chat-btn-primary" style="flex:1" onclick="chatUI.guardarDescGrupo(document.getElementById('modalEditDescInput').value);this.closest('.chat-modal-overlay').remove()">Guardar</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        setTimeout(() => document.getElementById('modalEditDescInput')?.focus(), 100);
    },

    guardarDescGrupo(nuevo) {
        const grupo = CHAT.getGruposChat().find(g => g.id === this.conversacionActiva);
        if (!grupo) return;
        grupo.descripcion = nuevo;
        CHAT.guardarGruposChat(CHAT.getGruposChat());
        this.abrirInfoGrupo();
        PERFILES.mostrarToast('Descripción actualizada', 'success');
    },

    toggleCerrarGrupo() {
        const grupo = CHAT.getGruposChat().find(g => g.id === this.conversacionActiva);
        if (!grupo) return;
        grupo.cerrado = !grupo.cerrado;
        CHAT.guardarGruposChat(CHAT.getGruposChat());
        this.abrirInfoGrupo();
        PERFILES.mostrarToast(grupo.cerrado ? 'Grupo cerrado' : 'Grupo abierto', 'success');
    },

    confirmarEliminarGrupo() {
        const overlay = document.createElement('div');
        overlay.className = 'chat-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="chat-modal" style="max-width:320px" onclick="event.stopPropagation()">
                <div class="chat-modal-header"><h3><i class="fa-solid fa-trash"></i> Eliminar grupo</h3></div>
                <div style="padding:20px;text-align:center">
                    <p style="margin-bottom:16px;color:var(--text-secondary)">¿Eliminar el grupo para siempre? Esta acción no se puede deshacer.</p>
                    <div style="display:flex;gap:8px">
                        <button class="chat-btn-primary" style="background:#454546;flex:1" onclick="this.closest('.chat-modal-overlay').remove()">Cancelar</button>
                        <button class="chat-btn-primary" style="background:var(--danger);flex:1" onclick="this.closest('.chat-modal-overlay').remove();chatUI.eliminarGrupo()">Eliminar</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    },

    eliminarGrupo() {
        const grupo = CHAT.getGruposChat().find(g => g.id === this.conversacionActiva);
        if (!grupo) return;
        CHAT.getGruposChat().splice(CHAT.getGruposChat().indexOf(grupo), 1);
        CHAT.guardarGruposChat(CHAT.getGruposChat());
        CHAT.eliminarConversacion(this.conversacionActiva);
        this.cerrarConversacion();
        this.renderizarConversaciones();
        this.cerrarModal('modalInfoGrupo');
        PERFILES.mostrarToast('Grupo eliminado', 'success');
    },

    suspenderMiembro(grupoId, miembroId) {
        const overlay = document.createElement('div');
        overlay.className = 'chat-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="chat-modal" style="max-width:360px" onclick="event.stopPropagation()">
                <div class="chat-modal-header"><h3><i class="fa-solid fa-ban"></i> Suspender miembro</h3></div>
                <div style="padding:20px">
                    <label style="display:block;margin-bottom:6px;font-size:13px;color:var(--text-secondary)">Horas de suspensión (dejar vacío para indefinido)</label>
                    <input type="number" id="modalSuspenderInput" class="chat-input" placeholder="Ej: 24" min="1" style="width:100%">
                    <div style="display:flex;gap:8px;margin-top:12px">
                        <button class="chat-btn-primary" style="background:#454546;flex:1" onclick="this.closest('.chat-modal-overlay').remove()">Cancelar</button>
                        <button class="chat-btn-primary" style="background:var(--danger);flex:1" onclick="const i=document.getElementById('modalSuspenderInput');chatUI.ejecutarSuspender('${grupoId}',${miembroId},i.value);this.closest('.chat-modal-overlay').remove()">Suspender</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        setTimeout(() => document.getElementById('modalSuspenderInput')?.focus(), 100);
    },

    ejecutarSuspender(grupoId, miembroId, horas) {
        const h = horas ? parseInt(horas) : null;
        if (horas && isNaN(h)) return;
        CHAT.suspenderMiembro(grupoId, miembroId, h);
        this.abrirPerfilMiembro(grupoId, miembroId);
        PERFILES.mostrarToast('Miembro suspendido', 'success');
    },

    toggleAdminMiembro(grupoId, miembroId) {
        CHAT.hacerAdmin(grupoId, miembroId);
        this.abrirPerfilMiembro(grupoId, miembroId);
        PERFILES.mostrarToast('Rol de administrador actualizado', 'success');
    },

    confirmarExpulsarMiembro(grupoId, miembroId, nombre) {
        const overlay = document.createElement('div');
        overlay.className = 'chat-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="chat-modal" style="max-width:320px" onclick="event.stopPropagation()">
                <div class="chat-modal-header"><h3><i class="fa-solid fa-user-slash"></i> Expulsar miembro</h3></div>
                <div style="padding:20px;text-align:center">
                    <p style="margin-bottom:16px;color:var(--text-secondary)">¿Expulsar a <strong>${PERFILES.escapeHtml(nombre)}</strong> del grupo?</p>
                    <div style="display:flex;gap:8px">
                        <button class="chat-btn-primary" style="background:#454546;flex:1" onclick="this.closest('.chat-modal-overlay').remove()">Cancelar</button>
                        <button class="chat-btn-primary" style="background:var(--danger);flex:1" onclick="this.closest('.chat-modal-overlay').remove();chatUI.expulsarMiembro('${grupoId}',${miembroId})">Expulsar</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    },

    expulsarMiembro(grupoId, miembroId) {
        CHAT.expulsarMiembro(grupoId, miembroId);
        this.cerrarModal('modalPerfilMiembro');
        this.abrirInfoGrupo();
        PERFILES.mostrarToast('Miembro expulsado', 'success');
    },

    agregarMiembrosGrupo() {
        const grupo = CHAT.getGruposChat().find(g => g.id === this.conversacionActiva);
        if (!grupo) return;
        const estudiantes = CHAT.getEstudiantesPorInstituto(usuarioActual.instituto)
            .filter(e => !grupo.miembros.some(m => m.id === e.id));
        if (estudiantes.length === 0) { PERFILES.mostrarToast('No hay más alumnos disponibles', 'info'); return; }

        const checks = estudiantes.map(e =>
            `<label class="chat-contacto-item" style="cursor:pointer;display:flex;align-items:center;gap:10px">
                <input type="checkbox" value="${e.id}" style="width:18px;height:18px">
                <img src="${chatUI.avatarPath(e.id)}" onerror="this.src=chatUI.defaultAvatar()" style="width:36px;height:36px;border-radius:50%">
                <div><div style="font-weight:600;font-size:0.85rem">${PERFILES.escapeHtml(e.nombre)}</div><div style="font-size:0.75rem;color:var(--text-tertiary)">${e.grado || ''} - ${e.seccion || ''}</div></div>
            </label>`
        ).join('');

        document.getElementById('infoGrupoContent').innerHTML = `
            <div style="padding:16px">
                <h4 style="margin-bottom:12px;font-size:0.95rem">Seleccionar alumnos para agregar</h4>
                <div style="max-height:300px;overflow-y:auto;margin-bottom:12px">${checks || '<p>No hay alumnos disponibles</p>'}</div>
                <div style="display:flex;gap:8px">
                    <button class="chat-btn-primary" onclick="chatUI.confirmarAgregarMiembros()" style="flex:1">Agregar seleccionados</button>
                    <button class="chat-btn-primary" style="background:#454546;flex:1" onclick="chatUI.abrirInfoGrupo()">Cancelar</button>
                </div>
            </div>`;
    },

    confirmarAgregarMiembros() {
        const grupo = CHAT.getGruposChat().find(g => g.id === this.conversacionActiva);
        if (!grupo) return;
        const checks = document.querySelectorAll('#infoGrupoContent input[type=checkbox]:checked');
        const ids = Array.from(checks).map(c => parseInt(c.value));
        ids.forEach(id => {
            const u = CHAT.getUsuario(id);
            if (u && !grupo.miembros.some(m => m.id === id)) {
                grupo.miembros.push({ id, nombre: u.nombre, rol: 'estudiante', esAdmin: false, suspendido: false, suspendidoHasta: null, permisos: ['enviar_mensajes', 'enviar_multimedia'] });
                const convs = CHAT.getConversaciones();
                const conv = convs.find(c => c.id === this.conversacionActiva);
                if (conv) { conv.participantes.push(id); conv.nombres[id] = u.nombre; }
                CHAT.guardarConversaciones(convs);
            }
        });
        CHAT.guardarGruposChat(CHAT.getGruposChat());
        this.abrirInfoGrupo();
        this.renderizarConversaciones();
        PERFILES.mostrarToast(`${ids.length} alumnos agregados`, 'success');
    },

    // --- CONTACT INFO ---
    abrirInfoContacto() {
        if (!this.conversacionActiva) return;
        const conv = CHAT.getConversaciones().find(c => c.id === this.conversacionActiva);
        if (!conv || conv.tipo === 'grupo') return;
        const otroId = parseInt(Object.keys(conv.nombres).find(k => k != usuarioActual.id));
        const u = CHAT.getUsuario(otroId);
        const est = CHAT.getEstudianteCompleto(otroId);
        if (!u) return;
        const estado = CHAT.obtenerEstado(otroId);

        const content = document.getElementById('perfilMiembroContent');
        content.innerHTML = `
            <div class="chat-perfil-miembro">
                <img src="${chatUI.avatarPath(otroId)}" onerror="this.src=chatUI.defaultAvatar()">
                <div class="perfil-nombre">${PERFILES.escapeHtml(u.nombre)}</div>
                <div class="perfil-rol">${u.rol === 'docente' ? '👨‍🏫 Docente' : '🎓 Alumno'}</div>
                <div style="font-size:0.8rem;color:var(--text-tertiary);margin-top:2px">${estado.texto}</div>
                <div class="perfil-detalles">
                    ${est ? `
                        <div class="perfil-detalle"><i class="fa-solid fa-layer-group"></i> ${est.grado || ''} - Sección ${est.seccion || ''}</div>
                        <div class="perfil-detalle"><i class="fa-solid fa-graduation-cap"></i> ${PERFILES.escapeHtml(est.instituto || '')}</div>
                        <div class="perfil-detalle"><i class="fa-solid fa-id-card"></i> Código: ${est.codigo || ''}</div>
                    ` : ''}
                    <div class="perfil-detalle"><i class="fa-solid fa-envelope"></i> ${PERFILES.escapeHtml(u.correo || '')}</div>
                    <div class="perfil-detalle"><i class="fa-solid fa-building"></i> ${PERFILES.escapeHtml(u.instituto || '')}</div>
                    ${u.especialidad ? `<div class="perfil-detalle"><i class="fa-solid fa-chalkboard-user"></i> ${PERFILES.escapeHtml(u.especialidad)}</div>` : ''}
                </div>
            </div>
        `;
        document.getElementById('modalPerfilMiembro').style.display = 'flex';
    },

    // --- CONVERSATION OPTIONS ---
    mostrarOpcionesConv() {
        if (!this.conversacionActiva) return;
        const conv = CHAT.getConversaciones().find(c => c.id === this.conversacionActiva);
        if (!conv) return;

        const esGrupo = conv.tipo === 'grupo';
        const content = document.getElementById('opcionesConvContent');

        let items = [];
        items.push({ icon: conv.fijado ? 'fa-thumbtack' : 'fa-thumbtack', text: conv.fijado ? 'Desfijar conversación' : 'Fijar conversación', action: `chatUI.toggleFijar()`, extra: conv.fijado ? 'style="color:var(--primary)"' : '' });
        items.push({ icon: conv.archivado ? 'fa-box-open' : 'fa-box-archive', text: conv.archivado ? 'Desarchivar conversación' : 'Archivar conversación', action: `chatUI.toggleArchivar()`, extra: '' });

        if (!esGrupo) {
            items.push({ icon: conv.favorito ? 'fa-star' : 'fa-star', text: conv.favorito ? 'Quitar de favoritos' : 'Agregar a favoritos', action: `chatUI.toggleFavorito()`, extra: conv.favorito ? 'style="color:#D8A1FF"' : '' });
        }

        const muted = conv.silenciado && (!conv.silenciadoHasta || new Date(conv.silenciadoHasta) > new Date());
        items.push({ icon: muted ? 'fa-bell' : 'fa-bell-slash', text: muted ? 'Activar notificaciones' : 'Silenciar notificaciones', action: `chatUI.toggleSilenciar()`, extra: '' });

        if (esGrupo) {
            items.push(null);
            items.push({ icon: 'fa-info-circle', text: 'Información del grupo', action: `chatUI.abrirInfoGrupo()`, extra: '' });
        }

        items.push(null);
        items.push({ icon: 'fa-trash-can', text: 'Eliminar conversación', action: `chatUI.confirmarEliminarConv()`, danger: true });

        if (this.esDocente && !esGrupo) {
            items.push(null);
            items.push({ icon: 'fa-file-export', text: 'Exportar conversación', action: `chatUI.mostrarExportar()`, extra: '' });
        }
        items.push(null);
        items.push({ icon: 'fa-palette', text: 'Cambiar color de burbujas', action: `chatUI.mostrarSelectorColor()`, extra: '' });
        items.push({ icon: 'fa-image', text: 'Cambiar fondo', action: `chatUI.mostrarSelectorFondo()`, extra: '' });
        items.push(null);
        const temaActual = document.documentElement.getAttribute('data-theme') || 'light';
        items.push({ icon: temaActual === 'dark' ? 'fa-sun' : 'fa-moon', text: temaActual === 'dark' ? 'Modo claro' : 'Modo oscuro', action: `chatUI.toggleTema()`, extra: '' });

        content.innerHTML = items.map(item => {
            if (!item) return '<div class="chat-context-divider"></div>';
            return `<button class="chat-opcion-item ${item.danger ? 'danger' : ''}" onclick="${item.action}" ${item.extra || ''}>
                <i class="fa-solid ${item.icon}"></i> ${item.text}
            </button>`;
        }).join('');

        document.getElementById('modalOpcionesConv').style.display = 'flex';
    },

    toggleFijar() {
        CHAT.toggleFijar(this.conversacionActiva);
        this.cerrarModal('modalOpcionesConv');
        this.renderizarConversaciones();
    },

    toggleArchivar() {
        CHAT.toggleArchivar(this.conversacionActiva);
        this.cerrarModal('modalOpcionesConv');
        this.cerrarConversacion();
        this.renderizarConversaciones();
    },

    toggleFavorito() {
        CHAT.toggleFavorito(this.conversacionActiva);
        this.cerrarModal('modalOpcionesConv');
    },

    toggleSilenciar() {
        const conv = CHAT.getConversaciones().find(c => c.id === this.conversacionActiva);
        if (!conv) return;
        if (conv.silenciado) {
            CHAT.desSilenciar(this.conversacionActiva);
        } else {
            const opciones = [1, 8, 24, 168];
            const etiquetas = ['1 hora', '8 horas', '24 horas', '7 días'];
            const menu = document.createElement('div');
            menu.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:400;display:flex;align-items:center;justify-content:center';
            menu.innerHTML = `<div style="background:var(--surface);border-radius:var(--radius-xl);padding:20px;max-width:300px;width:100%;box-shadow:var(--shadow-xl)">
                <h3 style="margin-bottom:12px;font-size:1rem">Silenciar notificaciones</h3>
                ${etiquetas.map((l, i) => `<button style="display:block;width:100%;padding:10px;border:none;background:var(--bg-alt);border-radius:var(--radius-sm);margin-bottom:6px;cursor:pointer;font-size:0.9rem" onclick="chatUI.silenciarDefinir(${opciones[i]});this.closest('div[style]').remove()">${l}</button>`).join('')}
                <button style="display:block;width:100%;padding:10px;border:none;background:var(--bg-alt);border-radius:var(--radius-sm);cursor:pointer;font-size:0.9rem;margin-top:4px" onclick="chatUI.silenciarDefinir(99999);this.closest('div[style]').remove()">Siempre</button>
                <button style="display:block;width:100%;padding:10px;border:none;background:none;color:var(--text-tertiary);cursor:pointer;font-size:0.85rem;margin-top:8px" onclick="this.closest('div[style]').remove()">Cancelar</button>
            </div>`;
            document.body.appendChild(menu);
            menu.onclick = (e) => { if (e.target === menu) menu.remove(); };
        }
        this.cerrarModal('modalOpcionesConv');
    },

    silenciarDefinir(horas) {
        CHAT.silenciar(this.conversacionActiva, horas);
        this.renderizarConversaciones();
    },

    confirmarEliminarConv() {
        this.cerrarModal('modalOpcionesConv');
        const overlay = document.createElement('div');
        overlay.className = 'chat-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="chat-modal" style="max-width:320px" onclick="event.stopPropagation()">
                <div class="chat-modal-header"><h3><i class="fa-solid fa-trash-can"></i> Eliminar conversación</h3></div>
                <div style="padding:20px;text-align:center">
                    <p style="margin-bottom:16px;color:var(--text-secondary)">¿Eliminar esta conversación? Los mensajes se eliminarán para ti.</p>
                    <div style="display:flex;gap:8px">
                        <button class="chat-btn-primary" style="background:#454546;flex:1" onclick="this.closest('.chat-modal-overlay').remove()">Cancelar</button>
                        <button class="chat-btn-primary" style="background:var(--danger);flex:1" onclick="this.closest('.chat-modal-overlay').remove();chatUI.eliminarConv()">Eliminar</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    },

    eliminarConv() {
        CHAT.eliminarConversacion(this.conversacionActiva);
        this.cerrarConversacion();
        this.renderizarConversaciones();
    },

    mostrarExportar() {
        document.getElementById('modalReporteChat').style.display = 'flex';
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        document.getElementById('reporteFechaInicio').value = inicio.toISOString().split('T')[0];
        document.getElementById('reporteFechaFin').value = hoy.toISOString().split('T')[0];
    },

    exportarPDF() {
        const fi = document.getElementById('reporteFechaInicio').value;
        const ff = document.getElementById('reporteFechaFin').value;
        const csv = CHAT.exportarConversacion(this.conversacionActiva, fi, ff);
        if (!csv) return;
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Exportar Conversación</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style></head><body>
            <h2>Conversación - ${PERFILES.escapeHtml(document.getElementById('chatContactoNombre').textContent)}</h2>
            <p>${fi} a ${ff}</p><hr>`);
        const rows = csv.split('\n').slice(1).filter(r => r).map(r => {
            const cols = r.split('","');
            return `<tr><td>${cols[0]?.replace(/"/g, '') || ''}</td><td>${cols[1]?.replace(/"/g, '') || ''}</td><td>${cols[2]?.replace(/"/g, '') || ''}</td><td>${cols[3]?.replace(/"/g, '') || ''}</td></tr>`;
        }).join('');
        win.document.write(`<table><thead><tr><th>Fecha</th><th>Hora</th><th>Remitente</th><th>Mensaje</th></tr></thead><tbody>${rows}</tbody></table>`);
        win.document.write('</body></html>');
        win.print();
        this.cerrarModal('modalReporteChat');
    },

    exportarExcel() {
        const fi = document.getElementById('reporteFechaInicio').value;
        const ff = document.getElementById('reporteFechaFin').value;
        const csv = CHAT.exportarConversacion(this.conversacionActiva, fi, ff);
        if (!csv) return;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `conversacion_${document.getElementById('chatContactoNombre').textContent}_${fi}.csv`;
        a.click();
        this.cerrarModal('modalReporteChat');
        PERFILES.mostrarToast('Conversación exportada', 'success');
    },

    exportarImprimir() { this.exportarPDF(); },

    // --- ATTACHMENTS ---
    mostrarAdjuntar() {
        if (this.esDocente) {
            document.getElementById('chatBtnEncuesta').style.display = 'flex';
        } else {
            document.getElementById('chatBtnEncuesta').style.display = 'none';
        }
        document.getElementById('modalAdjuntar').style.display = 'flex';
    },

    adjuntarCamara() {
        this.cerrarModal('modalAdjuntar');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = (e) => {
            if (e.target.files?.[0]) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    CHAT.enviarMensaje(usuarioActual, this.conversacionActiva, {
                        tipo: 'imagen',
                        contenido: { archivo: { url: ev.target.result, nombre: 'foto.jpg', tipo: 'image/jpeg' } }
                    });
                    this.cargarMensajes(this.conversacionActiva);
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        };
        input.click();
    },

    adjuntarGaleria() {
        this.cerrarModal('modalAdjuntar');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*';
        input.multiple = true;
        input.onchange = (e) => {
            Array.from(e.target.files || []).forEach(file => {
                const reader = new FileReader();
                const esVideo = file.type.startsWith('video/');
                reader.onload = (ev) => {
                    CHAT.enviarMensaje(usuarioActual, this.conversacionActiva, {
                        tipo: esVideo ? 'video' : 'imagen',
                        contenido: { archivo: { url: ev.target.result, nombre: file.name, tipo: file.type } }
                    });
                    this.cargarMensajes(this.conversacionActiva);
                };
                reader.readAsDataURL(file);
            });
        };
        input.click();
    },

    adjuntarDocumento() {
        this.cerrarModal('modalAdjuntar');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt';
        input.onchange = (e) => {
            if (e.target.files?.[0]) {
                const file = e.target.files[0];
                CHAT.enviarMensaje(usuarioActual, this.conversacionActiva, {
                    tipo: 'documento',
                    contenido: { archivo: { nombre: file.name, tamaño: file.size > 1024 * 1024 ? Math.round(file.size / (1024 * 1024)) + ' MB' : Math.round(file.size / 1024) + ' KB', tipo: file.type } }
                });
                this.cargarMensajes(this.conversacionActiva);
            }
        };
        input.click();
    },

    adjuntarContacto() {
        this.cerrarModal('modalAdjuntar');
        const contactos = CHAT.getEstudiantesPorInstituto(usuarioActual.instituto).concat(
            CHAT.getDocentesPorInstituto(usuarioActual.instituto)
        ).filter(c => c.id !== usuarioActual.id).slice(0, 20);
        if (contactos.length === 0) {
            PERFILES.mostrarToast('No hay contactos disponibles', 'info');
            return;
        }
        const overlay = document.createElement('div');
        overlay.className = 'chat-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="chat-modal" style="max-width:320px" onclick="event.stopPropagation()">
                <div class="chat-modal-header">
                    <h3><i class="fa-solid fa-address-book"></i> Compartir contacto</h3>
                    <button class="chat-btn-icon" onclick="this.closest('.chat-modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div style="max-height:300px;overflow-y:auto;padding:8px 16px">
                    ${contactos.map(c => `<div class="chat-contacto-item" style="cursor:pointer" onclick="chatUI.enviarContacto(${c.id},'${PERFILES.escapeHtml(c.nombre)}');this.closest('.chat-modal-overlay').remove()">
                        <img src="${this.avatarPath(c.id)}" onerror="this.src='${this.defaultAvatar()}'">
                        <div class="contacto-info">
                            <div class="contacto-nombre">${PERFILES.escapeHtml(c.nombre)}</div>
                            <div class="contacto-detalle">${c.rol === 'docente' ? 'Docente' : 'Alumno'}</div>
                        </div>
                    </div>`).join('')}
                </div>
            </div>`;
        document.body.appendChild(overlay);
    },

    enviarContacto(contactoId, contactoNombre) {
        const u = CHAT.getUsuario(contactoId);
        if (!u) return;
        CHAT.enviarMensaje(usuarioActual, this.conversacionActiva, {
            tipo: 'contacto',
            contenido: { contacto: { id: contactoId, nombre: contactoNombre, correo: u.correo || '' } }
        });
        this.cargarMensajes(this.conversacionActiva);
        PERFILES.mostrarToast('Contacto compartido', 'success');
    },

    adjuntarAudio() {
        this.cerrarModal('modalAdjuntar');
        CHAT.enviarMensaje(usuarioActual, this.conversacionActiva, {
            tipo: 'audio', contenido: { texto: '🎵 Nota de voz' }
        });
        this.cargarMensajes(this.conversacionActiva);
    },

    adjuntarUbicacion() {
        this.cerrarModal('modalAdjuntar');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                CHAT.enviarMensaje(usuarioActual, this.conversacionActiva, {
                    tipo: 'ubicacion',
                    contenido: { ubicacion: { lat: pos.coords.latitude, lng: pos.coords.longitude, nombre: `Ubicación actual (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})` } }
                });
                this.cargarMensajes(this.conversacionActiva);
            }, () => {
                CHAT.enviarMensaje(usuarioActual, this.conversacionActiva, {
                    tipo: 'ubicacion', contenido: { ubicacion: { lat: 0, lng: 0, nombre: 'Ubicación compartida' } }
                });
                this.cargarMensajes(this.conversacionActiva);
            });
        } else {
            CHAT.enviarMensaje(usuarioActual, this.conversacionActiva, {
                tipo: 'ubicacion', contenido: { ubicacion: { lat: 0, lng: 0, nombre: 'Ubicación compartida' } }
            });
            this.cargarMensajes(this.conversacionActiva);
        }
    },

    adjuntarEncuesta() {
        this.cerrarModal('modalAdjuntar');
        document.getElementById('modalEncuesta').style.display = 'flex';
        document.getElementById('encuestaPregunta').value = '';
        document.getElementById('encuestaOpciones').innerHTML = `
            <input type="text" class="chat-input-full" placeholder="Opción 1" style="margin-bottom:8px">
            <input type="text" class="chat-input-full" placeholder="Opción 2" style="margin-bottom:8px">
        `;
    },

    agregarOpcionEncuesta() {
        const container = document.getElementById('encuestaOpciones');
        const num = container.children.length + 1;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'chat-input-full';
        input.placeholder = `Opción ${num}`;
        input.style.marginBottom = '8px';
        container.appendChild(input);
    },

    enviarEncuesta() {
        const pregunta = document.getElementById('encuestaPregunta').value.trim();
        if (!pregunta) { PERFILES.mostrarToast('Escribe una pregunta', 'error'); return; }
        const opciones = Array.from(document.getElementById('encuestaOpciones').querySelectorAll('input'))
            .map(i => i.value.trim()).filter(v => v);
        if (opciones.length < 2) { PERFILES.mostrarToast('Agrega al menos 2 opciones', 'error'); return; }
        const tipo = document.getElementById('encuestaTipo').value;

        CHAT.crearEncuesta(usuarioActual, this.conversacionActiva, { pregunta, opciones, tipo });
        this.cerrarModal('modalEncuesta');
        this.cargarMensajes(this.conversacionActiva);
        PERFILES.mostrarToast('Encuesta creada', 'success');
    },

    // --- CUSTOMIZATION ---
    mostrarSelectorColor() {
        this.cerrarModal('modalOpcionesConv');
        const colores = ['#560591', '#D8A1FF', '#B02B44', '#7A10C0', '#10b981', '#454546', '#3E036E', '#F0E6F7', '#8B1E33'];
        const overlay = document.createElement('div');
        overlay.className = 'chat-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="chat-modal" style="max-width:320px" onclick="event.stopPropagation()">
                <div class="chat-modal-header">
                    <h3><i class="fa-solid fa-palette"></i> Color de burbujas</h3>
                    <button class="chat-btn-icon" onclick="this.closest('.chat-modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div style="padding:16px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center">
                    ${colores.map(c => `<div style="width:48px;height:48px;border-radius:50%;background:${c};cursor:pointer;border:3px solid transparent;transition:all 0.2s" onclick="chatUI.aplicarColorBurbujas('${c}');this.closest('.chat-modal-overlay').remove()" onmouseenter="this.style.borderColor='white';this.style.transform='scale(1.1)'" onmouseleave="this.style.borderColor='transparent';this.style.transform='scale(1)'"></div>`).join('')}
                    <div style="width:100%;margin-top:4px"><button class="chat-btn-primary" style="background:#454546;width:100%" onclick="chatUI.aplicarColorBurbujas(null);this.closest('.chat-modal-overlay').remove()"><i class="fa-solid fa-rotate-left"></i> Restablecer</button></div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    },

    aplicarColorBurbujas(color) {
        const convs = CHAT.getConversaciones();
        const conv = convs.find(c => c.id === this.conversacionActiva);
        if (conv) {
            conv.colorBurbujas = color || null;
            CHAT.guardarConversaciones(convs);
            if (color) {
                document.documentElement.style.setProperty('--chat-bubble-color', color);
                document.documentElement.style.setProperty('--chat-bubble-color-light', color + '20');
            } else {
                document.documentElement.style.removeProperty('--chat-bubble-color');
                document.documentElement.style.removeProperty('--chat-bubble-color-light');
            }
            PERFILES.mostrarToast(color ? 'Color de burbujas actualizado' : 'Color restablecido', 'success');
        }
    },

    mostrarSelectorFondo() {
        this.cerrarModal('modalOpcionesConv');
        const fondos = [
            { nombre: 'Defecto', valor: '' },
            { nombre: 'Ondas', valor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            { nombre: 'Atardecer', valor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
            { nombre: 'Océano', valor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
            { nombre: 'Bosque', valor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
            { nombre: 'Noche', valor: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
            { nombre: 'Pastel', valor: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }
        ];
        const overlay = document.createElement('div');
        overlay.className = 'chat-modal-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="chat-modal" style="max-width:320px" onclick="event.stopPropagation()">
                <div class="chat-modal-header">
                    <h3><i class="fa-solid fa-image"></i> Fondo de conversación</h3>
                    <button class="chat-btn-icon" onclick="this.closest('.chat-modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div style="padding:16px;display:flex;flex-direction:column;gap:8px">
                    ${fondos.map(f => `<button class="chat-opcion-item" onclick="chatUI.aplicarFondo('${PERFILES.escapeHtml(f.valor)}');this.closest('.chat-modal-overlay').remove()" style="${f.valor ? `background:${f.valor};color:white;border:2px solid transparent` : ''}">${f.nombre}</button>`).join('')}
                    <button class="chat-opcion-item" onclick="chatUI.subirFondoPersonalizado()" style="background:var(--bg-alt)"><i class="fa-solid fa-upload"></i> Subir imagen personalizada</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    },

    aplicarFondo(fondo) {
        const convs = CHAT.getConversaciones();
        const conv = convs.find(c => c.id === this.conversacionActiva);
        if (conv) {
            conv.fondo = fondo || null;
            CHAT.guardarConversaciones(convs);
            const mensajesArea = document.getElementById('chatMensajes');
            if (mensajesArea) {
                mensajesArea.style.background = fondo || '';
                mensajesArea.style.backgroundSize = fondo ? 'cover' : '';
            }
            document.getElementById('chatReactionPicker').style.display = 'none';
            PERFILES.mostrarToast(fondo ? 'Fondo actualizado' : 'Fondo restablecido', 'success');
        }
    },

    subirFondoPersonalizado() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            if (e.target.files?.[0]) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    this.aplicarFondo(`url(${ev.target.result})`);
                    document.querySelector('.chat-modal-overlay:last-child')?.remove();
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        };
        input.click();
    },

    // --- UTILITY ---
    cerrarModal(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    },

    // --- THEME ---
    toggleTema() {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const nuevo = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', nuevo);
        localStorage.setItem('eduChatTema', nuevo);
    },

    initTema() {
        const saved = localStorage.getItem('eduChatTema');
        if (saved) document.documentElement.setAttribute('data-theme', saved);
    },

    // --- GROUP CHAT (Teacher) ---
    crearGrupoChat(datos) {
        if (!this.esDocente) return;
        const grupo = CHAT.crearGrupoChat(usuarioActual, datos);
        this.cerrarModal('modalNuevoContacto');
        setTimeout(() => this.abrirConversacion(grupo.id), 200);
        PERFILES.mostrarToast(`Grupo "${grupo.nombre}" creado`, 'success');
    }
};

window.chatUI = chatUI;
