# Integra-net — App móvil (estudiante)

Grupo separado del proyecto original, con TODO lo necesario para el perfil de estudiante únicamente.

## Contenido
- index.html, styles.css, scripts.js — vista principal del estudiante
- design.css — sistema de diseño compartido
- auth.js — guarda de rutas, ahora restringida solo al rol "estudiante"
- auth/ — login y registro (el registro solo permite rol "estudiante")
- perfil/ — lógica de materias, tareas, chat, grupos, notificaciones (usadas por el estudiante)
- images/ — logo, avatar, fondo de login

## Pendiente antes de llevarlo a app móvil real
- Migrar de localStorage a llamadas a la futura API backend (auth, tareas, chat)
- Convertir estas pantallas HTML/JS a Flutter o React Native
- El chat en tiempo real necesitará WebSocket en vez de localStorage
