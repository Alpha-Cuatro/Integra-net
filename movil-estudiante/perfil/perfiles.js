
const PERFILES = {
    AVATAR_KEY: 'eduAvatares',

    getAvatares() {
        return JSON.parse(localStorage.getItem(this.AVATAR_KEY)) || {};
    },

    guardarAvatar(userId, dataUrl) {
        const avatares = this.getAvatares();
        avatares[userId] = dataUrl;
        localStorage.setItem(this.AVATAR_KEY, JSON.stringify(avatares));
    },

    obtenerAvatar(userId) {
        const avatares = this.getAvatares();
        return avatares[userId] || './images/avatar.png';
    },

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    mostrarToast(texto, tipo = 'success') {
        let t = document.getElementById('toastGlobal');
        if (!t) {
            t = document.createElement('div');
            t.id = 'toastGlobal';
            t.className = 'toast-global';
            document.body.appendChild(t);
        }
        const icono = tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle';
        t.innerHTML = `<i class="fa-solid fa-${icono}"></i> ${texto}`;
        t.className = `toast-global ${tipo} show`;
        clearTimeout(t._timeout);
        t._timeout = setTimeout(() => t.classList.remove('show'), 2800);
    },

    formatearFecha(fecha) {
        if (!fecha) return '';
        const d = new Date(fecha);
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    },

    obtenerNotaColor(nota) {
        if (nota >= 90) return '#10b981';
        if (nota >= 75) return '#3b82f6';
        if (nota >= 60) return '#f59e0b';
        return '#ef4444';
    },

    obtenerLetraNota(nota) {
        if (nota >= 90) return 'A';
        if (nota >= 80) return 'B';
        if (nota >= 70) return 'C';
        if (nota >= 60) return 'D';
        return 'F';
    },

    calcularPromedio(calificaciones) {
        if (!calificaciones || calificaciones.length === 0) return 0;
        return Math.round(calificaciones.reduce((s, c) => s + (c.nota || 0), 0) / calificaciones.length);
    },

    generarId() {
        return Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }
};
