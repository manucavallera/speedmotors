# SpeedMotors -- Guia tecnica Claude

## Que es este proyecto
Sistema de gestion para concesionaria de motos y lanchas.
NestJS 11 (backend) + React 19/Vite (frontend) + Drizzle ORM + PostgreSQL + Docker.

## Protocolo de inicio de sesion (OBLIGATORIO)
Cargar estos 4 archivos al inicio (~800 tokens):
1. CLAUDE.md (este)
2. .claude/COMMON_MISTAKES.md  -- errores criticos
3. .claude/QUICK_START.md      -- comandos esenciales
4. .claude/ARCHITECTURE_MAP.md -- mapa del proyecto

Luego cargar solo lo necesario para la tarea (ver docs/INDEX.md).

NUNCA auto-cargar:
- .claude/completions/**   -- 0 tokens hasta que el usuario lo pida
- .claude/sessions/**      -- 0 tokens hasta que el usuario lo pida
- docs/archive/**          -- 0 tokens hasta que el usuario lo pida

## Stack
- Backend : NestJS 11, Drizzle ORM, PostgreSQL (Docker), JWT/Passport
- Frontend: React 19, Vite, TanStack Query v5, React Router v7, jsPDF, qrcode
- Monorepo : npm workspaces (apps/backend, apps/frontend)

## Comandos rapidos
npm run dev:backend            # nest start --watch (:3000)
npm run dev:frontend           # vite (:5173)
docker-compose up -d           # PostgreSQL
docker exec speedmotors-db psql -U speedmotors -d speedmotors -c "<SQL>"

## Arquitectura rapida
Browser -> React (axios + JWT) -> NestJS -> Drizzle -> PostgreSQL
Schema fuente de verdad: apps/backend/src/db/schema.ts

## Approach
- Read existing files before writing. Don't re-read unless changed.
- Thorough in reasoning, concise in output.
- Skip files over 100KB unless required.
- No sycophantic openers or closing fluff.
- No emojis or em-dashes.
- Do not guess APIs, versions, flags, commit SHAs, or package names. Verify by reading code or docs before asserting.

## Reglas de codigo
- TypeScript estricto -- prohibido any
- Drizzle ORM solamente -- no SQL crudo fuera de migraciones
- Diffs forzados -- prohibido reescribir archivos completos
- Mutations: useMutation + invalidateQueries (TanStack Query)
- Estilos: inline styles (patron existente en el proyecto)
- Responder en español rioplatense, terminos tecnicos en ingles
- Una linea de logica antes de cada bloque de codigo

## Navegacion de docs
docs/INDEX.md          -- mapa completo con estimacion de tokens
docs/QUICK_REFERENCE.md -- snippets y patrones frecuentes
docs/learnings/        -- temas especificos (cargar segun tarea)
.claude/LEARNINGS_INDEX.md  -- decisiones de diseño tomadas
