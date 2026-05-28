# Documentación del proyecto Canelo

Índice de toda la documentación del repositorio, ordenada por propósito.

## Por dónde empezar

| Documento | Para quién | Contenido |
|-----------|------------|-----------|
| [README.md](../README.md) | Desarrollo día a día | Inicio rápido, scripts npm, endpoints básicos |
| [CONTEXT.md](../CONTEXT.md) | Producto y dominio | Lenguaje ubicuo, relaciones, diálogos de ejemplo |
| [DOCUMENTACION.md](../DOCUMENTACION.md) | Arquitectura técnica | Stack, API, modelo de datos, componentes |
| [changelog/2026-05-27-estante-y-sabores.md](./changelog/2026-05-27-estante-y-sabores.md) | Revisión de hito | Todo lo implementado en mayo 2026 (sabores, estante, orden) |

## Decisiones de arquitectura (ADR)

Los ADR registran decisiones irreversibles o costosas de cambiar. Numeración secuencial:

| ADR | Tema |
|-----|------|
| [0001 — Líneas con sabores en JSONB](./adr/0001-flavor-lines-jsonb.md) | `product_type` + `variants` para granolas |
| [0002 — Orden visible de categorías](./adr/0002-category-display-order.md) | Filtros fijos + estantes reordenables |
| [0003 — Dos formas de vender con sabores](./adr/0003-flavor-selection-on-card.md) | `flavor-line` vs `flavored` |

## Registro de cambios

| Fecha | Archivo |
|-------|---------|
| 2026-05-27 | [Estante, sabores y orden de categorías](./changelog/2026-05-27-estante-y-sabores.md) |

## Otros recursos

- Migraciones SQL: `db/migrations/`
- Catálogo semilla: `src/data/products.json`
- PDF de referencia (parse): `docs/catalogo-canelo.pdf` (si existe en el repo)
