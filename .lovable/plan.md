## Objetivo

Cuando la app corre como **nativa (Capacitor)**, la ruta `/` muestra una pantalla **Welcome** propia (Bienvenido + Crear cuenta / Iniciar sesión). En la **web** (navegador, móvil o desktop) la ruta `/` sigue mostrando exactamente el `Index` actual (landing de marketing). Cero duplicación de proyecto, misma codebase.

## Dirección visual elegida: **Minimal premium**

Es la que mejor pega con el resto de Autopilot (Dashboard, MobileAppShell, Greeting, Paywall): tipografía display grande, fondo oscuro con halo del color primario, mucho aire, CTA sticky abajo respetando safe-area. Sin carrusel ni hero photo (eso ya lo tienes en la landing web).

```
┌─────────────────────────────┐
│        [safe-area]          │
│                             │
│         ●  logo             │
│         Autopilot           │
│                             │
│                             │
│    Tu entrenador y          │  ← display, 2 líneas
│    nutricionista,           │
│    en automático.           │
│                             │
│    Plan personalizado.      │  ← muted
│    7 días gratis.           │
│                             │
│                             │
│  ┌───────────────────────┐  │
│  │   Crear cuenta    →   │  │  ← primario, 56px
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │   Ya tengo cuenta     │  │  ← ghost outline
│  └───────────────────────┘  │
│   Al continuar aceptas…     │  ← legal 11px
│        [safe-area]          │
└─────────────────────────────┘
```

Animación: fade + subtle Y al entrar (framer-motion, 0.4s, stagger en logo → headline → subtítulo → botones). Halo radial del primary detrás del logo.

## Lógica de routing

Helper nuevo `src/lib/platform.ts`:
```ts
import { Capacitor } from "@capacitor/core";
export const isNativeApp = () => Capacitor.isNativePlatform();
```

En `App.tsx`, ruta `/` pasa de `<Index />` a un wrapper:
```
/  →  isNativeApp() ? <Welcome /> : <Index />
```

Dentro de `Welcome`:
- Si `useAuth().user` ya existe → `<Navigate to="/dashboard" replace />` (sin parpadeo, mientras `loading` muestra el mismo spinner que `ProtectedRoute`).
- Botón **Crear cuenta** → `navigate("/signup")`.
- Botón **Ya tengo cuenta** → `navigate("/login")`.

Las páginas `/signup`, `/login`, `/onboarding` ya existen y funcionan en móvil — no se tocan en este plan, salvo asegurar safe-area top en sus headers si hiciera falta (pequeño ajuste de padding, no rediseño).

## Login social

Incluyo el botón **Continuar con Google** en Welcome (encima de "Ya tengo cuenta"), porque ya tienes Google auth configurado y en nativo es el flujo más rápido. Usa el mismo `signInWithOAuth` del `AuthContext`. Si más adelante quieres Apple nativo (requisito de App Store si hay otros social logins), lo añadimos en otra iteración.

## Qué se crea / edita

- **Nuevo** `src/pages/Welcome.tsx` — pantalla descrita arriba.
- **Nuevo** `src/lib/platform.ts` — helper `isNativeApp()`.
- **Edit** `src/App.tsx` — ruta `/` envuelta en componente que decide Welcome vs Index.
- **Edit** `src/main.tsx` — sin cambios funcionales (ya inicializa nativo).
- **Memoria** — añado entrada `mem://auth/welcome-native-screen` describiendo la regla "Welcome solo en Capacitor nativo, web sigue con Index".

## Qué NO se toca

- `src/pages/Index.tsx` (landing pública) intacto.
- Web móvil en navegador → sigue viendo la landing actual.
- Onboarding, paywall, Dashboard, MobileAppShell, Stripe, edge functions, backend → cero cambios.
- SEO de la landing → intacto (Welcome no se indexa porque solo existe en app nativa).

## Cómo se prueba

- **En el editor**: la preview es web, así que `/` seguirá mostrando el Index actual. Esto es lo correcto.
- **En la app nativa** (cuando hagas `npx cap run ios/android`): al abrir verás directamente Welcome. Para forzar la prueba en preview web sin compilar, puedo dejar un override por query param `?native=1` que activa el modo Welcome — dímelo si lo quieres y lo añado.

¿Apruebo y construyo?
