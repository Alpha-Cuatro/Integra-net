// Guard de rutas - App movil (solo rol "estudiante")
document.addEventListener('DOMContentLoaded', () => {
    const publicPages = ['auth/login.html', 'auth/signup.html'];
    const isPublic = publicPages.some(p => window.location.pathname.includes(p));
    if (isPublic) return;

    const sesion = localStorage.getItem('eduSesion');
    if (!sesion) {
        window.location.href = 'auth/login.html';
        return;
    }
    try {
        const data = JSON.parse(sesion);
        if (data.rol !== 'estudiante') {
            // Esta app es solo para estudiantes; docentes/admin deben usar la app web
            localStorage.removeItem('eduSesion');
            window.location.href = 'auth/login.html';
        }
    } catch (e) {
        window.location.href = 'auth/login.html';
    }
});
