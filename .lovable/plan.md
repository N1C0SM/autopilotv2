## Objetivo

Hacer el editor de emails (`/admin` → Emails) mucho más legible:

1. Separar **HTML** y **CSS** en dos editores (nada de `style="..."` inline en el editor).
2. **Formatear automáticamente** la plantilla al abrirla (sin pulsar "Formatear").
3. **Colapsar todo** automáticamente al abrirla (fold all).
4. Los corchetes `<` y `>` se quedan en la **misma línea** que la etiqueta (no se rompen).

---

## Cambios

### 1. Dos editores: HTML y CSS

- Nuevo estado `css` además de `html`.
- Al cargar la plantilla, **extraer todo el CSS inline** (`style="..."` de cada elemento) → generar clases auto (`.s1`, `.s2`, …, reutilizando cuando el style sea idéntico) → meter las reglas en el editor CSS y reemplazar el atributo `style` por `class` en el HTML.
- También extraer cualquier bloque `<style>…</style>` existente al editor CSS.
- UI: dos pestañas dentro del bloque "HTML del email" → **HTML** | **CSS**, cada una con su Monaco propio (lenguajes `html` y `css`).
- Al **guardar**: re-inline el CSS de vuelta a `style="..."` (usando un mini-inliner: resolver cada `class` por sus reglas y volcarlas como inline styles) para que el email siga llegando 100 % compatible con Gmail/Outlook, que ignoran `<style>`. El admin edita limpio, el destinatario recibe inline.
- En la preview (BroadcastChannel) se envía el HTML ya re-inlinado en tiempo real para que coincida con lo que se enviará.

### 2. Auto-formato al cargar

- Tras `setHtml(...)` en `load()` y en `loadDefault()`, llamar a Prettier automáticamente sobre HTML y CSS antes de pintarlo.
- Quitar el botón "Formatear" o dejarlo como acción manual opcional.

### 3. Collapse all al cargar

- En `handleEditorMount` y cada vez que cambia `value` por carga (no por tecleo del user), ejecutar:
  ```
  editor.getAction('editor.foldAll').run()
  ```
- Se hace en ambos editores (HTML y CSS).

### 4. Brackets en la misma línea

Configurar Prettier con:
- `bracketSameLine: true` (el `>` se queda pegado a la última atributo, no salta de línea).
- `singleAttributePerLine: false` (atributos no se rompen uno por línea).
- `htmlWhitespaceSensitivity: "ignore"`.

Resultado típico:
```html
<div class="s1">
  <p class="s2">Hola {{name}}</p>
</div>
```
en vez de
```html
<div
  class="s1"
>
```

---

## Archivos a tocar

- `src/components/admin/EmailTemplatesEditor.tsx` — refactor a dos editores + extracción/re-inline de CSS + auto-format + foldAll.
- Pequeño módulo auxiliar nuevo: `src/components/admin/email-style-utils.ts` con dos funciones puras:
  - `extractInlineStyles(html) → { html, css }` (atributos `style` → clases auto, dedupe).
  - `reinlineStyles(html, css) → html` (clases → `style="..."` para envío real).

---

## Notas técnicas

- **No tocamos los templates `.tsx` de React Email** ni el send-path. La extracción/re-inline ocurre solo en el override del admin, así el HTML que se persiste en `email_template_overrides` sigue siendo 100 % inline (compatible con todos los clientes).
- La parity-test ya existente seguirá pasando porque compara HTML normalizado renderizado, no el formato de edición.

---

## Confirmación rápida

¿Te vale que el HTML guardado en BD siga siendo inline (para compatibilidad Gmail/Outlook) y el split HTML/CSS sea **solo en la vista del editor**? Si quisieras guardar también con `<style>` separado el riesgo es que Gmail descarte estilos y el email se vea roto.
