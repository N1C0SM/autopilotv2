## Calendario hipercómodo: integración total con la vida del usuario

Objetivo: que el calendario de Autopilot se sienta como una **extensión natural de Google Calendar** del usuario, con inteligencia automática de recuperación y atajos brutales para ti como admin.

Lo entregamos en **4 fases**, cada una usable de forma independiente. Empezamos por las que más impacto dan **sin requerir OAuth de Google** (efecto inmediato), y dejamos Google Calendar para el final cuando ya tengas la infraestructura lista.

---

### FASE 1 — Etiquetas de carga visibles (impacto inmediato, sin dependencias)

Cada bloque del calendario muestra un puntito de color con su carga estimada para que el usuario **entienda** la lógica detrás de su semana:

- 🔴 **Alta**: piernas pesadas, fullbody intenso, deportes de alto impacto (boxeo, escalada, fútbol)
- 🟡 **Media**: push, pull, hipertrofia general
- 🟢 **Baja**: movilidad, técnica, cardio suave, yoga

La carga se calcula en el cliente a partir de `fatigue_level` ya existente en cada ejercicio del `training_plan` y de un mapeo fijo por categoría para `external_activities` (boxeo=Alta, yoga=Baja, etc.).

Tooltip al pasar por encima: *"Carga alta — recuperación recomendada 48h"*.

---

### FASE 2 — Auto-reubicación inteligente de entrenos (sin OAuth)

Hoy tienes `training_rules.recovery_hours` por grupo muscular y `external_activities` con horarios. Conectamos las dos cosas:

**Lógica nueva en una función `auto-reschedule`** (Edge Function que se llama tras crear/mover una actividad externa):

1. Detecta solapes entre el `training_plan` (día → ejercicios) y `external_activities`/`training_schedule_overrides` del usuario.
2. Si el usuario tiene **boxeo el martes 20h** (alta fatiga hombros + core), el sistema busca el siguiente entreno de empuje/pull dentro de 24h y lo **reubica** automáticamente al próximo día libre con suficiente recuperación.
3. Crea un `training_schedule_override` para el día afectado y dispara una notificación amable: *"Movimos tu entreno de pecho del miércoles al jueves porque ayer tuviste boxeo (recuperación de hombros pendiente)."*

**Para el admin**: en `UserDetail` se ve un panel "Conflictos detectados esta semana" con un botón "Aplicar auto-ajuste" que invoca la misma función.

---

### FASE 3 — Atajos admin para sentirse pro

En la pestaña Calendario del `UserDetail`:

- **Vista "Semana real"**: muestra superpuestos training_plan + external_activities + (más adelante) Google Calendar como fondo gris.
- **Sugerencia automática de huecos al crear entreno**: al arrastrar/soltar un día de entreno sobre el calendario, el sistema propone los 3 mejores huecos libres de la semana ordenados por menor conflicto de recuperación. Dropdown rápido: *"Mar 7am · Jue 19h · Sáb 10am"*.
- **Notas privadas admin → usuario** en cada bloque del calendario (campo `admin_note` en `training_schedule_overrides`). El usuario las ve como una línea destacada en el detalle del entreno: *"📝 Nota del coach: Hoy mete RIR 1, ya estás listo."*
- **Indicador "Conectado con Google Calendar 🟢"** en la cabecera del calendario del usuario (visible solo cuando la fase 4 esté activa).

---

### FASE 4 — Sincronización bidireccional con Google Calendar (per-user OAuth)

Esto es lo grande. Cada usuario conecta **su propio** Google Calendar (no el tuyo), por lo que necesitamos OAuth per-user con credenciales propias en Google Cloud Console.

**Flujo de configuración (una sola vez, lo hacemos juntos):**
1. Tú creas un proyecto en Google Cloud Console, habilitas Google Calendar API y configuras la pantalla de consentimiento OAuth.
2. Generas un Client ID y Client Secret.
3. Me los pasas y los guardo como secretos (`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`).
4. Yo te paso la URL de callback exacta para que la añadas a "Authorized redirect URIs".

