

## Vista Calendario por Usuario en Admin

Quiero añadir una pestaña **"Calendario"** en el detalle de cada usuario del panel de admin, con la misma vista tipo Google Calendar que usa el cliente, pero operando sobre los datos de **ese usuario concreto** y con permisos de admin para crear, mover, editar y borrar entrenos y actividades.

### Lo que verás en Admin → Usuario

Nueva pestaña `📅 Calendario` (junto a Info, Progreso, Entreno, Nutrición, Chat) — solo visible si el usuario está pagado.

Dentro:
- Vista **Semana / Mes / Día** (FullCalendar) con los entrenos del plan + actividades externas + actividades personales del usuario.
- **Drag & drop** para mover entrenos del plan a otro día/hora → guarda en `training_schedule_overrides` del usuario.
- **Drag & drop** para mover actividades externas (boxeo, escalada, "salir con amigos"…) → guarda en `external_activities`.
- **Click en hueco vacío** → abre modal para crear actividad nueva en el calendario del usuario.
- **Click en evento** → ver detalle, editar o borrar.
- Banner superior: *"Estás editando el calendario de [email]"* para evitar confusión.

### Cambios técnicos

**1. Refactor de `CalendarView.tsx`**
- Añadir prop opcional `targetUserId?: string`. Si viene definida → modo admin (opera sobre ese user). Si no → modo cliente (usa `useAuth().user.id` como hasta ahora).
- Añadir prop `isAdminMode?: boolean` para mostrar el banner contextual y desactivar el `seedFromOnboarding` automático (en admin no auto-sembramos para no contaminar).
- Reemplazar todos los `user.id` internos por una variable `effectiveUserId = targetUserId ?? user?.id`.
- El canal realtime también filtra por `effectiveUserId`.

**2. Nueva pestaña en `UserDetail.tsx`**
- Añadir `<TabsTrigger value="calendar">` con icono `Calendar` de lucide-react.
- Cambiar `grid-cols-5` → `grid-cols-6` cuando el usuario está pagado.
- Nuevo `<TabsContent value="calendar">` que renderiza `<CalendarView dayPlans={dayPlans} targetUserId={profile.user_id} isAdminMode />`.

**3. RLS — políticas de admin**

Las tablas `external_activities` y `training_schedule_overrides` **solo tienen una policy `ALL` filtrada por `auth.uid() = user_id`**, lo que significa que el admin **no puede** leer ni escribir el calendario de otros usuarios.

Migración necesaria — añadir en ambas tablas:
```sql
CREATE POLICY "Admins manage all external_activities"
  ON public.external_activities FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage all training_schedule_overrides"
  ON public.training_schedule_overrides FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

Esto permite al admin SELECT/INSERT/UPDATE/DELETE sobre cualquier usuario sin tocar la policy del cliente.

**4. Detalles de UX**
- Cuando admin crea una actividad, el `user_id` que se inserta es `targetUserId`, no el del admin.
- El usuario verá el cambio en tiempo real en su dashboard (el realtime ya está montado).
- Toast: "Actividad añadida al calendario de [email]".

### Archivos a modificar

- `src/components/dashboard/CalendarView.tsx` → añadir props `targetUserId` + `isAdminMode`, sustituir referencias de `user.id`.
- `src/components/admin/UserDetail.tsx` → añadir pestaña Calendario.
- Nueva migración SQL → policies de admin para `external_activities` y `training_schedule_overrides`.

### Fuera de alcance (v1)
- No modifica el `training_plan` original (los días del plan); solo aplica overrides de horario.
- No edita el contenido de los ejercicios desde el calendario (eso ya está en la pestaña Entreno).

