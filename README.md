# Integra-net

Prototipo funcional de una plataforma web educativa que conecta a docentes y estudiantes en un mismo espacio de gestión académica: materias, tareas, calificaciones, asistencia, competencias, observaciones, grupos y chat en tiempo real, además de un panel administrativo para el seguimiento general del sistema.

Proyecto desarrollado para el reto **"Plataforma de aprendizaje"** — categoría Aficionado, temática Educación — enfocado en **Derechos y Dignidad de la Mujer** (prevención de violencia, equidad de género, autoestima, comunicación asertiva, corresponsabilidad, bienestar y ciudadanía).

---

## 📌 Descripción general

Integra-net responde a la necesidad de una **plataforma digital** que complemente las capacitaciones docentes en la asignatura de Derechos y Dignidad de la Mujer. Permite que:

- **Los docentes** gestionen contenidos, tareas y evaluaciones.
- **Los estudiantes** accedan de forma interactiva a los 8 módulos temáticos, hagan seguimiento de su progreso y se comuniquen con su docente.
- **El administrador** supervise el uso general del sistema desde un panel propio.

### ¿Qué problema resuelve?

Las capacitaciones sobre derechos y dignidad de la mujer suelen quedarse en sesiones presenciales sin seguimiento. Integra-net da continuidad: el contenido, las tareas, la evaluación y la comunicación quedan en un solo lugar, accesible para docentes y estudiantes.

### Módulos temáticos incluidos

1. Derechos de la Mujer: Fundamentos
2. Prevención de la Violencia de Género
3. Equidad de Género
4. Autoestima y Empoderamiento
5. Comunicación Asertiva y Resolución de Conflictos
6. Corresponsabilidad y Roles de Género
7. Salud y Bienestar Integral
8. Ciudadanía, Participación y Liderazgo

---

## 🛠️ Tecnologías utilizadas y por qué

| Categoría | Tecnología | ¿Por qué se eligió? |
|---|---|---|
| Estructura | HTML5 | Estándar web, funciona en cualquier navegador sin instalar nada. |
| Estilos | CSS3 (variables/tokens de diseño propios en `design.css`) | Permite cambiar toda la identidad visual desde un solo archivo, sin librerías externas. |
| Lógica (frontend) | JavaScript puro (sin frameworks) | Menor curva de aprendizaje, cero compilación en el cliente y fácil de revisar. |
| Backend | **Node.js** | Permite usar JavaScript también en el servidor, con un solo lenguaje en todo el proyecto, y centraliza la lógica y las claves privadas fuera del navegador. |
| Base de datos | **Supabase** (PostgreSQL) | Base de datos relacional gestionada, sin administrar servidores propios. Su capa gratuita basta para un prototipo. |
| Autenticación | Supabase Auth | Maneja registro, login y sesiones de forma segura, en lugar de guardar contraseñas manualmente. |
| Chat en tiempo real | Supabase Realtime | Permite mensajes instantáneos entre docente y estudiante sin montar WebSockets propios. |
| Iconografía | Font Awesome 6.5.1 (CDN) | Amplio catálogo de iconos, de uso inmediato. |
| Gráficos | Chart.js 4.4.1 (CDN) | Ligera y simple para mostrar progreso y estadísticas en los paneles. |
| Control de versiones | Git / GitHub | Historial de cambios y trabajo colaborativo. |

### Decisiones técnicas

- **Node.js en el backend:** se eligió para mantener JavaScript como único lenguaje en todo el proyecto, lo que simplifica el aprendizaje y el mantenimiento. Además, permite proteger las claves privadas de Supabase en el servidor.
- **Supabase como base de datos:** ofrece PostgreSQL, autenticación y tiempo real sin tener que montar ni mantener infraestructura propia.
- **Frontend en JavaScript puro:** se priorizó la rapidez de desarrollo; el alcance del prototipo no justificaba la complejidad de un framework como React.
- **Por qué no localStorage como base de datos:** los datos quedarían solo en el navegador de cada persona, y docente y estudiante no podrían verse entre sí. Con Supabase todos trabajan sobre la misma información.
- **Limitaciones conocidas:** es un prototipo; antes de usarlo en producción se deben revisar las políticas de seguridad (RLS), la validación de datos y el manejo de datos sensibles de menores.

---

## 📁 Estructura del proyecto

