# Integra-net — Plataforma Educativa

Prototipo funcional de una plataforma web educativa que conecta a **docentes** y **estudiantes** en un mismo espacio de gestión académica: materias, tareas, calificaciones, asistencia, competencias, observaciones, grupos y chat en tiempo real, además de un panel administrativo para el seguimiento general del sistema.

> Proyecto desarrollado para el reto **"Plataforma de aprendizaje"** — categoría Aficionado, temática Educación — enfocado en **Derechos y Dignidad de la Mujer** (prevención de violencia, equidad de género, autoestima, comunicación asertiva, corresponsabilidad, bienestar y ciudadanía).

## 📌 Descripción general

Integra-net responde a la necesidad de una herramienta digital que complemente las capacitaciones docentes en la asignatura de Derechos y Dignidad de la Mujer, permitiendo a los **docentes** gestionar contenido, tareas y evaluaciones, y a los **estudiantes** acceder de forma interactiva a los 8 módulos temáticos, hacer seguimiento de su progreso y comunicarse con su docente. Un panel de **administrador** supervisa el uso general del sistema.

### Módulos temáticos incluidos
1. Derechos de la Mujer: Fundamentos
2. Prevención de la Violencia de Género
3. Equidad de Género
4. Autoestima y Empoderamiento
5. Comunicación Asertiva y Resolución de Conflictos
6. Corresponsabilidad y Roles de Género
7. Salud y Bienestar Integral
8. Ciudadanía, Participación y Liderazgo

## 🛠️ Tecnologías utilizadas

| Categoría | Tecnología |
|---|---|
| Estructura | HTML5 |
| Estilos | CSS3 (variables/design tokens propios en `design.css`) |
| Lógica | JavaScript (Vanilla JS, sin frameworks) |
| Persistencia | `localStorage` del navegador (prototipo sin backend) |
| Iconografía | Font Awesome 6.5.1 (CDN) |
| Gráficos | Chart.js 4.4.1 (CDN) |
| Control de versiones | Git / GitHub |

No requiere Node.js, base de datos ni servidor backend para ejecutarse: es un prototipo 100% frontend.

## 📁 Estructura del proyecto

```
Prototipo-app/
├── index.html            # Vista principal del estudiante
├── styles.css             # Estilos generales de la app
├── scripts.js             # Lógica principal (estudiante)
├── design.css              # Sistema de diseño (colores, tipografía, tokens)
├── auth.js                  # Control de acceso por rol (guard de rutas)
├── auth/                      # Login y registro
│   ├── login.html / .css / .js
│   └── signup.html / .css / .js
├── docente/                    # Panel del docente
│   ├── index.html
│   ├── docente.js
│   └── styles.css
├── admin/                        # Panel administrativo
│   ├── admin.js / .css
│   ├── table.js / .css
│   ├── dashboard/
│   └── Tareas/
├── perfil/                          # Módulos de perfil, chat y datos
│   ├── perfilAlumno.js / perfilDocente.js
│   ├── chat.js / chatUI.js
│   ├── grupos.js / tareas.js / notificaciones.js
│   └── datosIniciales.js          # Datos semilla del prototipo
└── images/                          # Recursos gráficos (logo, fondos, avatar)
```

## 🎨 Identidad visual

La paleta y tipografía se replantearon para reflejar el tema del reto, en vez de usar el azul-índigo genérico de plantilla:

- **Violeta amaranto** (`#7A2059`) como color primario — el violeta es el color histórico asociado a la lucha por los derechos de la mujer.
- **Naranja** (`#E2673C`) como acento — en referencia a la campaña internacional "Únete: actívate para poner fin a la violencia contra las mujeres" (ONU Mujeres).
- Fondo cálido, no el gris-azulado típico de dashboards SaaS.
- Tipografía: **Fraunces** (serif con carácter) para títulos, **Lexend** (diseñada para mejorar la lectura) para el cuerpo de texto — ambas vía Google Fonts.
- Elemento de firma: una franja diagonal violeta→naranja (`.ribbon-accent` en `design.css`) que evoca el lazo símbolo internacional contra la violencia de género, usada en encabezados y tarjetas clave.

Todo el sistema de color sigue centralizado en variables CSS (`design.css`), por lo que cualquier ajuste de tono se hace en un solo lugar.

## 👥 Roles y permisos

El sistema define tres roles con accesos diferenciados:

- **Docente**: crea y gestiona materias, tareas, evaluaciones, asistencia y observaciones de sus estudiantes; se comunica por chat y visualiza reportes de su grupo.
- **Estudiante**: consulta sus materias, calificaciones, asistencia, competencias y tareas; entrega trabajos y participa en el chat con su docente.
- **Administrador**: supervisa el sistema desde un panel general (estudiantes, docentes, tareas y actividades registradas).

El control de acceso se aplica en `auth.js`, que valida la sesión activa (`eduSesion` en `localStorage`) y redirige según el rol (`docente` / `estudiante`) para impedir el acceso a rutas que no le corresponden.

## 🚀 Instalación y ejecución local

No requiere build ni instalación de dependencias. Para ejecutarlo:

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd Prototipo-app
   ```

2. **Levantar un servidor estático local** (necesario para que `localStorage` y las rutas relativas funcionen correctamente; abrir el `index.html` con doble clic puede dar errores de ruta):

   Con Python:
   ```bash
   python3 -m http.server 5500
   ```
   Con la extensión **Live Server** de VS Code:
   - Clic derecho sobre `auth/login.html` → "Open with Live Server"

3. **Acceder a la app**
   - Abrir `http://localhost:5500/auth/login.html` (o `signup.html` si es la primera vez)
   - Registrar un usuario para generar datos de sesión iniciales

## 🔒 Buenas prácticas aplicadas

- Separación de responsabilidades por carpeta (auth, docente, admin, perfil)
- Sistema de diseño centralizado en variables CSS (`design.css`) para mantener consistencia visual y facilitar cambios globales
- Guard de rutas por rol en `auth.js`
- Nomenclatura consistente en español para variables de dominio (materias, docentes, estudiantes)

## 🧩 Control de versiones

El desarrollo se llevó mediante Git, con commits incrementales documentando el avance del prototipo (estructura inicial, diseño, autenticación, tablas, dashboard, versiones de funcionalidad).

*_PERFILES DE USUARIO CON DATOS DEFINIDOS DENTRO DEL PROTOTIPO_*

*Docente*

Correo: manuel.antonio@colegio.edu

Contraseña: Manuel@2026

*Estudiante*

Correo: juan.carlos@colegio.edu

Contraseña: JuanCarlos@2026
