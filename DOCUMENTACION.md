# Documentación del proyecto Canelo — Dietética

Tienda web para **Dietética Canelo**: catálogo de productos, carrito de compras y envío de pedidos por WhatsApp, con panel de administración integrado en el frontend y API de catálogo respaldada por **Neon (PostgreSQL)**.

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura](#3-arquitectura)
4. [Funcionalidades implementadas](#4-funcionalidades-implementadas)
5. [Categorías especiales: Sin tacc, Apto keto y Veganos](#5-categorías-especiales-sin-tacc-apto-keto-y-veganos)
6. [Modelo de datos](#6-modelo-de-datos)
7. [Estructura del proyecto](#7-estructura-del-proyecto)
8. [Componentes y módulos](#8-componentes-y-módulos)
9. [Persistencia y almacenamiento](#9-persistencia-y-almacenamiento)
10. [API y base de datos (Neon)](#10-api-y-base-de-datos-neon)
11. [Estilos y marca](#11-estilos-y-marca)
12. [Instalación y ejecución](#12-instalación-y-ejecución)
13. [Historial de desarrollo (Git)](#13-historial-de-desarrollo-git)
14. [Configuración y variables de entorno](#14-configuración-y-variables-de-entorno)
15. [Limitaciones conocidas y próximos pasos](#15-limitaciones-conocidas-y-próximos-pasos)

---

## 1. Resumen ejecutivo

El proyecto es una **aplicación de una sola página (SPA)** construida con **React 19** y **Vite 8**, acompañada de una **API Express** que persiste y expone el catálogo en **Neon**.

### Cliente (comprador)

- Explorar productos agrupados por categoría.
- Filtrar por categoría (incluido el filtro transversal **Veganos**).
- Elegir presentación (peso/tamaño) y agregar al carrito.
- Completar nombre y teléfono y **enviar el pedido por WhatsApp** con un mensaje preformateado.

### Administración

- Acceso con usuario y contraseña (sesión en `localStorage`).
- Vista **Gestión** separada del catálogo público, con secciones colapsables, lista compacta de productos por categoría y **modal de edición** con vista previa en tiempo real.
- Los cambios del admin (altas, ediciones, categorías) se persisten por API contra **Neon**.
- Si la API no está disponible, la gestión entra en modo **solo lectura** para evitar desalineaciones.

### Catálogo y base de datos

- Al cargar la app, el frontend intenta obtener categorías y productos desde **`GET /api/categories`** y **`GET /api/products`**.
- Si la API responde con datos, reemplaza el catálogo en memoria; si falla, usa `localStorage` o el JSON semilla (`src/data/products.json`).
- Migraciones SQL, script de **seed** desde `products.json` y utilidad para parsear PDF de catálogo están disponibles vía npm.

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
│  │  • App.jsx — catálogo, filtros, sesión admin        │    │
│  │  • AdminPanel — gestión (categorías, productos)     │    │
│  │  • ProductEditModal — edición con vista previa      │    │
│  │  • CartContext — carrito en memoria                 │    │
│  │  • localStorage — productos, categorías, sesión     │    │
│  │  • fetchCatalogFromApi() al montar                  │    │
│  └─────────────────────────────────────────────────────┘    │
│         │ proxy /api (dev)                                   │
└─────────┼───────────────────────────────────────────────────┘
          ▼
┌─────────────────────────────────────────────────────────────┐
│  Express API (server/) — puerto 8787 (API_PORT)             │
│  • GET /api/health                                          │
│  • GET /api/categories                                      │
│  • GET /api/products[?category=]                            │
│  • GET /api/products/:id                                    │
└─────────┼───────────────────────────────────────────────────┘
          ▼
┌─────────────────────────────────────────────────────────────┐
│  Neon PostgreSQL (DATABASE_URL)                             │
│  • categories, products, schema_migrations                  │
└─────────────────────────────────────────────────────────────┘

Checkout: wa.me → WhatsApp (sin pasar por el servidor)
```

- **Desarrollo:** `npm run dev` levanta Vite (frontend) y la API con recarga (`node --watch`).
- **Producción del frontend:** `npm run build` genera estáticos en `dist/`.
- El **pedido no se persiste en servidor**; solo se arma el enlace de WhatsApp en el cliente.
- **Flujo actual de catálogo:** lectura desde Neon al inicio + escrituras del admin por endpoints CRUD.

---

## 4. Funcionalidades implementadas

### 4.1 Catálogo público

- Listado de productos agrupados por **categoría**, orden según la lista de categorías configurada.
- Cada producto muestra:
  - Imagen (SVG por defecto en `/public/images/products/`, URL o base64 si el admin subió foto).
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

- Número configurable con variable de entorno **`VITE_WHATSAPP_PHONE`** (solo dígitos, sin `+`). Si no está definida, usa el placeholder `5491122334455`.
- Configuración en `src/components/CartDrawer.jsx`.
- Mensaje generado por `buildWhatsAppMessage()` en `src/utils/whatsapp.js`:
  - Encabezado con nombre de la tienda.
  - Líneas numeradas: producto, presentación, cantidad, subtotal por línea.
  - Total general.
  - Nombre y teléfono del cliente (o “Sin nombre” / “Sin teléfono”).
- Formato de moneda: `Intl.NumberFormat` locale `es-AR`, ARS, sin decimales.

### 4.5 Panel de administración

Acceso: enlace **“Ingresar admin”** → modal con usuario y contraseña. Tras iniciar sesión aparecen pestañas **Catálogo** | **Gestión** en el header.

| Función | Descripción |
|---------|-------------|
| Sesión | Se guarda en `localStorage` (`canelo.admin-session`) hasta cerrar sesión. |
| Vista Gestión | Componente `AdminPanel` con secciones colapsables (`CollapsibleSection`). |
| Categorías | Crear, renombrar, eliminar (los productos de una categoría eliminada pasan a **Sin tacc**). Contador de productos por categoría. |
| Alta de productos | Formulario en sección “Agregar producto”: nombre, categoría, presentación inicial, precio, URL o archivo de imagen, flag vegano. |
| Listado admin | Productos agrupados por categoría con **expandir/colapsar** por grupo y botones “Expandir todo” / “Colapsar todo”. |
| Edición | Modal `ProductEditModal` con formulario completo y **vista previa en vivo** reutilizando `ProductCard`. |
| Eliminación | Confirmación antes de borrar. |

**Validaciones destacadas:**

- No se puede asignar la categoría literal **“Veganos”** a un producto nuevo; se usa el checkbox **Producto vegano**.
- La categoría del producto debe existir previamente en la lista de categorías.
- Presentaciones y precios deben ser válidos (> 0).

**Importante (seguridad):** las credenciales de admin están **hardcodeadas** en `App.jsx`. Para producción conviene moverlas a variables de entorno o autenticación en servidor.

### 4.6 UX: bloqueo de scroll

- Hook `useBodyScrollLock` evita el scroll del `body` cuando están abiertos el carrito, el modal de login admin o el modal de edición de producto.
- Compensa el ancho de la barra de desplazamiento para evitar saltos de layout.

### 4.7 Normalización y migración de datos en cliente

- `PRODUCTS_DATA_VERSION = 8`: si la versión en `localStorage` no coincide, se **resetea** el catálogo desde `products.json`.
- `sanitizeProducts()` limpia IDs, nombres, categorías, presentaciones e inferencia legacy de productos que tenían categoría `"Veganos"` (se reasignan a Granolas / Sin tacc y `isVegan: true`).
- Corrección automática del typo **“Ceriales”** → **“Cereales”**.

### 4.8 Carga de catálogo desde API

- Al montar `App.jsx`, se llama a `fetchCatalogFromApi()` (`src/api/catalog.js`).
- Si la API responde, sincroniza productos/categorías desde DB.
- Si la API no está disponible, el catálogo público mantiene fallback local y la vista de gestión queda en solo lectura.

### 4.9 API de salud y catálogo

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | `SELECT 1` contra Neon |
| GET | `/api/categories` | Lista de categorías con `sort_order` |
| POST | `/api/categories` | Crea categoría |
| PUT | `/api/categories/:name` | Renombra categoría |
| DELETE | `/api/categories/:name` | Elimina categoría y reasigna productos a `Sin tacc` |
| GET | `/api/products` | Todos los productos (opcional `?category=Nombre`) |
| GET | `/api/products/:id` | Un producto por ID |
| POST | `/api/products` | Crea producto |
| PUT | `/api/products/:id` | Edita producto |
| DELETE | `/api/products/:id` | Elimina producto |

---

## 5. Categorías especiales: Sin tacc, Apto keto y Veganos

Esta sección resume de forma directa qué se implementó en estas categorías y cómo se comportan en catálogo y administración.

### 5.1 Sin tacc

- Es una **categoría real** del catálogo (como Granolas o Cereales).
- Se puede asignar directamente al crear/editar productos desde el admin.
- Se muestra como chip de filtro normal en la tienda.
- Si se elimina una categoría desde el admin, los productos de esa categoría se reasignan a **Sin tacc** como categoría de respaldo.

### 5.2 Apto keto

- Es una **categoría real** del catálogo.
- Se puede usar en alta/edición de productos sin reglas especiales adicionales.
- Aparece en filtros, agrupación de catálogo y panel de gestión igual que el resto de categorías reales.

### 5.3 Veganos

- **No es una categoría de alta** de productos.
- Se implementó como un **filtro transversal**: muestra productos de cualquier categoría cuyo campo `isVegan` sea `true`.
- En el admin, el comportamiento correcto es:
  - Elegir una categoría real (por ejemplo, Sin tacc o Apto keto).
  - Marcar el checkbox **Producto vegano**.
- Validación activa: no se permite guardar productos nuevos con categoría literal `"Veganos"`.

### 5.4 Reglas clave que ya quedaron aplicadas

- Se separó la lógica de “tipo de producto” (categoría real) de la condición “vegano” (atributo booleano).
- Se agregó saneamiento para datos heredados que venían con categoría `"Veganos"`, migrándolos a categorías reales y marcando `isVegan: true`.
- Esto evita mezclar conceptos y permite combinaciones correctas, por ejemplo:
  - Producto en **Sin tacc** y además vegano.
  - Producto en **Apto keto** y además vegano.

---

## 6. Modelo de datos

### 5.1 Producto (JSON / localStorage / API)

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

En la base de datos los campos booleanos son `is_vegan`, `is_keto`, `is_gluten_free` y `out_of_stock`; `presentations` se almacena como **JSONB**.

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

### 5.4 Esquema SQL (`db/migrations/001_catalog.sql` + `002_product_flags_and_constraints.sql`)

- `schema_migrations` — control de migraciones aplicadas.
- `categories` — `name` (PK), `sort_order`.
- `products` — `id`, `name`, `category` (FK), `image`, `is_vegan`, `is_keto`, `is_gluten_free`, `out_of_stock`, `presentations` (JSONB), `updated_at`.
- Constraint de categoría reservada en `products` para bloquear `Veganos/Keto/Apto keto` como categoría real.

---

## 7. Estructura del proyecto

```
canelo/
├── public/
│   └── images/
│       ├── logo.jpeg | logo.png | logo.webp
│       └── products/          # Iconos SVG por tipo de producto
├── src/
│   ├── App.jsx                # Vista principal, filtros, sesión admin
│   ├── main.jsx               # Entry + CartProvider
│   ├── index.css              # Estilos globales
│   ├── api/
│   │   ├── catalog.js         # fetchCatalogFromApi
│   │   └── adminCatalog.js    # CRUD admin (categorías/productos)
│   ├── components/
│   │   ├── AdminPanel.jsx     # Panel de gestión
│   │   ├── CartDrawer.jsx
│   │   ├── CollapsibleSection.jsx
│   │   ├── ProductCard.jsx
│   │   ├── ProductEditModal.jsx
│   │   └── QuantitySelector.jsx
│   ├── context/
│   │   └── CartContext.jsx
│   ├── data/
│   │   └── products.json      # Catálogo semilla (~50 productos)
│   ├── hooks/
│   │   └── useBodyScrollLock.js
│   └── utils/
│       ├── productCategories.js
│       ├── productName.js
│       └── whatsapp.js
├── server/
│   ├── index.mjs              # Arranque del servidor
│   ├── app.mjs                # Rutas Express
│   ├── catalog.mjs            # Consultas de catálogo
│   └── db.mjs                 # Cliente Neon
├── db/
│   └── migrations/
│       └── 001_catalog.sql
├── scripts/
│   ├── run-migration.mjs
│   ├── seed-catalog.mjs
│   ├── parse-catalog-pdf.mjs
│   └── lib/
│       └── catalogSanitize.mjs
├── vite.config.js             # Proxy /api → :8787
├── package.json
├── README.md
└── DOCUMENTACION.md           # Este archivo
```

---

## 8. Componentes y módulos

### `App.jsx`

Componente raíz: estado de productos, categorías, filtros, sesión admin, pestañas Catálogo/Gestión y render del catálogo agrupado. Orquesta props hacia `AdminPanel` y modales.

### `AdminPanel.jsx`

Vista de gestión: secciones colapsables para categorías y alta de productos; listado compacto por categoría con acciones editar/eliminar; delega la edición al modal.

### `ProductEditModal.jsx`

Modal de edición con formulario (nombre, categoría, imagen, vegano, sin stock, presentaciones) y **vista previa** usando `ProductCard` en modo `preview`.

### `CollapsibleSection.jsx`

Sección acordeón accesible (`aria-expanded`, `aria-controls`) reutilizada en el admin.

### `ProductCard.jsx`

Tarjeta de producto: badges vegano/stock, selector de presentación, botón agregar al carrito. Soporta prop `preview` para desactivar interacción en el editor.

### `QuantitySelector.jsx`

Grupo de chips accesibles (`role="radiogroup"`) para elegir presentación.

### `CartDrawer.jsx`

Panel lateral del carrito y formulario de checkout hacia WhatsApp.

### `CartContext.jsx`

Reducer con acciones: `ADD_ITEM`, `SET_QUANTITY`, `REMOVE_ITEM`, `CLEAR_CART`. Totales calculados con `useMemo`.

### `useBodyScrollLock.js`

Bloquea el scroll del documento mientras hay overlays abiertos (contador de referencias para modales anidados).

### `catalog.js` (API cliente)

`fetchCatalogFromApi()` — peticiones paralelas a categorías y productos.

### Utilidades

| Archivo | Responsabilidad |
|---------|-----------------|
| `productCategories.js` | Filtro Veganos vs categoría real; opciones para selects del admin |
| `productName.js` | Quita prefijo “Granola ” en categoría Granolas; normaliza “TUTTI GRANI” |
| `whatsapp.js` | `formatPrice`, `buildWhatsAppMessage`, `buildWhatsAppLink` |

---

## 9. Persistencia y almacenamiento

### localStorage (clave → contenido)

| Clave | Contenido |
|-------|-----------|
| `canelo.products` | Array JSON de productos |
| `canelo.products-version` | Número de versión del esquema (8) |
| `canelo.categories` | Array de nombres de categoría |
| `canelo.admin-session` | `true` / `false` sesión admin |

### Neon (PostgreSQL)

- Catálogo semilla cargado con `npm run db:seed` desde `products.json`.
- El frontend **lee** el catálogo vía API al iniciar.
- El panel admin **escribe** categorías/productos por API y persiste en DB.

**Implicaciones:**

- Con API activa y seed aplicado, todos los clientes ven catálogo centralizado desde DB.
- Sin API, el catálogo público puede leer fallback local, pero el admin no persiste cambios (solo lectura).
- Imágenes subidas como archivo siguen almacenándose como **base64** en los payloads (conviene migrar a storage externo).

---

## 10. API y base de datos (Neon)

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Comprueba conexión a Neon (`SELECT 1`) |
| GET | `/api/categories` | `{ categories: [{ name, sortOrder }] }` |
| POST | `/api/categories` | `{ name }` -> `{ category }` |
| PUT | `/api/categories/:name` | `{ nextName }` -> `{ category }` |
| DELETE | `/api/categories/:name` | `{ ok: true, result }` |
| GET | `/api/products` | `{ products: [...] }` — query opcional `category` |
| GET | `/api/products/:id` | `{ product }` o 404 |
| POST | `/api/products` | Crea producto |
| PUT | `/api/products/:id` | Actualiza producto |
| DELETE | `/api/products/:id` | `{ ok: true, result }` |

### Scripts npm

| Comando | Acción |
|---------|--------|
| `npm run db:migrate` | Aplica `db/migrations/001_catalog.sql` |
| `npm run db:seed` | Inserta/actualiza catálogo desde `products.json` |
| `npm run db:setup` | Migración + seed |
| `npm run catalog:parse-pdf` | Utilidad para extraer datos de un PDF de catálogo |

### Variables requeridas

- `DATABASE_URL` — connection string de Neon.
- `API_PORT` — opcional, default `8787`.
- `VITE_ENABLE_REMOTE_ADMIN_WRITES` — opcional, default `true`; permite apagar escrituras remotas del admin desde frontend.

### Proxy en desarrollo

`vite.config.js` redirige `/api/*` a `http://localhost:8787`.

### Puesta en marcha de la base

```bash
# Con DATABASE_URL en .env
npm run db:setup
```

Luego `npm run dev` para frontend + API. El cliente cargará el catálogo desde Neon si la API responde y la gestión admin operará por CRUD remoto.

---

## 11. Estilos y marca

- Paleta verde (`#166534`, `#14532d`) alineada con identidad natural/dietética.
- Fondo general `#f6f8f6`, tarjetas blancas con bordes suaves.
- **Logo** en header: `<picture>` con WebP y fallback JPEG (`/images/logo.webp`, `logo.jpeg`).
- Botón de carrito destacado en verde con badge numérico.
- Botón WhatsApp con estilo dedicado (clase `.whatsapp`).
- Diseño **responsive**: grid de productos, chips de categoría con scroll horizontal, drawer de carrito a ancho completo en móvil.
- Panel admin: pestañas en header, listas compactas, grupos de categoría colapsables, modal de edición a pantalla completa en móvil.
- Iconos **Lucide**: `ShoppingCart`, `Vegan`, `Pencil`, `Trash2`, `Check`, `X`, `ChevronDown`, etc.

Assets SVG de productos: almendra, avena, chia, coco, granola, harina-almendra, lino, mani, nuez, pasas (reutilizados según categoría en el JSON inicial).

---

## 12. Instalación y ejecución

### Requisitos

- Node.js 18+ (recomendado 20+)
- npm
- Proyecto Neon (opcional pero recomendado para catálogo centralizado)

### Pasos

```bash
# Instalar dependencias
npm install

# Crear .env en la raíz
# DATABASE_URL=postgresql://...
# API_PORT=8787
# VITE_WHATSAPP_PHONE=54911XXXXXXXX
# VITE_ENABLE_REMOTE_ADMIN_WRITES=true

# Base de datos (primera vez)
npm run db:setup

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

Definir `VITE_WHATSAPP_PHONE` en `.env` (formato internacional sin `+`, solo dígitos). Reconstruir el frontend si se cambia en producción (`npm run build`).

---

## 13. Historial de desarrollo (Git)

| Commit | Descripción |
|--------|-------------|
| `c506b45` | Initial commit |
| `74f9f76` | Implementa la tienda dietética con carrito y pedido por WhatsApp |
| `9f9d142` | Refina tarjetas de producto; separa filtro **Veganos** del tipo de producto |
| `493d64f` | Agrega API con Neon, logo de marca e iconos Lucide (carrito y veganos) |
| `a9c5082` | Catálogo en Neon: migraciones, seed, API de productos y categorías |
| `62baba9` | Teléfono de WhatsApp configurable con `VITE_WHATSAPP_PHONE` |
| `4085e5e` | Rediseño del panel admin: pestañas, lista compacta y modal de edición con vista previa |

---

## 14. Configuración y variables de entorno

Archivo `.env` (no versionado, ver `.gitignore`):

Ver plantilla completa en [`.env.example`](./.env.example).

```env
DATABASE_URL=postgresql://usuario:password@host/neondb?sslmode=require
API_PORT=8787
ADMIN_USER=tu-email@ejemplo.com
ADMIN_PASSWORD=clave_segura
ADMIN_SESSION_SECRET=string_aleatorio_largo
VITE_WHATSAPP_PHONE=54911XXXXXXXX
VITE_SITE_URL=https://tu-dominio.vercel.app
VITE_ENABLE_REMOTE_ADMIN_WRITES=true
```

| Variable | Ámbito | Uso |
|----------|--------|-----|
| `DATABASE_URL` | Servidor | Conexión Neon |
| `API_PORT` | Servidor | Puerto Express (default 8787) |
| `ADMIN_USER` | Servidor | Usuario del modal de admin (no va al bundle del cliente) |
| `ADMIN_PASSWORD` | Servidor | Clave del modal de admin |
| `ADMIN_SESSION_SECRET` | Servidor | Firma de tokens Bearer para sesión admin (12 h) |
| `VITE_WHATSAPP_PHONE` | Cliente (build) | Número destino de pedidos por WhatsApp |
| `VITE_ENABLE_REMOTE_ADMIN_WRITES` | Cliente (build) | Activar/desactivar escritura remota del admin |
| `VITE_SITE_URL` | Cliente (build) | URL pública para `canonical`, `og:url` e imágenes OG absolutas |

### Autenticación admin (P0)

- El **modal de ingreso** sigue igual en la UI (usuario + clave).
- Las credenciales viven solo en el servidor (`ADMIN_USER`, `ADMIN_PASSWORD`).
- `POST /api/admin/login` valida y devuelve un token; el cliente lo guarda en `sessionStorage`.
- Los endpoints de escritura (`POST`/`PUT`/`DELETE` de categorías y productos) exigen `Authorization: Bearer <token>`.
- `GET /api/admin/session` permite validar la sesión al recargar la página.
- Las lecturas públicas del catálogo (`GET /api/categories`, `GET /api/products`) siguen abiertas.

---

## 15. Limitaciones conocidas y próximos pasos

| Tema | Estado actual | Mejora sugerida |
|------|---------------|-----------------|
| Escritura del catálogo | Protegida con token Bearer tras login | Roles múltiples / OAuth en el futuro |
| Credenciales admin | Variables `ADMIN_*` en servidor | Rotar clave periódicamente; no usar `VITE_` para secretos |
| WhatsApp | Configurable por env; placeholder si falta | Definir número real en `.env` de producción |
| Pedidos | Solo mensaje WA, sin registro | Opcional: guardar pedidos en DB o Google Sheets |
| Imágenes admin en base64 | Pesado en DB; subida desde panel admin | Storage externo (S3, Cloudinary) en hito futuro |
| Catálogo en cliente | Fuente oficial: API Neon cuando responde | Sin persistir `canelo.products` / `canelo.categories` si la API está activa (`PRODUCTS_DATA_VERSION` 12) |
| Tests | No hay suite automatizada | Tests unitarios de sanitize, carrito y API |
| PWA | Sin manifest | Opcional si se publica como app instalable |
| Footer / contacto | Pendiente de contenido | Horarios, dirección y redes en hito futuro |
| Parse PDF | Script `catalog:parse-pdf` disponible | Integrar flujo de importación al admin o seed |

---

## Resumen de entregables

1. **Tienda funcional** con ~50 productos, múltiples categorías y presentaciones.
2. **Carrito** con totales en pesos argentinos.
3. **Checkout por WhatsApp** con mensaje estructurado y teléfono configurable.
4. **Panel admin** con pestañas, secciones colapsables, listado compacto y modal de edición con vista previa.
5. **Filtro vegano** desacoplado de la categoría de producto.
6. **Branding** con logo WebP/JPEG e iconografía Lucide.
7. **API + Neon** con migraciones incrementales, seed, lectura y CRUD de catálogo.
8. **UX** con bloqueo de scroll en overlays, carga desde API, banner offline, estados vacíos, orden de categorías por `sort_order`, SEO básico y carrito que se vacía tras enviar pedido por WhatsApp.

---

*Documentación del repositorio **canelo** — Dietética Canelo. Última revisión: mayo 2026, con persistencia real de gestión admin en API + Neon.*
