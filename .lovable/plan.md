

## Elección Mensual / Anual en Onboarding + Cambio en Settings

Ahora mismo:
- El onboarding manda al checkout **siempre en mensual** (no pasa el parámetro `plan` a `create-checkout`).
- Settings solo tiene un botón "Gestionar suscripción" que abre el portal de Stripe — el usuario no ve la opción anual de forma nativa.

La función `create-checkout` ya soporta `plan: "yearly"`, los precios anuales están guardados en `settings`, y el componente `PricingTiers` ya tiene el toggle Mensual/Anual perfecto. Solo falta conectarlo bien.

### 1. Onboarding → mostrar paywall con elección antes del checkout

En `src/pages/Onboarding.tsx`, dentro de `handleSubmit`, cuando el usuario no está pagado:
- En vez de invocar `create-checkout` directamente, **mostrar un paso final tipo paywall** con `<PricingTiers />` (el mismo componente que ya existe).
- El usuario elige Mensual (19€ con 7 días gratis) o Anual (190€, ahorra 38€).
- Al hacer click → invoca `create-checkout` con `{ referral_code, plan: "monthly" | "yearly" }`.

Implementación concreta:
- Añadir un estado `showPaywall: boolean`.
- Tras el upsert exitoso del onboarding, si `payment_status !== "paid"` → setear `showPaywall = true` en lugar de llamar al checkout.
- Renderizar condicionalmente: si `showPaywall` → pantalla con título "Elige tu plan" + `<PricingTiers onSelect={(plan) => goToCheckout(plan)} />`.
- `goToCheckout(plan)` invoca `create-checkout` con el plan elegido y redirige a la URL.

### 2. Settings → permitir cambiar de plan (mensual ↔ anual)

En `src/components/SettingsPanel.tsx`, dentro de la sección "Suscripción":
- Añadir, debajo del estado actual de la suscripción, un bloque **"Cambiar de plan"** visible solo si el usuario tiene suscripción activa (`isActive`).
- Detectar el plan actual leyendo el periodo de la suscripción. Como no lo tenemos almacenado, hacer una llamada a `check-subscription` (ya existe) y leer el `subscription_end` o el `price_id` para inferir si es mensual o anual.

Implementación concreta:
- En la función `check-subscription` (`supabase/functions/check-subscription/index.ts`), añadir al payload de respuesta el campo `plan: "monthly" | "yearly" | null` comparándolo con los `price_id_*` y `price_id_yearly_*` de la tabla `settings`.
- En `SettingsPanel`, guardar `currentPlan` en estado y mostrar:
  - Si `currentPlan === "monthly"` → botón "Cambiar a Anual (ahorra 38€/año)" 
  - Si `currentPlan === "yearly"` → botón "Cambiar a Mensual"
- Click → abre `customer-portal` (Stripe) **con configuración de upgrade/downgrade** O bien invoca un nuevo endpoint que use `stripe.subscriptions.update()` para cambiar el `price_id` directamente.

**Decisión recomendada**: usar el portal de Stripe (más seguro, gestiona prorrateo automáticamente). El portal ya permite cambiar de plan si los precios están agrupados en el mismo producto en Stripe — lo cual es nuestro caso (`prod_U729ZYgVubAkcE`).

Por eso, lo más limpio es:
- Mantener un único botón "Gestionar suscripción" que abre el portal.
- **Añadir un texto informativo** debajo: *"Plan actual: Mensual (19€/mes) · Puedes cambiar a Anual (190€/año, ahorras 38€) desde el portal de gestión."*
- Esto evita complejidad y aprovecha el flujo nativo de Stripe.

### 3. Backend — extender check-subscription para devolver el plan

Actualizar `supabase/functions/check-subscription/index.ts`:
- Tras detectar la suscripción activa, leer la tabla `settings` y comparar el `price_id` de la suscripción con `price_id_test/live` (mensual) y `price_id_yearly_test/live` (anual).
- Devolver `plan: "monthly" | "yearly" | null` además de los campos actuales.

### Archivos a modificar

- `src/pages/Onboarding.tsx` → añadir paso paywall con `<PricingTiers />` antes de llamar a checkout.
- `src/components/SettingsPanel.tsx` → mostrar plan actual y mensaje informativo sobre cómo cambiar.
- `src/contexts/AuthContext.tsx` → si almacena el resultado de `check-subscription`, exponer el nuevo campo `plan`.
- `supabase/functions/check-subscription/index.ts` → calcular y devolver `plan: "monthly" | "yearly"`.

### Fuera de alcance (v1)

- No cambiamos el `subscription_data.trial_period_days` para anual — sigue siendo 0 (anual sin trial, mensual con 7 días).
- No creamos un endpoint propio de "swap plan" — delegamos en el portal de Stripe.

