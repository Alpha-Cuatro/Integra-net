# Integra-net — Plataforma Educativa

Prototipo funcional de una plataforma educativa que conecta a **docentes** y
**estudiantes** en un mismo espacio de gestión académica: módulos temáticos,
tareas, calificaciones, asistencia, competencias, observaciones, grupos y chat,
más un **panel de administración** para la supervisión general del sistema.

> Proyecto del reto **"Plataforma de aprendizaje"** — categoría Aficcionario,
> temática Educación — enfocado en **Derechos y Dignidad de la Mujer**: prevención
> de la violencia, equidad de género, autoestima, comunicación asertiva,
> corresponsabilidad, bienestar y ciudadanía.

---

## 📌 Descripción

Integra-net nace como complemento digital de las capacitaciones docentes en la
asignatura de Derechos y Dignidad de la Mujer. Permite que el **docente** construya
y califique las evaluaciones de sus grupos, y que el **estudiante** recorra los
ocho módulos, entregue tareas, consulte su progreso y converse con su docente. El
**administrador** supervisa el uso global desde un panel de control.

La interfaz está en español y todos los textos, nombres de variables y mensajes
del sistema usan el idioma del usuario final.

### Módulos temáticos

1. Derechos de la Mujer: Fundamentos
2. Prevención de la Violencia de Género
3. Equidad de Género
4. Autoestima y Empoderamiento
5. Comunicación Asertiva y Resolución de Conflictos
6. Corresponsabilidad y Roles de Género
7. Salud y Bienestar Integral
8. Ciudadanía, Participación y Liderazgo

Cada módulo incluye competencias (fortaleza y debilidad) y un conjunto de
evaluaciones ya generadas con los datos semilla.

---

## 🛠️ Tecnologías y por qué se eligieron

| Categoría | Tecnología | Motivo de la elección |
|---|---|---|
| Estructura | HTML5 semántico | Accesibilidad y lectura directa por el navegador, sin capa de compilación. |
| Estilos | CSS3 con variables y tokens | `design.css` centraliza color, tipografía y espaciado, de modo que cambiar la identidad visual es un cambio en un solo archivo. |
| Lógica | JavaScript puro (sin frameworks) | El prototipo se ejecuta sin build ni dependencias. Un framework añadiría complejidad sin aportar funcionalidad. |
| Persistencia | `localStorage` | Permite ejecutar y demostrar el sistema sin servidor ni base de datos. El modelo lógico se normalizó hasta 2FN (ver [docs/modelo-datos.md](docs/modelo-datos.md)). |
| Tablas y modales | `TableGenerator` (`table.js`) | Un único generador declarativo reutilizado por docente y admin evita duplicar el render de tablas. |
| Gráficos | Chart.js 4.4.1 (CDN) | Librería estándar para el gráfico de asistencia por módulo. |
| Iconografía | Font Awesome 6.5.1 (CDN) | Iconos consistentes sin ampliar el peso del repositorio. |
| Versionamiento | Git / GitHub | Historial legible con commits que describen el avance funcional. |

El sistema se ejecuta íntegramente en el navegador, sin instalación ni
configuración: basta un servidor estático para abrirlo. Esa arquitectura mantiene
el proyecto portable y hace que la demostración sea inmediata en cualquier
equipo.

---

## 📁 Estructura del proyecto

```
Integra-net/
├── README.md
├── docs/
│   └── modelo-datos.md          # Diagrama ER, análisis 2FN e impacto medido
├── movil-estudiante/            # Aplicación del estudiante
│   ├── index.html               # Punto de entrada
│   ├── auth.js                  # Guard de rutas por rol
│   ├── design.css / styles.css / scripts.js
│   ├── auth/
│   │   └── login.html / signup.html  (+ .css / .js)
│   ├── perfil/
│   │   ├── datosIniciales.js    # Semilla y modelo de datos
│   │   ├── perfilAlumno.js / perfiles.js / autenticacion.js
│   │   └── chat.js / chatUI.js / grupos.js / tareas.js / notificaciones.js
│   └── images/
└── web-docente-admin-organizado/   # Aplicación web: docente y administrador
    ├── index.html               # Redirige al login según el rol
    ├── assets/
    │   ├── css/design.css / styles.css
    │   ├── js/auth.js
    │   └── js/perfil/             # datosIniciales.js, perfilDocente.js, chat, etc.
    └── paginas/
        ├── auth/login.html / signup.html   # Login y registro docente/admin
        ├── docente/index.html              # Panel del docente
        └── admin/
            ├── dashboard/dashboard.html    # Panel de control (resumen y gráficos)
            ├── tareas/tareas.html          # Tareas y entregas
            ├── usuarios/usuarios.html      # Usuarios del sistema
            ├── table.js / table.css        # Generador de tablas compartido
            └── admin.css
```

Las dos aplicaciones son **independientes**: cada una tiene su propio login, su
propio guard de rutas y su propio `datosIniciales.js`. El contenido de los
módulos temáticos está duplicado entre ambas, una decisión de alcance del
prototipo que se reporta en las limitaciones.

---

## 👥 Roles y permisos

