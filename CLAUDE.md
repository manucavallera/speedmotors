# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.


# SpeedMotors -- Guia tecnica Claude (Protocolo Caveman + RTK)

## Stack & Context
- **Backend:** NestJS 11, Drizzle ORM, PostgreSQL (Docker).
- **Frontend:** React 19, Vite, TanStack Query v5, React Router v7.
- **Tooling:** rtk (Binary Compressor) + OpenWolf (Monitoring).
- **Domain:** Gestion de stock de motos y lanchas.

## Token Discipline (OBLIGATORIO)
1. **rtk Prefix:** Usar el binario `rtk` para CUALQUIER inspeccion.
   - Ejemplos: `rtk ls`, `rtk cat [file]`, `rtk grep`, `rtk npm test`.
2. **No Yapping:** Prohibido explicar el codigo o hacer intros/outros. Si funciona, no se habla.
3. **Diffs Only:** Mostrar solo bloques de codigo modificados. Prohibido reescribir archivos completos.
4. **Logic First:** Una sola linea de explicacion tecnica antes de cada bloque de codigo.

## Reglas de Codigo (Patrones del Proyecto)
- **TypeScript:** Estricto, sin `any`.
- **Drizzle:** Unica fuente de verdad en `apps/backend/src/db/schema.ts`. No usar SQL crudo.
- **Mutations:** Usar siempre `useMutation` + `invalidateQueries` de TanStack Query para mantener el estado sincronizado.
- **Styles:** Usar **inline styles** exclusivamente (patron existente). No agregar librerias de CSS externas.
- **Idioma:** Responder en español rioplatense, terminos tecnicos en ingles.

## Protocolo de Sesion
Al iniciar, cargar: `CLAUDE.md`, `.claude/COMMON_MISTAKES.md`, `.claude/QUICK_START.md`, y `.claude/ARCHITECTURE_MAP.md`.
