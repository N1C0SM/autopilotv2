

## Plan revisado: Conversión y retención para plataforma de coaching online

La app no es un tracker de gym. Es una web donde el usuario paga por un servicio de coaching y consulta qué entrenar y qué comer. El valor está en el plan personalizado + acceso al entrenador.

---

### A. Conversión (Onboarding → Pago)

**1. Resumen pre-pago al final del onboarding**
- Después del último paso del cuestionario, mostrar una pantalla resumen antes de redirigir a Stripe
- Contenido personalizado con los datos que acaba de rellenar: "Tu plan personalizado: rutina de 4 días · dieta de 2200 kcal · chat directo con tu entrenador"
- Archivo: `Onboarding.tsx` (nuevo paso final)

**2. Mejorar CTAs de la landing**
- Cambiar textos genéricos por copy más directo: "Recibe tu plan en 24h", "Solo tardas 2 minutos"
- Hacer el CTA principal más visible y urgente
- Archivo: `Index.tsx`

---

### B. Retención (que vuelvan a abrir la web)

**3. Greeting contextual**
- Mejorar el saludo del dashboard con mensajes basados en tiempo como cliente y actividad
- Ej: "Llevas 3 semanas con tu plan. ¿Alguna duda? Escríbeme por el chat"
- Archivo: `Greeting.tsx`

**4. Widget de resumen en Home**
- Añadir en HomeOverview un mini-resumen: semanas activo, días de plan completados (usando `day_completions`)
- Da sensación de progreso y justifica la renovación
- Archivo: `HomeOverview.tsx`

**5. Email de reactivación (opcional)**
- Edge function programada que envía email si el usuario no ha abierto la web en X días
- Mensaje tipo "Tu plan de esta semana te espera"
- Nueva edge function `send-reminder`

---

### Resumen técnico

| Cambio | Archivos | DB |
|---|---|---|
| Resumen pre-pago | `Onboarding.tsx` | No |
| CTAs landing | `Index.tsx` | No |
| Greeting contextual | `Greeting.tsx` | No |
| Widget resumen Home | `HomeOverview.tsx` | No |
| Email reactivación | Nueva edge function | No |

Prioridad recomendada: 1 → 2 → 3 → 4 → 5

