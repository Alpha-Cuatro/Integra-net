
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('eduSesion')) {
        const sesion = JSON.parse(localStorage.getItem('eduSesion'));
        if (sesion.rol === 'docente') {
            window.location.href = '../docente/index.html';
            return;
        }
        if (sesion.rol === 'admin') {
            window.location.href = '../admin/dashboard/dashboard.html';
            return;
        }
        localStorage.removeItem('eduSesion');
    }

    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.innerHTML = type === 'password'
                ? '<i class="fa-solid fa-eye"></i>'
                : '<i class="fa-solid fa-eye-slash"></i>';
        });
    }

    function mostrarModal(opts) {
        const modal = document.getElementById('modalMensaje');
        if (!modal) return;
        document.getElementById('tituloMensaje').textContent = opts.titulo || 'Mensaje';
        document.getElementById('textoMensaje').textContent = opts.mensaje || '';
        document.getElementById('iconoMensaje').innerHTML = `<i class="${opts.icono || 'fa-solid fa-circle-info'}"></i>`;
        const btnRegistro = document.getElementById('btnRegistro');
        if (btnRegistro) btnRegistro.style.display = opts.mostrarRegistro ? 'inline-flex' : 'none';
        const btnRecuperar = document.getElementById('btnRecuperar');
        if (btnRecuperar) btnRecuperar.style.display = opts.mostrarRecuperar ? 'inline-flex' : 'none';
        modal.classList.add('show');
        const contenido = modal.querySelector('.modal-contenido');
        if (contenido) {
            contenido.classList.remove('success', 'error', 'info');
            contenido.classList.add(opts.tipo || 'info');
        }
    }

    document.getElementById('btnCerrar')?.addEventListener('click', () => {
        document.getElementById('modalMensaje').classList.remove('show');
    });

    document.getElementById('btnRegistro')?.addEventListener('click', () => {
        window.location.href = './signup.html';
    });

    document.getElementById('btnRecuperar')?.addEventListener('click', () => {
        document.getElementById('modalMensaje').classList.remove('show');
        document.getElementById('recuperarOverlay').style.display = 'flex';
    });

    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        if (!email || !password) {
            return mostrarModal({ titulo: 'Campos requeridos', mensaje: 'Ingresa tu correo y contraseña.', icono: 'fa-solid fa-triangle-exclamation', tipo: 'error' });
        }
        const usuarios = JSON.parse(localStorage.getItem('eduUsuarios')) || [];
        const usuario = usuarios.find(u => u.correo.toLowerCase() === email.toLowerCase());
        if (!usuario) {
            return mostrarModal({ titulo: 'Cuenta no encontrada', mensaje: 'No encontramos ninguna cuenta asociada a este correo. ¿Quieres crear una?', icono: 'fa-solid fa-user-plus', mostrarRegistro: true, tipo: 'error' });
        }
        if (usuario.password !== password) {
            return mostrarModal({ titulo: 'Contraseña incorrecta', mensaje: 'La contraseña no coincide. Intenta nuevamente.', icono: 'fa-solid fa-lock', tipo: 'error', mostrarRecuperar: true });
        }
        if (usuario.rol !== 'docente' && usuario.rol !== 'admin') {
            return mostrarModal({ titulo: 'Acceso no disponible', mensaje: 'Esta aplicación web es solo para docentes y administradores. Los estudiantes deben usar la app móvil.', icono: 'fa-solid fa-triangle-exclamation', tipo: 'error' });
        }
        localStorage.setItem('eduSesion', JSON.stringify({ usuarioId: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol, inicio: new Date().toISOString() }));
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
        localStorage.setItem('sesionActiva', 'true');
        mostrarModal({ titulo: 'Bienvenido a Integra-net', mensaje: `Hola ${usuario.nombre}, tu sesión ha iniciado correctamente.`, icono: 'fa-solid fa-circle-check', tipo: 'success' });
        setTimeout(() => {
            window.location.href = usuario.rol === 'docente' ? '../docente/index.html' : '../admin/dashboard/dashboard.html';
        }, 1600);
    });

    document.getElementById('linkRecuperar')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('recuperarOverlay').style.display = 'flex';
    });

    document.getElementById('recuperarCancelar')?.addEventListener('click', () => {
        document.getElementById('recuperarOverlay').style.display = 'none';
    });

    document.getElementById('recuperarForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const correo = document.getElementById('recuperarEmail').value.trim();
        if (!correo) return;
        const usuarios = JSON.parse(localStorage.getItem('eduUsuarios')) || [];
        const usuario = usuarios.find(u => u.correo.toLowerCase() === correo.toLowerCase());
        document.getElementById('recuperarOverlay').style.display = 'none';
        if (usuario) {
            mostrarModal({ titulo: 'Recuperación exitosa', mensaje: `Tu contraseña es: ${usuario.password}\nTe recomendamos cambiarla después de iniciar sesión.`, icono: 'fa-solid fa-envelope', tipo: 'success' });
        } else {
            mostrarModal({ titulo: 'Correo no encontrado', mensaje: 'No encontramos una cuenta con ese correo.', icono: 'fa-solid fa-triangle-exclamation', tipo: 'error' });
        }
        document.getElementById('recuperarEmail').value = '';
    });
});
