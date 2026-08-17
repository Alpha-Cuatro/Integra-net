// Guard de rutas - App web (roles "docente" y "admin")
document.addEventListener('DOMContentLoaded', () => {
    const publicPages = ['auth/login.html', 'auth/signup.html'];
    const isPublic = publicPages.some(p => window.location.pathname.includes(p));
    if (isPublic) return;

    const sesion = localStorage.getItem('eduSesion');
    if (!sesion) {
        const isAdmin = window.location.pathname.includes('/admin/');
        window.location.href = isAdmin ? '../../auth/login.html' : '../auth/login.html';
        return;
    }
    try {
        const data = JSON.parse(sesion);
        const isAdmin = window.location.pathname.includes('/admin/');
        if (isAdmin) {
            if (data.rol !== 'admin' && data.rol !== 'docente') {
                localStorage.removeItem('eduSesion');
                window.location.href = '../../auth/login.html';
            }
        } else {
            if (data.rol !== 'docente' && data.rol !== 'admin') {
                // No es docente ni admin; esta app no incluye el perfil de estudiante
                localStorage.removeItem('eduSesion');
                window.location.href = '../auth/login.html';
            }
        }
    } catch (e) {
        window.location.href = '../auth/login.html';
    }
});
