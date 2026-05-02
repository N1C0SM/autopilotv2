## Objetivo

Que cuando el usuario abra **su Google Calendar**, vea su semana real perfectamente organizada — entrenos en su hora, 5 comidas con kcal/macros propios, recordatorios — y que se mantenga sincronizado solo cuando edita "Mi semana real" o regenera plan, **sin solapes**.

## Cambios

### 1. `supabase/functions/gcal-sync/index.ts` — sync más inteligente

**a) Macros y kcal por comida** (no solo total diario)
- Leer `meal.kcal`, `meal.protein`, `meal.carbs`, `meal.fats` desde `meals_json` si existen.
- Si no vienen por comida, dividir el total diario (`macros_json`) entre el número de comidas activas, redondeando.
- Descripción de cada evento: `"450 kcal · 35g P · 50g C · 12g G\n\n<descripción de la comida>"`.

**b) Resolver conflictos moviendo el ENTRENO** (decisión del usuario)
- Construir primero los slots de comidas (son fijos por preferencia del usuario).
- Para cada entreno, comprobar solape con cualquier comida del mismo día.
- Si solapa: mover el entreno al **siguiente hueco libre** del día (probar +30min, +60min, +90min hasta encontrar hueco que no choque con ninguna comida ni `busy_blocks`). Tope: 22:00; si no cabe, dejar la hora original y añadir aviso al `errors[]` para que el frontend lo muestre.
- La hora final se refleja en el evento de Google Calendar.

**c) Recurrencia desde el lunes de esta semana**, no desde "el próximo día X"
- Cambiar `nextDateForDayHM` por una función `thisWeekDayHM(dow, h, m)` que ancle siempre al lunes de la semana actual. Así el usuario ve la semana en curso completa al instante.

**d) Pequeñas mejoras**
- Evitar generar eventos de comida cuyo slot no exista en `meals_json` (ya está, mantener).
- Añadir `colorId` distinto para entrenos (`9` graphite/azul) y comidas (`10` verde) y recordatorios (`5` amarillo) para que visualmente se distingan en Google Calendar.

### 2. Auto-sync al guardar "Mi semana real" — `src/pages/MySchedule.tsx`

- Tras `upsert` exitoso de `user_schedule`, comprobar si existe registro en `google_calendar_tokens` para el usuario.
- Si existe: invocar `supabase.functions.invoke('gcal-sync')` en background (sin bloquear el guardado) y mostrar toast secundario `"Calendario sincronizado · X eventos"` o `"No se pudo sincronizar el calendario"` si falla.
- Si no hay token: silencio, no molestar.

### 3. Edge function `generate-plan` (ya dispara sync) — verificar
- Confirmar que el invoke a `gcal-sync` con service-role pasa el `user_id` correcto. Sin cambios si ya está bien.

## Detalles técnicos

**Algoritmo de resolución de conflicto** (en `gcal-sync`):
```text
para cada entreno del día D:
  candidates = [hora_original, +30, +60, +90, +120, +150, +180]
  para cada candidate hasta 22:00:
    si no solapa con ninguna meal[D] y no solapa con busy_blocks[D]:
      usar candidate; break
  si ninguno cabe:
    usar hora_original y añadir errors.push("⚠️ Entreno X solapa con comidas")
```

**Macros por comida (fallback)**:
```text
si meal.kcal existe → usar meal.kcal/protein/carbs/fats
sino:
  per_meal_kcal = round(macros.kcal / activeMealsCount)
  per_meal_protein = round(macros.protein / activeMealsCount)
  ...
```

**Anclar a semana actual**:
```text
function thisWeekDayHM(dow, h, m):
  hoy = new Date()
  diasDesdeLunes = (hoy.getDay() + 6) % 7
  lunes = hoy - diasDesdeLunes días
  offset = (dow + 6) % 7  // Lun=0...Dom=6
  return lunes + offset días, set HH:MM
```

## Archivos modificados

- `supabase/functions/gcal-sync/index.ts` — macros por comida, anti-solape de entrenos, anclaje semanal, colorId.
- `src/pages/MySchedule.tsx` — invoke `gcal-sync` tras guardar si hay token conectado.

## Fuera de alcance (no se toca)

- Cron diario nocturno (descartado: el usuario solo quiere sync tras guardar Mi semana real + el ya existente tras `generate-plan`).
- Edición bidireccional (si el usuario mueve un evento en Google, no se refleja en Autopilot).
- Cambios en el panel de Settings (ya tiene "Conectar / Sincronizar / Desconectar").