```
Prototipo-app/
├── index.html            # Vista principal del estudiante
├── styles.css            # Estilos generales de la app
├── scripts.js            # Lógica principal (estudiante)
├── design.css            # Sistema de diseño (colores, tipografía, tokens)
├── auth.js               # Control de acceso por rol (guard de rutas)
├── supabase-config.js    # Conexión del frontend con Supabase (URL y clave pública)
├── auth/                 # Login y registro
│   ├── login.html / .css / .js
│   └── signup.html / .css / .js
├── docente/              # Panel del docente
│   ├── index.html
│   ├── docente.js
│   └── styles.css
├── admin/                # Panel administrativo
│   ├── admin.js / .css
│   ├── table.js / .css
│   ├── dashboard/
│   └── Tareas/
├── perfil/               # Módulos de perfil, chat y datos
│   ├── perfilAlumno.js / perfilDocente.js
│   ├── chat.js / chatUI.js
│   ├── grupos.js / tareas.js / notificaciones.js
│   └── datosIniciales.js # Datos semilla del prototipo
├── backend/              # Servidor Node.js (API y conexión con Supabase)
│   ├── package.json
│   ├── .env              # Variables privadas (NO se sube a GitHub)
│   └── ...
└── images/               # Recursos gráficos (logo, fondos, avatar)
```

> Ajusta el nombre `backend/` y su contenido al de tu proyecto.

---
## 📝 Convenciones de nomenclatura

| Elemento | Nomenclatura | Ejemplos | Ubicación |
|---|---|---|---|
| Variables y funciones JS | camelCase (en español) | `otroId`, `esGrupo`, `noLeidos`, `mostrarModal` | Todos los `.js` |
| Clases JS | PascalCase | `TableGenerator` | `paginas/admin/table.js` |
| Constantes globales | UPPER_SNAKE_CASE | `PASSWORD_MIN_LENGTH`, `SISTEMA_CONFIG`, `MATERIAS_SECUNDARIA` | `auth.js`, `login.js`, `signup.js`, `perfil/datosIniciales.js` |
| Clases CSS | kebab-case | `.nombre-de-clase` | `styles.css`, `design.css`, `admin.css`, `dashboard.css`, `docente.css`, `login.css` |
| Claves de `localStorage` | Prefijo `edu` + PascalCase | `eduUsuarios`, `eduEvaluaciones`, `eduSesion` | `perfil/*.js` y `docs/modelo-datos.md` |
| Tipos de notificación | snake_case | `nueva_tarea`, `nuevo_mensaje`, `entrega_calificada` | `perfil/notificaciones.js` |
| Archivos | minúsculas o camelCase | `perfilAlumno.js`, `chatUI.js`, `login.css` | `movil-estudiante/`, `web-docente-admin-organizado/` |
| Carpetas | minúsculas | `perfil`, `paginas`, `assets` | Raíz del proyecto |
| Entidades del modelo de datos | MAYÚSCULAS y SNAKE_CASE | `GRADO_SECCION`, `DOCENTE_MATERIA` | `docs/modelo-datos.md` |

> Todos los nombres de variables, funciones y mensajes del sistema están en español, el idioma del usuario final.

## 🎨 Identidad visual

La paleta y tipografía se replantearon para reflejar el tema del reto, en vez de usar el azul-índigo genérico de plantilla:

- **Violeta amaranto (`#7A2059`)** como color primario — la violeta es el color histórico asociado a la lucha por los derechos de la mujer.
- **Naranja (`#E2673C`)** como acento — en referencia a la campaña internacional *"Únete: actívate para poner fin a la violencia contra las mujeres"* (ONU Mujeres).
- **Fondo cálido**, no el gris-azulado típico de los paneles SaaS.
- **Tipografía:** *Fraunces* (serif con carácter) para títulos y *Lexend* (diseñada para mejorar la lectura) para el cuerpo de texto, ambas vía Google Fonts.
- **Elemento de firma:** una franja diagonal violeta→naranja (`.ribbon-accent` en `design.css`) que evoca el lazo símbolo internacional contra la violencia de género, usado en encabezados y tarjetas clave.

Todo el sistema de color está centralizado en variables CSS (`design.css`), por lo que cualquier ajuste de tono se hace en un solo lugar.

---

## 👥 Roles y permisos

El sistema define tres roles con accesos diferenciados:

| Rol | Qué puede hacer |
|---|---|
| **Docente** | Crea y gestiona materias, tareas, evaluaciones, asistencia y observaciones de sus estudiantes; se comunica por chat y visualiza informes de su grupo. |
| **Estudiante** | Consulta sus materias, calificaciones, asistencia, competencias y tareas; entrega trabajos y participa en el chat con su docente. |
| **Administrador** | Supervisa el sistema desde un panel general (estudiantes, docentes, tareas y actividades registradas). |

