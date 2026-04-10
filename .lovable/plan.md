

## Rediseño de la sección "Ejercicios" del Admin

La interfaz actual es funcional pero densa: una lista plana con badges pequeños, formulario de creación apretado en grid, y todo dentro de un único collapsible. El rediseño la convertirá en una experiencia más visual y organizada.

### Cambios planificados

**1. Layout con barra de búsqueda y filtros**
- Barra de búsqueda prominente en la parte superior con icono de lupa
- Filtros rápidos por grupo muscular como chips/tabs horizontales scrollables (Pecho, Espalda, Hombros, etc.) con contador de ejercicios por grupo
- Filtro adicional por tipo (Calistenia/Gimnasio/Mixto)

**2. Tarjetas de ejercicio en grid**
- Reemplazar la lista plana por cards en grid responsive (2-3 columnas)
- Cada card muestra: nombre destacado, grupo muscular con icono de color, badges visuales para nivel/prioridad/estímulo con colores diferenciados
- Indicador visual de prioridad (borde dorado para "Base", neutro para el resto)
- Botones de editar/eliminar visibles con hover elegante

**3. Modal/Dialog para crear y editar**
- Mover el formulario de "Nuevo ejercicio" a un Dialog/Sheet que se abre con un botón FAB o botón prominente "+"
- El mismo Dialog se reutiliza para edición
- Campos mejor organizados en secciones: Info básica, Clasificación, Parámetros de generación

**4. Mejoras visuales**
- Badges con colores semánticos: nivel (verde/amarillo/rojo), prioridad (dorado/gris), estímulo (azul/morado/naranja)
- Contador total de ejercicios y por grupo visible
- Animaciones suaves de entrada con framer-motion
- Empty state más visual cuando no hay ejercicios

### Archivo a modificar
- `src/components/admin/ExerciseLibrary.tsx` — reescritura completa del componente

### Resultado
Una biblioteca de ejercicios con aspecto premium: filtrable, con cards visuales, formularios en modal, y badges de colores que hacen la información legible de un vistazo.

