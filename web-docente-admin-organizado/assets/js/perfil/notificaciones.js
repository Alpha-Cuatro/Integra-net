
const NOTIFICACIONES = {
    KEY: 'eduNotificaciones',
    ULTIMA_KEY: 'eduNotifUltimaVista',

    getTodas() {
        return JSON.parse(localStorage.getItem(this.KEY)) || [];
    },

    guardar(d) {
        localStorage.setItem(this.KEY, JSON.stringify(d));
    },

    generarId() {
        return Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    },

    agregar(tipo, mensaje, datos = {}) {
        const notifs = this.getTodas();
        const notif = {
            id: this.generarId(),
            tipo,
            mensaje,
            datos,
            fecha: new Date().toISOString(),
            leida: false,
            timestamp: Date.now()
        };
        notifs.unshift(notif);
        const maxNotifs = 200;
        if (notifs.length > maxNotifs) notifs.length = maxNotifs;
        this.guardar(notifs);
        this.actualizarBadge();
        return notif;
    },

    marcarLeida(id) {
        const notifs = this.getTodas();
        const n = notifs.find(n => n.id === id);
        if (n) { n.leida = true; this.guardar(notifs); }
        this.actualizarBadge();
    },

    marcarTodasLeidas() {
        const notifs = this.getTodas();
        notifs.forEach(n => n.leida = true);
        this.guardar(notifs);
        this.actualizarBadge();
    },

    getNoLeidas() {
        return this.getTodas().filter(n => !n.leida);
    },

    getRecientes(limite = 30) {
        return this.getTodas().slice(0, limite);
    },

    getNoLeidasCount() {
        return this.getNoLeidas().length;
    },

    getUltimaVista() {
        return parseInt(localStorage.getItem(this.ULTIMA_KEY)) || 0;
    },

    actualizarUltimaVista() {
        localStorage.setItem(this.ULTIMA_KEY, String(Date.now()));
    },

    hayNuevas() {
        const ultima = this.getUltimaVista();
        return this.getTodas().some(n => n.timestamp > ultima);
    },

    actualizarBadge() {
        const count = this.getNoLeidasCount();
        document.querySelectorAll('.notif-badge-count').forEach(el => {
            if (count > 0) {
                el.style.display = 'inline';
                el.textContent = count > 99 ? '99+' : count;
            } else {
                el.style.display = 'none';
            }
        });
    },

    getIcono(tipo) {
        const mapa = {
            nueva_tarea: 'fa-book',
            entrega_calificada: 'fa-star',
            nueva_entrega: 'fa-upload',
            nueva_nota: 'fa-star',
            nueva_observacion: 'fa-clipboard',
            nuevo_recurso: 'fa-file',
            nuevo_estudiante: 'fa-user-plus',
            nuevo_grupo: 'fa-layer-group',
            nuevo_mensaje: 'fa-comment',
            cambio_grupo: 'fa-arrow-right-arrow-left',
            recordatorio: 'fa-bell',
            examen: 'fa-calendar-check',
            logro: 'fa-trophy',
            nivel: 'fa-arrow-up',
            insigne: 'fa-medal'
        };
        return mapa[tipo] || 'fa-bell';
    },

    getColor(tipo) {
        const mapa = {
            nueva_tarea: '#560591',
            entrega_calificada: '#10b981',
            nueva_entrega: '#D8A1FF',
            nueva_nota: '#560591',
            nueva_observacion: '#7A10C0',
            nuevo_recurso: '#D8A1FF',
            nuevo_estudiante: '#10b981',
            nuevo_grupo: '#560591',
            nuevo_mensaje: '#7A10C0',
            logro: '#D8A1FF',
            nivel: '#10b981',
            insigne: '#B02B44'
        };
        return mapa[tipo] || '#454546';
    }
};
