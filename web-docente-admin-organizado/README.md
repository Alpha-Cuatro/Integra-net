# Integra-net — App web (docente + administrador)

## Estructura

```
web-docente-admin/
├── index.html                     # Punto de entrada real. Redirige a paginas/auth/login.html
├── assets/                        # Todo lo compartido entre docente y admin
│   ├── css/
│   │   ├── design.css             # Sistema de diseño (colores, tipografía, tokens)
│   │   └── styles.css             # Estilos generales compartidos
│   ├── images/                    # Logo, avatar, fondo de login
│   └── js/
│       ├── auth.js                # Guard de rutas (valida sesión y rol en cada página)
│       └── perfil/                # Lógica de negocio: materias, tareas, chat, grupos, notificaciones
└── paginas/                       # Cada carpeta = una pantalla o grupo de pantallas
    ├── auth/
    │   ├── login.html             # <- ESTE es el verdadero "index" del login
    │   ├── login.css
    │   ├── login.js
    │   ├── signup.html
    │   ├── signup.css
    │   └── signup.js
    ├── docente/
    │   ├── index.html             # Panel del docente
    │   ├── docente.css
    │   └── docente.js
    └── admin/
        ├── admin.css
        ├── admin.js                # Clase AdminManager (maneja los datos del panel)
        ├── table.css
        ├── table.js
        ├── dashboard/
        │   ├── dashboard.html
        │   ├── dashboard.css
        │   └── dashboard.js
        └── tareas/
            └── tareas.html         # Aún vacío/sin terminar (ver pendientes)
```

## Cómo se navega

1. Se abre `index.html` (raíz) → redirige a `paginas/auth/login.html`
2. Login exitoso como **docente** → `paginas/docente/index.html`
3. Login exitoso como **admin** → `paginas/admin/dashboard/dashboard.html`

## Regla de oro de las rutas relativas

- Todo lo que está en `assets/` se referencia como `../../assets/...` desde `paginas/docente/`
  o `paginas/auth/`, y como `../../../assets/...` desde `paginas/admin/dashboard/` o
  `paginas/admin/tareas/`.
- Los archivos dentro de `paginas/auth/` y `paginas/docente/` son "hermanos" entre sí
  (mismo nivel), por eso se referencian entre ellos con `../auth/...` o `../docente/...`.

## Pendientes (heredados del proyecto original, no resueltos en esta reorganización)

- `paginas/admin/dashboard/dashboard.html` no incluye `<script>` de `admin.js`, `table.js`
  ni `../../../assets/js/auth.js` — hoy es solo maquetado, sin lógica ni protección de ruta.
- `paginas/admin/tareas/tareas.html` está vacío, sin contenido ni scripts.
- No hay un `paginas/admin/index.html` que sirva de menú/hub entre dashboard y tareas.
- No existe todavía un usuario con rol `"admin"` real en los datos semilla
  (`assets/js/perfil/datosIniciales.js`), solo `"estudiante"` y `"docente"`.
