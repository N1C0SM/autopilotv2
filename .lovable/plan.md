

## Ampliar la tabla de ejercicios con campos avanzados

### Cambios necesarios

**1. Migración de base de datos** — Añadir 8 columnas nuevas a la tabla `exercises`:

```sql
ALTER TABLE exercises
  ADD COLUMN exercise_type text,        -- Calistenia, Gimnasio, Mixto
  ADD COLUMN movement_pattern text,     -- Empuje, Tirón, Sentadilla, Bisagra, Core
  ADD COLUMN level integer DEFAULT 1,   -- 1 básico, 2 intermedio, 3 avanzado
  ADD COLUMN priority integer DEFAULT 2,-- 1 base, 2 desarrollo, 3 accesorio
  ADD COLUMN stimulus_type text,        -- Fuerza, Hipertrofia, Resistencia, Isométrico
  ADD COLUMN load_level text,           -- Alta, Media, Baja
  ADD COLUMN fatigue_level text,        -- Alta, Media, Baja
  ADD COLUMN recommended_order integer DEFAULT 2; -- 1 inicio, 2 medio, 3 final
```

**2. Actualizar `src/types/training.ts`** — Ampliar la interfaz `Exercise` con los nuevos campos.

**3. Actualizar `src/components/admin/ExerciseLibrary.tsx`** — Formulario de alta con todos los campos nuevos (selects para cada uno) y mostrar los atributos en la lista.

**4. Actualizar `supabase/functions/generate-plan/index.ts`** — El generador usará los nuevos campos para:
- Filtrar por `exercise_type` según equipamiento del usuario (si tiene gym o no)
- Ordenar ejercicios por `recommended_order` (base primero, accesorios al final)
- Filtrar por `priority` (siempre incluir ejercicios base, luego desarrollo, luego accesorios)
- Ajustar series/reps según `stimulus_type` (fuerza: 5x5, hipertrofia: 4x10, resistencia: 3x15)
- Controlar fatiga acumulada por sesión usando `fatigue_level`
- Filtrar por `level` según la experiencia/intensidad del usuario

**5. Actualizar `src/components/admin/TrainingPlanForm.tsx`** — Mostrar los nuevos atributos del ejercicio cuando se selecciona en el formulario de plan manual.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| Tabla `exercises` (migración) | +8 columnas |
| `src/types/training.ts` | Ampliar interfaz Exercise |
| `src/components/admin/ExerciseLibrary.tsx` | Formulario con todos los campos |
| `supabase/functions/generate-plan/index.ts` | Lógica inteligente de selección |
| `src/components/admin/TrainingPlanForm.tsx` | Mostrar atributos en selector |

