# Mantenimiento de documentacion -- SpeedMotors

## Cuando actualizar COMMON_MISTAKES.md
- Bug critico que llevo mas de 30 min a resolver
- Error que se repitio en 2 sesiones distintas
- Gotcha de Drizzle / NestJS / TanStack Query descubierto en produccion
- Regla de negocio que rompio algo (ej: vehicles vendidos no disponibles)

## Cuando crear un completion doc (.claude/completions/)
- Al terminar cualquier tarea de mas de 3 archivos modificados
- Al implementar un feature completo
- Usar template: .claude/templates/completion-template.md
- Nombre: YYYY-MM-DD_nombre-feature.md

## Cuando crear un session doc (.claude/sessions/active/)
- Sesiones largas con contexto que debe continuar
- Tareas que quedan a medias
- Usar template: .claude/templates/session-template.md
- Al terminar la sesion: mover a sessions/archive/

## Cuando archivar (docs/archive/)
- Docs de planificacion ya ejecutados
- POC o experimentos descartados
- Archivos supersedidos por una version nueva

## Cuando actualizar LEARNINGS_INDEX.md
- Decision de arquitectura tomada (ej: "elegimos X sobre Y porque Z")
- Patron nuevo establecido en el proyecto
- Cambio de criterio en logica de negocio

## Cuando actualizar docs/learnings/[tema].md
- Patron nuevo probado y funcionando
- Anti-patron confirmado con ejemplo real
- Optimizacion medida con resultado concreto

## Decision tree
Termine una tarea grande?     -> crear completion doc
Sesion queda incompleta?      -> crear session doc en active/
Encontre un bug nuevo?        -> agregar a COMMON_MISTAKES.md
Tome una decision importante? -> agregar a LEARNINGS_INDEX.md
Archivo ya no es relevante?   -> mover a docs/archive/
