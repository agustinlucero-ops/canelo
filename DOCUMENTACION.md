# Documentación del proyecto Canelo — Dietética

Tienda web para **Dietética Canelo**: catálogo de productos, carrito de compras y envío de pedidos por WhatsApp, con panel de administración integrado en el frontend.

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura](#3-arquitectura)
4. [Funcionalidades implementadas](#4-funcionalidades-implementadas)
5. [Modelo de datos](#5-modelo-de-datos)
6. [Estructura del proyecto](#6-estructura-del-proyecto)
7. [Componentes y módulos](#7-componentes-y-módulos)
8. [Persistencia y almacenamiento](#8-persistencia-y-almacenamiento)
9. [API y base de datos (Neon)](#9-api-y-base-de-datos-neon)
10. [Estilos y marca](#10-estilos-y-marca)
11. [Instalación y ejecución](#11-instalación-y-ejecución)
12. [Historial de desarrollo (Git)](#12-historial-de-desarrollo-git)
13. [Configuración y variables de entorno](#13-configuración-y-variables-de-entorno)
14. [Limitaciones conocidas y próximos pasos](#14-limitaciones-conocidas-y-próximos-pasos)

---

## 1. Resumen ejecutivo

El proyecto es una **aplicación de una sola página (SPA)** construida con **React 19** y **Vite 8**. El cliente final puede:

- Explorar productos agrupados por categoría.
- Filtrar por categoría (incluido un filtro transversal **Veganos**).
- Elegir presentación (peso/tamaño) y agregar al carrito.
- Completar nombre y teléfono y **enviar el pedido por WhatsApp** con un mensaje preformateado.

Un **panel de administración** (acceso con usuario y contraseña) permite gestionar categorías y productos sin backend de catálogo todavía conectado: los cambios se guardan en **localStorage** del navegador.

En paralelo se preparó una **API Express** con conexión a **Neon (PostgreSQL serverless)** y esquema de migración para persistir catálogo en base de datos (trabajo en curso, archivos aún no commiteados en `main`).

**Catálogo inicial:** ~50 productos en `src/data/products.json`, con precios en pesos argentinos (ARS).

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión (aprox.) |
|------|------------|------------------|
| Frontend | React | 19.x |
| Build | Vite | 8.x |
| Iconos | lucide-react | 1.x |
| Estado carrito | React Context + useReducer | — |
| API | Express | 5.x |
| Base de datos | Neon (`@neondatabase/serverless`) | 1.x |
| Utilidades API | cors, dotenv | — |
| Dev concurrente | concurrently | 9.x |

---

## 3. Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        Navegador                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  React App (Vite)                                    │    │
│  │  • App.jsx — catálogo, filtros, admin               │    │
│  │  • CartContext — carrito en memoria                 │    │
│  │  • localStorage — productos, categorías, sesión   │    │
│  └─────────────────────────────────────────────────────┘    │
│         │ proxy /api (dev)                                   │
└─────────┼───────────────────────────────────────────────────┘
          ▼
┌─────────────────────────────────────────────────────────────┐
│  Express API (server/index.mjs) — puerto 8787               │
│  • GET /api/health — ping + SELECT 1 a Neon                 │
└─────────┼───────────────────────────────────────────────────┘
          ▼
┌─────────────────────────────────────────────────────────────┐
│  Neon PostgreSQL (DATABASE_URL)                             │
│  • categories, products, schema_migrations (migración 001)  │
└─────────────────────────────────────────────────────────────┘

Checkout: wa.me → WhatsApp (sin pasar por el servidor)
```

- **Desarrollo:** `npm run dev` levanta Vite (frontend) y la API con recarga (`node --watch`).
- **Producción del frontend:** `npm run build` genera estáticos en `dist/`.
- El **pedido no se persiste en servidor**; solo se arma el enlace de WhatsApp en el cliente.

---

## 4. Funcionalidades implementadas

### 4.1 Catálogo público

- Listado de productos agrupados por **categoría**, orden según la lista de categorías configurada.
- Cada producto muestra:
  - Imagen (SVG por defecto en `/public/images/products/` o URL / base64 si el admin subió foto).
  - Nombre normalizado (ver [Utilidades](#utilidades)).
  - Precio de la presentación seleccionada.
  - Selector de **presentaciones** (chips: 100g, 500g, 1kg, etc.).
  - Badge **vegano** (icono Lucide `Vegan`) si `isVegan === true`.
  - Badge **Sin stock** si `outOfStock === true`; el botón de agregar se deshabilita.

### 4.2 Filtro por categoría

- Campo de búsqueda con **sugerencias** al escribir.
- **Chips** horizontales para elegir categoría rápidamente.
- Opción **Todas** para ver el catálogo completo.
- Categoría especial **Veganos**: no es un “tipo de producto” en el alta, sino un **filtro** que muestra todos los productos con `isVegan: true` (implementado en `src/utils/productCategories.js`).

### 4.3 Carrito de compras

- Icono de carrito en el header con **contador** de ítems.
- **Drawer lateral** (`CartDrawer`):
  - Lista de ítems con imagen, nombre, presentación, precio unitario.
  - Cantidad editable (mínimo 1; si baja a 0 se quita el ítem).
  - Subtotal y total en ARS.
  - Campos opcionales: nombre y teléfono del cliente.
  - Botón **Enviar pedido por WhatsApp** que abre `wa.me` con mensaje codificado.

### 4.4 Integración WhatsApp

- Número configurado en `CartDrawer.jsx` (`WHATSAPP_PHONE`; placeholder `5491122334455` — **debe actualizarse** al número real del negocio).
- Mensaje generado por `buildWhatsAppMessage()` en `src/utils/whatsapp.js`:
  - Encabezado con nombre de la tienda.
  - Líneas numeradas: producto, presentación, cantidad, subtotal por línea.
  - Total general.
  - Nombre y teléfono del cliente (o “Sin nombre” / “Sin teléfono”).
- Formato de moneda: `Intl.NumberFormat` locale `es-AR`, ARS, sin decimales.

### 4.5 Panel de administración

Acceso: enlace **“Ingresar admin”** → modal con usuario y contraseña.

| Función | Descripción |
|---------|-------------|
| Sesión | Se guarda en `localStorage` (`canelo.admin-session`) hasta cerrar sesión. |
| Categorías | Crear, renombrar, eliminar (los productos de una categoría eliminada pasan a **Sin tacc**). |
| Productos | Alta con nombre, categoría, presentación inicial, precio, URL o archivo de imagen, flag vegano. |
| Edición | Múltiples presentaciones, sin stock, imagen, categoría, vegano. |
| Eliminación | Confirmación antes de borrar. |

**Validaciones destacadas:**

- No se puede asignar la categoría literal **“Veganos”** a un producto nuevo; se usa el checkbox **Producto vegano**.
- La categoría del producto debe existir previamente en la lista de categorías.
- Presentaciones y precios deben ser válidos (> 0).

**Importante (seguridad):** las credenciales de admin están **hardcodeadas** en `App.jsx`. Para producción conviene moverlas a variables de entorno o autenticación en servidor.

### 4.6 Normalización y migración de datos en cliente

- `PRODUCTS_DATA_VERSION = 8`: si la versión en `localStorage` no coincide, se **resetea** el catálogo desde `products.json`.
- `sanitizeProducts()` limpia IDs, nombres, categorías, presentaciones e inferencia legacy de productos que tenían categoría `"Veganos"` (se reasignan a Granolas / Sin tacc y `isVegan: true`).
- Corrección automática del typo **“Ceriales”** → **“Cereales”**.

### 4.7 API de salud (commit en `main`)

- `GET /api/health`: ejecuta `SELECT 1` contra Neon y responde `{ ok: true, db: ... }` o error 500.

---

## 5. Modelo de datos

### 5.1 Producto (JSON / localStorage)

```json
{
  "id": "almendra-non-pareil",
  "name": "Almendra non pareil",
  "category": "Frutos secos",
  "image": "/images/products/almendra.svg",
  "isVegan": false,
  "outOfStock": false,
  "presentations": [
    { "label": "100g", "price": 4200 },
    { "label": "500g", "price": 16000 },
    { "label": "1kg", "price": 25000 }
  ]
}
```

### 5.2 Ítem de carrito (memoria)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `key` | string | `{productId}-{presentationLabel}` |
| `productId` | string | ID del producto |
| `name` | string | Nombre |
| `image` | string | URL o data URL |
| `presentation` | string | Ej. `500g` |
| `unitPrice` | number | Precio entero ARS |
| `quantity` | number | Cantidad |

### 5.3 Categorías por defecto

`Sin tacc`, `Granolas`, `Apto keto`, `Cereales`, `Condimentos`, `Congelados`, `Aceites`, `Pastas de mani`, `Frutos secos`, `Veganos` (solo filtro), `Harinas y legumbres`.

### 5.4 Esquema SQL (migración `001_catalog` — local, sin commit)

Tablas preparadas para sincronizar catálogo en Neon:

- `schema_migrations` — control de migraciones aplicadas.
- `categories` — `name` (PK), `sort_order`.
- `products` — `id`, `name`, `category` (FK), `image`, `is_vegan`, `out_of_stock`, `presentations` (JSONB), `updated_at`.

Script: `scripts/run-migration.mjs` (lee `db/migrations/001_catalog.sql` y registra la migración).

Utilidad compartida: `scripts/lib/catalogSanitize.mjs` (misma lógica de saneo que el frontend, para futuros scripts de importación).

---

## 6. Estructura del proyecto

```
canelo/
├── public/
│   └── images/
│       ├── logo.jpeg | logo.png | logo.webp
│       └── products/          # Iconos SVG por tipo de producto
├── src/
│   ├── App.jsx                # Vista principal + admin + filtros
│   ├── main.jsx               # Entry + CartProvider
│   ├── index.css              # Estilos globales
│   ├── components/
│   │   ├── CartDrawer.jsx
│   │   ├── ProductCard.jsx
│   │   └── QuantitySelector.jsx
│   ├── context/
│   │   └── CartContext.jsx
│   ├── data/
│   │   └── products.json      # Catálogo semilla (~50 productos)
│   └── utils/
│       ├── productCategories.js
│       ├── productName.js
│       └── whatsapp.js
├── server/
│   ├── index.mjs              # API Express
│   └── db.mjs                 # Cliente Neon (sin commit aún)
├── db/
│   └── migrations/
│       └── 001_catalog.sql    # (sin commit aún)
├── scripts/
│   ├── run-migration.mjs      # (sin commit aún)
│   └── lib/
│       └── catalogSanitize.mjs
├── vite.config.js             # Proxy /api → :8787
├── package.json
├── README.md
└── DOCUMENTACION.md           # Este archivo
```

---

## 7. Componentes y módulos

### `App.jsx`

Componente raíz: estado de productos, categorías, filtros, sesión admin y render del catálogo agrupado.

### `ProductCard.jsx`

Tarjeta de producto: badges vegano/stock, selector de presentación, botón agregar al carrito.

### `QuantitySelector.jsx`

Grupo de chips accesibles (`role="radiogroup"`) para elegir presentación.

### `CartDrawer.jsx`

Panel lateral del carrito y formulario de checkout hacia WhatsApp.

### `CartContext.jsx`

Reducer con acciones: `ADD_ITEM`, `SET_QUANTITY`, `REMOVE_ITEM`, `CLEAR_CART`. Totales calculados con `useMemo`.

### Utilidades

| Archivo | Responsabilidad |
|---------|-----------------|
| `productCategories.js` | Filtro Veganos vs categoría real; opciones para selects del admin |
| `productName.js` | Quita prefijo “Granola ” en categoría Granolas; normaliza “TUTTI GRANI” |
| `whatsapp.js` | `formatPrice`, `buildWhatsAppMessage`, `buildWhatsAppLink` |

---

## 8. Persistencia y almacenamiento

### localStorage (clave → contenido)

| Clave | Contenido |
|-------|-----------|
| `canelo.products` | Array JSON de productos |
| `canelo.products-version` | Número de versión del esquema (8) |
| `canelo.categories` | Array de nombres de categoría |
| `canelo.admin-session` | `true` / `false` sesión admin |

**Implicaciones:**

- Los cambios del admin son **por navegador/dispositivo**.
- Borrar datos del sitio restaura el catálogo desde `products.json` (si la versión coincide) o fuerza reset si cambia `PRODUCTS_DATA_VERSION`.
- Imágenes subidas como archivo se guardan en **base64** dentro del JSON (puede crecer mucho el almacenamiento local).

---

## 9. API y base de datos (Neon)

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Comprueba conexión a Neon |

### Variables requeridas

- `DATABASE_URL` — connection string de Neon.
- `API_PORT` — opcional, default `8787`.

### Proxy en desarrollo

`vite.config.js` redirige `/api/*` a `http://localhost:8787`.

### Migraciones (pendiente de integrar en flujo npm)

```bash
# Con DATABASE_URL en .env
node scripts/run-migration.mjs
```

Aún **no hay endpoints** CRUD de productos/categorías en la API; el frontend no consume la base de datos para el catálogo.

---

## 10. Estilos y marca

- Paleta verde (`#166534`, `#14532d`) alineada con identidad natural/dietética.
- Fondo general `#f6f8f6`, tarjetas blancas con bordes suaves.
- **Logo** en header: `<picture>` con WebP y fallback JPEG (`/images/logo.webp`, `logo.jpeg`).
- Botón de carrito destacado en verde con badge numérico.
- Botón WhatsApp con estilo dedicado (clase `.whatsapp`).
- Diseño **responsive**: grid de productos, chips de categoría con scroll horizontal, drawer de carrito a ancho completo en móvil.
- Iconos **Lucide**: `ShoppingCart` (header), `Vegan` (productos veganos).

Assets SVG de productos: almendra, avena, chia, coco, granola, harina-almendra, lino, mani, nuez, pasas (reutilizados según categoría en el JSON inicial).

---

## 11. Instalación y ejecución

### Requisitos

- Node.js 18+ (recomendado 20+)
- npm

### Pasos

```bash
# Clonar e instalar dependencias
npm install

# Opcional: crear .env en la raíz
# DATABASE_URL=postgresql://...
# API_PORT=8787

# Desarrollo (frontend + API)
npm run dev

# Solo frontend
npm run dev:client

# Solo API
npm run dev:api

# Build producción (solo cliente)
npm run build
npm run preview

# API en producción
npm run start:api
```

Abrir en el navegador la URL que indique Vite (típicamente `http://localhost:5173`).

### Actualizar teléfono de WhatsApp

Editar constante `WHATSAPP_PHONE` en `src/components/CartDrawer.jsx` (formato internacional sin `+`, ej. `54911XXXXXXXX`).

---

## 12. Historial de desarrollo (Git)

| Commit | Descripción |
|--------|-------------|
| `c506b45` | Initial commit |
| `74f9f76` | Implementa la tienda dietética con carrito y pedido por WhatsApp |
| `9f9d142` | Refina tarjetas de producto; separa filtro **Veganos** del tipo de producto |
| `493d64f` | Agrega API con Neon, logo de marca e iconos Lucide (carrito y veganos) |

**Cambios locales sin commit (al momento de esta documentación):**

- `db/migrations/001_catalog.sql`
- `server/db.mjs`
- `scripts/run-migration.mjs`
- `scripts/lib/catalogSanitize.mjs`

---

## 13. Configuración y variables de entorno

Archivo `.env` (no versionado, ver `.gitignore`):

```env
DATABASE_URL=postgresql://usuario:password@host/neondb?sslmode=require
API_PORT=8787
```

---

## 14. Limitaciones conocidas y próximos pasos

| Tema | Estado actual | Mejora sugerida |
|------|---------------|-----------------|
| Catálogo en producción | localStorage + JSON estático | API CRUD + Neon; sincronizar admin con backend |
| Credenciales admin | En código fuente | Auth en servidor, JWT o proveedor externo |
| WhatsApp | Número placeholder | Número real del negocio |
| Pedidos | Solo mensaje WA, sin registro | Opcional: guardar pedidos en DB o Google Sheets |
| Imágenes admin en base64 | Pesado en localStorage | Subida a storage (S3, Cloudinary, etc.) |
| Migración DB | Script listo, sin integrar en `package.json` | `npm run db:migrate` y seed desde `products.json` |
| Tests | No hay suite automatizada | Tests unitarios de sanitize y carrito |
| PWA / SEO | SPA básica | meta tags, manifest si se publica |

---

## Resumen de entregables

1. **Tienda funcional** con ~50 productos, múltiples categorías y presentaciones.
2. **Carrito** con totales en pesos argentinos.
3. **Checkout por WhatsApp** con mensaje estructurado.
4. **Panel admin** completo para categorías y productos (persistencia local).
5. **Filtro vegano** desacoplado de la categoría de producto.
6. **Branding** con logo WebP/JPEG e iconografía Lucide.
7. **API + esquema Neon** iniciados (health check + migración SQL preparada).

---

*Documentación generada para el repositorio **canelo** — Dietética Canelo. Última revisión alineada con la rama `main` y el estado del workspace local.*
