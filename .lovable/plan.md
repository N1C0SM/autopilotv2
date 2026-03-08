

## Plan: Mejorar la app web actual para validar pagos

Tienes razón — la app ya está en la web, funciona en PC y móvil desde el navegador, y ya tiene todo el flujo: landing, pago con Stripe, onboarding, admin que crea planes, y dashboard donde el usuario los ve. No necesitas app móvil ni PWA para validar.

Lo que necesitas es **pulir lo que ya existe** para que el flujo sea impecable y la gente pague. Propongo estas mejoras concretas:

### 1. Simplificar pricing (menos fricción)
- Reducir de 3 tiers a **1 precio claro** (ej: €19/mes o €29/mes) en `tiers.ts` y `PricingTiers.tsx`
- Landing con un solo CTA: "Prueba 7 días gratis → €X/mes"
- Eliminar feature gating (`LockedFeature`) del dashboard — todos reciben lo mismo

### 2. Mejorar onboarding (recoger más datos para personalizar)
- Añadir campos que faltan: **sexo**, **lesiones/condiciones**, **nivel de intensidad** (slider), **tipo corporal**
- Hacer los pasos más visuales con chips seleccionables en vez de inputs de texto
- Migración DB: añadir columnas `sex`, `injuries`, `intensity_level` a tabla `onboarding`

### 3. Plantillas de planes para admin (crear planes en 2 minutos)
- Añadir botón "Cargar plantilla" en `TrainingPlanForm` con templates predefinidos:
  - PPL (Push/Pull/Legs), Full Body 3 días, Upper/Lower 4 días
- Cada plantilla carga días + ejercicios de la biblioteca automáticamente
- El admin solo ajusta pesos/reps según el usuario
- Plantillas de macros según objetivo (ganar músculo, perder grasa, mantenimiento) que auto-calculan según peso del usuario

### 4. Dashboard usuario más limpio
- Quitar `LockedFeature`, `Achievements`, `ProgressCharts`, `ReferralShare` — no aportan valor para validar
- Dejar solo: **plan de entrenamiento + plan de nutrición + chat** (si lo tienes)
- Pantalla "plan pendiente" más atractiva con estimación de tiempo

### 5. Landing optimizada para conversión
- Hero más directo enfocado en dolor → solución
- Sección "Cómo funciona" simplificada (3 pasos)
- Testimonios más prominentes
- CTA fijo en móvil (sticky bottom)
- FAQ actualizado

### Archivos principales a modificar
- `src/config/tiers.ts` — simplificar a 1 tier
- `src/pages/Index.tsx` — landing optimizada
- `src/pages/Onboarding.tsx` — más campos, UX visual
- `src/pages/Dashboard.tsx` — simplificar, quitar feature gating
- `src/components/admin/TrainingPlanForm.tsx` — plantillas predefinidas
- `src/components/admin/UserDetail.tsx` — macro templates
- `src/components/PricingTiers.tsx` — simplificar

### Base de datos
- Migración: añadir `sex`, `injuries`, `intensity_level` a tabla `onboarding`

### Resultado
Flujo limpio: **Landing → Pago (1 precio) → Onboarding (datos completos) → Admin crea plan rápido con plantillas → Usuario ve su plan**

