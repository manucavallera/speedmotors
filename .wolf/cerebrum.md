# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-05-01

## User Preferences

- **Frontend modularización:** Fragmentar archivos >3,000 tok. Utilitarios (pdf, helpers) en subcarpetas con barrel `index.ts`. Pages actúan solo como orquestadores — extraer modales y forms a componentes propios. Componentes compartidos (TableShell, PageHeader) en `components/shared/`.

## Key Learnings

- **Project:** speedmotors
- **Schema modular:** DB schema dividido por dominio en `apps/backend/src/db/`. Para cambios de DB, cargar solo `[entidad].schema.ts` + `enums.ts`. Prohibido leer `schema.ts` completo (es barrel puro). Archivos: enums, users, clients, catalog (categories+suppliers+products), vehicles, sales (sales+saleItems+installments), quotes, cash, stock, orders, expenses, relations.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
