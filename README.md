# Canelo — Dietética

Tienda web para **Dietética Canelo**: catálogo por categorías, carrito, pedido por WhatsApp y panel de administración con persistencia en **API + Neon**.

## Inicio rápido

```bash
npm install
cp .env.example .env   # completar DATABASE_URL, ADMIN_* y VITE_*
npm run db:setup       # migración + seed (requiere Neon)
npm run dev            # frontend (Vite) + API (Express)
```

En **Vercel**, además de `DATABASE_URL` y las `VITE_*`, configurar `ADMIN_USER`, `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` (ver `.env.example`).

## Estado actual del admin

- Altas, ediciones y bajas de productos/categorías se persisten por API en Neon.
- Si la API no está disponible, el panel de gestión entra en modo solo lectura (sin guardados locales silenciosos).
- Se puede desactivar temporalmente la escritura remota del admin con `VITE_ENABLE_REMOTE_ADMIN_WRITES=false`.

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Frontend + API en desarrollo |
| `npm run build` | Build de producción del cliente |
| `npm run db:migrate` | Aplica migraciones SQL |
| `npm run db:seed` | Carga catálogo desde `src/data/products.json` |
| `npm run db:setup` | Migración + seed |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:api` | Smoke API (auth admin) |
| `npm run catalog:parse-pdf` | Compara `docs/catalogo-canelo.pdf` vs `products.json` |

## Auth admin

- `POST /api/admin/login` — valida usuario/clave (env servidor) y devuelve token
- `GET /api/admin/session` — valida token Bearer

## Pedidos

- `POST /api/orders` — registra pedido al checkout (público)
- `GET /api/orders` — últimos pedidos (requiere token admin)

Migración: `db/migrations/004_orders.sql` (incluida en `npm run db:migrate`).

## Parser PDF

1. Copiar el catálogo a `docs/catalogo-canelo.pdf`
2. `npm run catalog:parse-pdf` (agregar `--strict` para fallar si hay diferencias)
3. Revisar `scripts/catalog-diff-report.json`

## PWA

El sitio expone `public/manifest.webmanifest` para instalación desde el navegador (sin cache offline en esta versión).

## Endpoints admin CRUD (requieren `Authorization: Bearer <token>`)

- `POST /api/categories`
- `PUT /api/categories/:name`
- `DELETE /api/categories/:name`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [DOCUMENTACION.md](./DOCUMENTACION.md) | Arquitectura, API, modelo de datos, componentes |
| [CONTEXT.md](./CONTEXT.md) | Lenguaje de dominio (producto, estante, sabores, categorías) |
| [docs/README.md](./docs/README.md) | Índice: ADRs, changelog del hito mayo 2026 |

**Último hito documentado:** [estante, sabores y orden de categorías](./docs/changelog/2026-05-27-estante-y-sabores.md) (tipos `simple` / `flavor-line` / `flavored`, `shelf_note`, reorder de estantes).