El control de acceso se aplica en `auth.js`, que valida la sesión activa (gestionada por Supabase Auth) y redirige según el rol (`docente` / `estudiante` / `admin`) para impedir el acceso a rutas que no le corresponden. En el servidor y en la base de datos, las políticas **Row Level Security (RLS)** de Supabase refuerzan que cada rol solo lea y escriba los datos que le corresponden.

---

## ✅ Requisitos previos

| Requisito | Para qué sirve |
|---|---|
| Git | Clonar el repositorio |
| Node.js (versión LTS) y npm | Ejecutar el backend e instalar sus dependencias |
| Cuenta gratuita en Supabase | Base de datos, autenticación y chat en tiempo real |
| Conexión a internet | Supabase, Font Awesome, Chart.js y Google Fonts se cargan en línea |

Para comprobar que Node.js y npm están instalados:

```bash
node -v
npm -v
```

---

## 🚀 Instalación y ejecución desde cero

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd Prototipo-app
```

> Reemplaza `<url-del-repositorio>` por la URL real de tu repositorio en GitHub.

### 2. Crear el proyecto en Supabase

1. Inicia sesión en Supabase y pulsa **New project**.
2. Elige un nombre y una contraseña para la base de datos, y espera a que termine de crearse.
3. En **SQL Editor**, crea las tablas que usa el proyecto (usuarios, materias, tareas, calificaciones, asistencia, mensajes, etc.).
4. En **Authentication → Providers**, verifica que **Email** esté habilitado. Para pruebas puedes desactivar la confirmación por correo.
5. En **Database → Replication** (o *Realtime*), activa Realtime en la tabla de mensajes del chat.
6. En **Project Settings → API**, copia el **Project URL**, la clave **anon public** y la clave **service_role**.

### 3. Configurar y ejecutar el backend (Node.js)

Entra a la carpeta del backend e instala las dependencias:

```bash
cd backend
npm install
```

Crea un archivo `.env` dentro de `backend/` con tus datos:

```env
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_ANON_KEY=TU-CLAVE-ANON-PUBLICA
SUPABASE_SERVICE_ROLE_KEY=TU-CLAVE-SERVICE-ROLE
PORT=3000
```

> ⚠️ La clave `service_role` da acceso total a la base de datos: úsala **solo en el backend** y **nunca** la subas a GitHub. Verifica que `.env` esté en tu `.gitignore`.

Inicia el servidor:

```bash
npm start
```

El backend quedará escuchando en `http://localhost:3000` (o el puerto que hayas definido en `PORT`).

### 4. Conectar el frontend con Supabase

Abre `supabase-config.js` (en la raíz del proyecto) y pega **solo** la URL y la clave pública:

```js
const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU-CLAVE-ANON-PUBLICA";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 5. Abrir la aplicación

El frontend necesita servirse desde un servidor para que las rutas relativas funcionen; abrir `index.html` con doble clic puede dar errores de ruta. Puedes usar la extensión **Live Server** de VS Code: clic derecho sobre `auth/login.html` → **Open with Live Server**.

Luego abre en el navegador:

```
http://localhost:5500/auth/login.html
```

Inicia sesión con uno de los usuarios de prueba (ver más abajo), o regístrate en `signup.html` si es tu primera vez.

---

## 🔑 Perfiles de usuario de prueba

Datos definidos para probar el prototipo:

| Rol | Correo | Contraseña |
|---|---|---|
| Docente | manuel.antonio@colegio.edu | Manuel@2026 |
| Estudiante | juan.carlos@colegio.edu | JuanCarlos@2026 |
| Administrador | admin@colegio.edu |dmin@2026 |

> Estos usuarios deben existir en Supabase Auth (créalos desde **Authentication → Users** o con el registro de la app). Son solo para pruebas: **no uses estas credenciales en un entorno real.**

---

## 🔒 Buenas prácticas aplicadas

- Separación de responsabilidades por carpeta (`auth`, `docente`, `admin`, `perfil`, `backend`).
- Sistema de diseño centralizado en variables CSS (`design.css`) para mantener consistencia visual y facilitar cambios globales.
- Guard de rutas por rol en `auth.js`, reforzado con políticas RLS en la base de datos.
- Claves privadas (`service_role`) únicamente en el backend mediante variables de entorno (`.env`); en el frontend solo se usa la clave pública (`anon`).
- Nomenclatura consistente en español para variables de dominio (materias, docentes, estudiantes).

---

## 🧩 Control de versiones

El desarrollo se llevó con Git, con commits incrementales que documentan el avance del prototipo (estructura inicial, diseño, autenticación, tablas, tablero, backend con Node.js, integración con Supabase y versiones de funcionalidad).
