
## Visión

La app es **web (priorizada desktop, responsive funcional)**. El usuario solo recibe **2 cosas**: su **plan de entrenamiento** y su **plan de nutrición**. Como aún no hay app móvil, el usuario lo vive en su **Google Calendar** real, ajustado a sus horarios (gym, comidas, trabajo).

## 1. Pantalla nueva: "Mi semana real"

Una sola pantalla donde el usuario define cómo es su semana de verdad. Esto sustituye los inputs sueltos de hora.

Configura por día (Lunes–Domingo):
- Bloques **ocupados** (trabajo, clases, etc.) — el plan no los pisa
- **Hora preferida de gym** (ej. Lunes 18:00, Sábado 10:00)
- **Horarios de comidas habituales**: desayuno, snack mañana, comida, snack tarde, cena
- **Duración estimada** de entreno y de cada comida

Vista tipo grid semanal visual donde puede arrastrar/clickar bloques. Datos guardados en una nueva tabla `user_schedule` (un row por usuario con JSONB).

El generador de plan y el feed de calendario leerán de aquí en lugar de los defaults actuales.

## 2. Sincronización con Google Calendar

**Dos vías**, el usuario elige:

### A. OAuth real (recomendado, "premium")
- Botón "Conectar Google Calendar"
- OAuth flow propio con scope `calendar.events`
- Edge Function `gcal-sync` que crea/actualiza/borra eventos directamente en su calendario cuando:
  - Se genera o regenera el plan
  - Cambia "Mi semana real"
  - Se completa un entreno (marca el evento ✅)
- Tokens (access + refresh) guardados en nueva tabla `google_calendar_tokens` con RLS
- Cron diario que refresca tokens y sincroniza cambios

### B. ICS auto-actualizable (lo que ya existe, mejorado)
- Mantener la Edge Function `calendar-feed` existente
- **Ampliarla** para incluir: comidas (5/día con macros) + recordatorios semanales (pesarse, foto progreso)
- Adaptar la generación de eventos a los horarios de "Mi semana real" en vez de los inputs simples actuales

### Eventos generados (ambas vías)
- 🏋️ **Entrenos**: título de rutina, descripción con ejercicios numerados (series, reps, descanso, link al vídeo)
- 🍽️ **Comidas**: 5 al día (Desayuno, Snack AM, Comida, Snack PM, Cena) con descripción incluyendo macros y kcal de cada comida
- ⚖️ **Pesarse**: domingos por la mañana
- 📸 **Foto progreso**: domingos primer día de cada mes

## 3. Reorientación web/desktop

- Layout principal **maximizado para desktop**: dashboard con sidebar fija + área principal ancha (sin centrar todo en columna de 600px)
- `MobileNav` se oculta en ≥md, sidebar siempre visible
- HomeOverview reorganizado en grid 2-3 columnas: hoy + semana + nutrición de un vistazo
- Botón muy visible "Sincronizar con Google Calendar" como CTA principal del dashboard
- Mantenemos breakpoints responsive para que no rompa en móvil, pero el diseño primario es 1280px+

## 4. Simplificación del producto

Quitar/colapsar lo que no sea entrenamiento o nutrición del flujo principal:
- Chat, achievements, referrals → mover a sidebar secundaria o sección "Más"
- Dashboard de inicio reducido a: **Hoy en mi calendario** (próximo entreno + próximas comidas) + **Estado de sincronización**
- Settings añade tab "Calendario" con la conexión Google y la pantalla "Mi semana real"

## 5. Detalles técnicos

**Nueva tabla `user_schedule`**
```
user_id uuid (PK)
busy_blocks jsonb  -- [{day:1, start:"09:00", end:"17:00", label:"Trabajo"}, ...]
gym_slots jsonb    -- [{day:1, start:"18:00", duration:75}, ...]
meal_times jsonb   -- {breakfast:"08:00", snack_am:"11:00", lunch:"14:00", snack_pm:"17:30", dinner:"21:00"}
meal_duration_min int default 30
created_at, updated_at
```
RLS: usuarios manejan solo su fila; admins ven todas.

**Nueva tabla `google_calendar_tokens`**
```
user_id uuid (PK)
access_token text, refresh_token text, expires_at timestamptz
calendar_id text default 'primary'
last_sync_at timestamptz
sync_enabled bool
```
RLS: solo el dueño puede leer/escribir.

**Nuevas Edge Functions**
- `gcal-oauth-start` — devuelve URL de autorización de Google
- `gcal-oauth-callback` — intercambia code por tokens, guarda en BD
- `gcal-sync` — sincroniza plan completo del usuario (idempotente, usa UID estable por evento)
- `gcal-disconnect` — revoca y borra tokens

**Edge Function existente `calendar-feed`** (ICS):
- Leer de `user_schedule` para horas reales
- Incluir eventos de nutrición (leer `nutrition_plan.meals_json`)
- Añadir recordatorios semanales

**Secrets a añadir** (te lo pediré cuando empiece): `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`. Te guiaré paso a paso por Google Cloud Console (10 min).

**Frontend nuevo**
- `src/pages/MySchedule.tsx` — pantalla "Mi semana real" con grid semanal visual
- `src/components/dashboard/GoogleCalendarConnect.tsx` — card con estado conectado/desconectado, botón sync manual, último sync
- Refactor de `CalendarExportDialog.tsx` — añadir tab OAuth + tab ICS
- Refactor de `Dashboard.tsx` y `HomeOverview.tsx` — layout desktop-first, foco en sync

## Fuera de alcance (para fases posteriores)
- App móvil nativa
- Push notifications propias
- Integración con Apple Calendar OAuth (Apple solo soportará ICS)

## Lo que NO se toca
- Generador de plan (`generate-plan`) — sigue funcionando, solo cambia de dónde lee horarios
- Lógica de pago / Stripe
- Onboarding (los datos siguen sirviendo, "Mi semana real" amplía la disponibilidad)

## Orden de implementación sugerido (ya en build mode)
1. Tabla `user_schedule` + pantalla "Mi semana real"
2. Refactor desktop-first del Dashboard
3. Ampliar `calendar-feed` ICS (nutrición + nuevos horarios + recordatorios)
4. OAuth Google Calendar (pediré secrets aquí)
5. Sync push automático cuando cambie el plan

¿Avanzamos así?
