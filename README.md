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

## Auth admin

- `POST /api/admin/login` — valida usuario/clave (env servidor) y devuelve token
- `GET /api/admin/session` — valida token Bearer

## Endpoints admin CRUD (requieren `Authorization: Bearer <token>`)

- `POST /api/categories`
- `PUT /api/categories/:name`
- `DELETE /api/categories/:name`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

## Documentación completa

Ver **[DOCUMENTACION.md](./DOCUMENTACION.md)** para arquitectura, API, modelo de datos, panel admin y variables de entorno.

### Categorías especiales documentadas

En `DOCUMENTACION.md` también está el detalle de cómo quedaron implementadas las categorías **Sin tacc**, **Apto keto** y el filtro transversal **Veganos**, incluyendo reglas del panel admin y migración de datos heredados.
