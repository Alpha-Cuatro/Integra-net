document.addEventListener('DOMContentLoaded', () => {
    const publicPages = ['auth/login.html', 'auth/signup.html'];
    const isPublic = publicPages.some(p => window.location.pathname.includes(p));
    if (isPublic) return;

    const sesion = localStorage.getItem('eduSesion');
    if (!sesion) {
        window.location.href = 'signup.html';
        return;
    }
    try {
        const data = JSON.parse(sesion);
        const isDocente = window.location.pathname.includes('/docente/');
        if (isDocente && data.rol !== 'docente') {
            window.location.href = '../index.html';
        } else if (!isDocente && !window.location.pathname.includes('/admin/') && data.rol !== 'estudiante') {
            window.location.href = 'docente/index.html';
        }
    } catch(e) {
        window.location.href = 'auth/login.html';
    }
});