**Funcionalidad para el usuario:**
- Botón "Conectar Google Calendar" en `Settings`. Hace OAuth con scope `calendar.readonly` + `calendar.events`. Tokens (access + refresh) guardados en una nueva tabla `google_calendar_tokens` (user_id, access_token, refresh_token, expires_at) con RLS estricta.
- Eventos de Google aparecen como **bloques grises de fondo** (no editables) en el calendario de Autopilot — el usuario y el admin ven al instante "ah, este tío tiene clase de 17 a 21h los lunes".
- Cuando se crea/mueve/borra un entreno o actividad en Autopilot → Edge Function `sync-to-google` escribe el evento en un calendario dedicado llamado **"Autopilot Training"** dentro del Google Calendar del usuario. Así no contamina su calendario principal y puede activar/desactivar la visibilidad.

**Funcionalidad para el admin:**
- Cuando entras al calendario de un usuario, ves automáticamente sus eventos de Google como contexto de fondo → arrastras el entreno sabiendo dónde no choca.
- La auto-reubicación de la Fase 2 ahora también considera Google Calendar como fuente de conflictos, no solo `external_activities`.

**Edge Functions nuevas:**
- `google-oauth-callback`: recibe el code, intercambia por tokens, los guarda.
- `google-oauth-refresh`: refresca tokens caducados (llamada interna automática).
- `sync-to-google`: crea/actualiza/borra eventos en el calendario "Autopilot Training" del usuario.
- `fetch-google-events`: lee eventos de la semana actual del usuario (para mostrarlos como fondo). Cacheado 15min.

---

### Detalles técnicos

**Tabla nueva `google_calendar_tokens`** (Fase 4):
- `user_id` (uuid, unique), `access_token`, `refresh_token`, `expires_at`, `autopilot_calendar_id` (string, el ID del calendario "Autopilot Training" que creamos al conectar)
- RLS: el usuario gestiona el suyo, admin lee todos.

**Cambio en `training_schedule_overrides`** (Fase 3):
- Añadir columna `admin_note text nullable`.

**Función fatiga por categoría externa** (Fase 1, hardcoded en frontend):
```
boxeo, escalada, futbol, padel, tenis: Alta
running, ciclismo, natacion: Media
yoga, danza, personal, trabajo: Baja
```

**Llamada a `auto-reschedule`** (Fase 2): se invoca al `INSERT/UPDATE/DELETE` sobre `external_activities` mediante un trigger en Postgres que llama a `pg_net.http_post` hacia la Edge Function. Alternativa más simple: invocarla desde el cliente tras cada mutación en `CalendarView`.

**Archivos a tocar:**
- Fase 1: `src/components/dashboard/CalendarView.tsx` (etiquetas + tooltips)
- Fase 2: nueva Edge Function `auto-reschedule`, actualización de `CalendarView.tsx` para invocarla
- Fase 3: `src/components/admin/UserDetail.tsx` (panel conflictos, sugerencia huecos), migración para `admin_note`
- Fase 4: `src/components/SettingsPanel.tsx` (botón conectar), 4 edge functions nuevas, migración para tabla `google_calendar_tokens`, actualización de `CalendarView.tsx` para mostrar fondo

---

### Fuera de alcance v1

- No tocamos el flujo de generación inicial del plan (`generate-plan`). Solo **mueve** entrenos ya generados.
- No sincronizamos comidas con Google Calendar (solo entrenos + actividades), si quieres se añade después.
- No soportamos múltiples calendarios de Google por usuario (solo el primario).

---

### Orden recomendado de aprobación

Si te parece, lanzamos las fases **1, 2 y 3 ya** (no necesitan nada externo, las tienes funcionando esta tarde). Y cuando estés listo me avisas y montamos juntos el OAuth de Google para la Fase 4.

¿Apruebas las 4 fases o prefieres acotar a alguna?
