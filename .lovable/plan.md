## Objetivo

Para usuarios logueados que ya tienen un físico objetivo guardado (`onboarding.goal_photo_url`), no mostrar la galería + uploader en `/scan`. Mostrar tarjeta compacta con el objetivo actual y un botón **"Cambiar objetivo"** que reabre el selector si quieren modificarlo.

## Cambios en `src/pages/Scan.tsx`

1. **Cargar objetivo guardado**: en el efecto que ya lee `userEmail`/`userName`, añadir lectura de `onboarding.goal_photo_url`. Estado nuevo `savedObjectiveUrl: string | null`.

2. **Auto-precargar**: si `savedObjectiveUrl` existe y `objectiveImg` está vacío → `setObjectiveImg(savedObjectiveUrl)`. Así el análisis ya lo incluye sin tocar nada.

3. **Estado UI**: `editingObjective: boolean` (default `false`).

4. **Render condicional** del bloque "Físico objetivo" (líneas 919–1029):
   - Si `user && savedObjectiveUrl && !editingObjective` → tarjeta compacta:
     - Thumbnail del objetivo (80×100)
     - Texto: "Tu objetivo actual · la IA lo usará para estimar meses"
     - Botón `Cambiar objetivo` → `editingObjective = true`
     - Botón secundario `Quitar para este scan` → limpia `objectiveImg` y abre selector
   - Resto de casos (anónimo, usuario sin objetivo, o `editingObjective === true`) → selector completo actual sin cambios.

## Fix paralelo (silencioso) en `supabase/functions/analyze-physique/index.ts`

El edge function está fallando con 500 porque el modelo devuelve `null` en `body_composition.lean_mass_kg` y `weight_kg`. Ajustar el schema: envolver cada campo numérico de `body_composition` con `z.preprocess((v) => (v == null ? undefined : Number(v)), z.number()...optional())` para que `null` se trate como ausente en vez de error.

## Fuera de alcance

- No se persiste el nuevo objetivo elegido en `onboarding.goal_photo_url` (sigue siendo flujo de onboarding/settings).
- No se toca el modo visitante anónimo.