| Capacidad | Estudiante | Docente | Administrador |
|---|:--:|:--:|:--:|
| Recorrer módulos y competencias | ✅ | — | — |
| Entregar tareas y trabajos | ✅ | — | — |
| Ver sus calificaciones y asistencia | ✅ | — | ✅ |
| Crear evaluaciones y tareas | — | ✅ | — |
| Calificar y retroalimentar | — | ✅ | — |
| Registrar asistencia y observaciones | — | ✅ | — |
| Chat con docente y compañeros | ✅ | ✅ | — |
| Ver el grupo completo | — | ✅ | — |
| Panel de control con estadísticas | — | — | ✅ |
| Listar y filtrar usuarios del sistema | — | — | ✅ |
| Supervisar tareas y entregas | — | — | ✅ |

El control de acceso vive en `auth.js` (web) y `auth.js` (móvil). Ambos validan la
sesión `eduSesion` y **redirigen según el rol**: un estudiante que intenta abrir
`/paginas/docente/` es devuelto a su inicio de sesión, y el mismo criterio
protege las páginas de administración.

---

## 🚀 Instalación y ejecución local

No hay build ni dependencias que instalar.

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Alpha-Cuatro/Integra-net.git
   cd Integra-net
   ```

2. **Levantar un servidor estático.** Es necesario: abrir los `.html` con doble
   clic rompe las rutas relativas y el `localStorage` queda separado por `file://`.

   ```bash
   # Python
   python -m http.server 5500
   ```
   Con VS Code, usar la extensión **Live Server** sobre la raíz del repositorio.

3. **Abrir la aplicación.** Hay dos portales independientes, y cada uno tiene su
   propia pantalla de login:

   | Portal | URL | Roles que admiten |
   |---|---|---|
   | App del estudiante | `/movil-estudiante/auth/login.html` | Estudiante |
   | App web | `/web-docente-admin-organizado/paginas/auth/login.html` | Docente y Administrador |

4. **Iniciar sesión** con una de las cuentas de la tabla siguiente. Los datos
   semilla se generan solos la primera vez que se abre la aplicación.

### Cuentas de demostración

| Rol | Correo | Contraseña | Entrar en |
|---|---|---|---|
| **Estudiante (alumno)** | `juan.carlos@colegio.edu` | `JuanCarlos@2026` | App del estudiante |
| **Docente** | `manuel.antonio@colegio.edu` | `Manuel@2026` | App web |
| **Administrador** | `admin@colegio.edu` | `Admin@2026` | App web |

> El estudiante entra en el portal móvil y el docente en el web: son
> aplicaciones separadas, con su propio login y su propio guard de rutas.

El registro permite crear cuentas nuevas de **docente y administrador** desde la
aplicación web, y de **estudiante** desde la aplicación móvil.

---

## 🗄️ Modelo de datos

El diagrama entidad-relación, el análisis de forma normal hasta 2FN y la medición
del impacto están en **[docs/modelo-datos.md](docs/modelo-datos.md)**.

Resumen: el sistema persiste 23 usuarios, 21 estudiantes, 8 módulos, 840
evaluaciones y 840 calificaciones en claves `edu*` de `localStorage`
(1.710 KB, un 33 % de la cuota de 5 MB). Documentamos allí las cuatro
violaciones de 2FN del modelo almacenado, el modelo normalizado propuesto y el
ahorro del **67,1 %** que implica aplicarlo.

---

## 🎨 Identidad visual

- **App móvil**: violeta `#7A2059` y naranja `#E2673C`, con Fraunces en títulos y
  Lexend en el cuerpo. El violeta evoca la lucha por los derechos de las mujeres y
  el naranja referencia la campaña de ONU Mujeres; la franja diagonal
  violeta→naranja (`ribbon-accent`) evoca el lazo simbólico internacional contra la
  violencia de género.
- **App web**: índigo y lila con Lora, integrada desde la rama de mejoras del
  equipo docente. Se mantuvo así para no romper una identidad ya implementada,
  por lo que ambas aplicaciones mantienen identidades visuales distintas.

---

## 🧩 Control de versiones

El historial se documenta con commits incrementales y descriptivos
(`feat`, `fix`, `docs`), agrupados por funcionalidad: estructura inicial, sistema
de diseño, autenticación y roles, tablas, panel docente, panel de administración,
normalización del modelo y documentación.

---

## ⚠️ Limitaciones conocidas

- **Los datos viven en el navegador.** Se guardan en el `localStorage`, así que se
  pierden al limpiar el almacenamiento del navegador y no hay sincronización
  entre dispositivos ni entre los dos portales web y móvil. El modelo de datos ya
  está normalizado y documentado para cuando se migre a un servidor.
- **Modelo almacenado por encima de 2FN.** La normalización está documentada y
  cuantificada, pero no aplicada: el refactor de los dos `datosIniciales.js`
  afectaría a las dos aplicaciones a la vez.
- **Contraseñas en texto plano** dentro de los datos semilla, propias de un
  prototipo. La recuperación de contraseña no las expone en pantalla, pero no
  envía correo ni las restablece.
- **Identidad visual divergente** entre la app móvil y la web, por la integración
  posterior de la rama del equipo docente.
- **Sin lecciones o unidades** en los módulos: cada uno tiene competencias y
  evaluaciones, pero no una secuencia de contenido clase a clase.
- **Contenido de demostración** en dos portales, con duplicación del código de
  los módulos temáticos entre la app móvil y la web (6.343 líneas). No se
  deduplicó por quedar fuera del alcance del prototipo.

---

## ✍️ Equipo

Integra-net es un proyecto del equipo **Alpha-Cuatro** para el Hackathon
Nicaragua 2026.

---

<div align="center">

**Integra-net** — *Conectando docentes y estudiantes*

</div>