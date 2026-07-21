# @axis/db

Capa de datos de AXIS. **Placeholder** — se implementa en la **Fase 3** del `PLAN-PLATAFORMA.md`:

- `data-source.ts` (TypeORM, Postgres/RDS, `synchronize: false`, SSL condicional).
- Entidades `AxisUser`, `AxisProduct`, `AxisInventory` (tablas con prefijo `axis_`).
- Migraciones + seed de los 4 productos de prueba.
