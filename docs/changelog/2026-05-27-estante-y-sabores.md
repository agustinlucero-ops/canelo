# Hito 2026-05-27 — Estante, sabores y orden de categorías

Registro consolidado de lo implementado en este ciclo: modelo de productos con sabores, aclaraciones de estante, orden visible del catálogo y panel de administración alineado.

---

## Resumen

| Área | Qué se hizo |
|------|-------------|
| **Modelo** | Tres `productType`: `simple`, `flavor-line`, `flavored`; columna `shelf_note` |
| **Tienda** | Tarjetas distintas por tipo; chips de categoría con orden compuesto |
| **Admin** | Alta/edición por tipo; reordenar estantes con flechas; validaciones centralizadas |
| **API** | `PUT /api/categories/order`; auto-registro de categorías faltantes al listar |
| **DB** | Migraciones `006`–`008` |
| **Tests** | Utilidades y componentes críticos cubiertos con Vitest |

---

## 1. Tipos de producto en estante

### 1.1 Producto simple (`simple`)

- Un nombre, presentaciones y precio.
- Opcional: **Aclaración de estante** (`shelfNote`, máx. 50 caracteres) bajo el nombre en la tarjeta (`ProductTitleBlock`).
- Persistencia: columna `shelf_note` (migración `008_product_shelf_note.sql`).

### 1.2 Línea de producto (`flavor-line`)

- Caso granola por marca (CUCA, TUTTI GRANI): una tarjeta, varios **Sabores** con foto, descripción e ingredientes.
- El cliente abre **Sabores y contenidos** → panel lateral `FlavorPickerPanel`.
- Componente de tarjeta: `GranolaLineCard`.
- Edición admin: `FlavorLineEditModal` + campos ricos por sabor en `AdminVariantsFields`.

### 1.3 Producto con sabores (`flavored`)

- Caso maní saborizado: un nombre en estante, sabores solo con nombre (selector en tarjeta).
- Componente: `FlavorLineCard` (select de sabor + agregar al carrito).
- Migración de datos: `007_mani_saborizado_flavored.sql` convierte `mani-saborizado` a `flavored`.
- Edición admin: `FlavoredProductEditModal` o rama en `ProductEditModal` según tipo.

**Decisión documentada:** [ADR 0003](../adr/0003-flavor-selection-on-card.md).

### 1.4 Carrito

- Los ítems con sabores usan el **id del sabor** (`variant.id`), no el id del producto padre.
- `reconcileCart.js` indexa sabores dentro de líneas y productos `flavored`.
- Nombre visible en carrito: combinación línea + sabor (`flavorLineCart.js`).

---

## 2. Orden visible del catálogo

### 2.1 Comportamiento en tienda

1. **Filtros de tienda** fijos al inicio: Sin tacc → Keto → Veganos (no se reordenan desde Gestión).
2. **Categorías de estante** según `sort_order` en Neon, editables con flechas en admin.

### 2.2 Categorías que solo aparecen en productos

- Si un producto referencia una categoría que no está en la tabla `categories`, el servidor la **crea al final** al ejecutar `GET /api/categories` (`syncCategoriesFromProducts` en `server/catalog.mjs`).
- El frontend replica la misma regla offline con `buildDisplayCategoryOrder.js` y `categoriesReferencedByProducts.js`.

### 2.3 Reordenar desde admin

- Endpoint: `PUT /api/categories/order` con cuerpo `{ order: string[] }`.
- Solo acepta permutación exacta de **estantes**; rechaza filtros de tienda (`validateShelfCategoryReorder.js`).

**Decisión documentada:** [ADR 0002](../adr/0002-category-display-order.md).

---

## 3. Base de datos

| Migración | Archivo | Efecto |
|-----------|---------|--------|
| 006 | `006_flavor_lines.sql` | `product_type`, `variants` JSONB |
| 007 | `007_mani_saborizado_flavored.sql` | Maní → `flavored` con dos sabores semilla |
| 008 | `008_product_shelf_note.sql` | `shelf_note TEXT` en `products` |

El seed (`scripts/seed-catalog.mjs`) persiste `product_type`, `variants` y `shelf_note`.

---

## 4. Panel de administración

### 4.1 Alta de producto

- Selector de tipo: Simple / Línea de producto (granola) / Producto con sabores (maní).
- Utilidades: `buildAdminNewProduct.js`, `validateAdminNewProduct.js`, `adminNewProductDefaults.js`.
- Validaciones: categoría real (no Veganos/Keto como estante), al menos una presentación con precio, al menos un sabor con nombre si aplica.

### 4.2 Edición

- `ProductEditModal`: vista previa en vivo; campo aclaración de estante solo en `simple`.
- Modales dedicados para líneas y productos con sabores cuando el flujo lo requiere.

### 4.3 Categorías

- Flechas subir/bajar estantes; persistencia vía `adminCatalog.reorderCategories`.
- Contador de productos por categoría; crear / renombrar / eliminar (productos huérfanos → Sin tacc).

---

## 5. Módulos y archivos nuevos o relevantes

### Utilidades (`src/utils/`)

| Archivo | Rol |
|---------|-----|
| `sanitizeCatalog.js` | Tipos de producto, `shelfNote`, `variants` |
| `buildDisplayCategoryOrder.js` | Orden visible filtros + estantes |
| `categoriesReferencedByProducts.js` | Categorías solo en productos |
| `validateShelfCategoryReorder.js` | Validación del PUT de orden |
| `buildAdminNewProduct.js` | Payload de alta normalizado |
| `validateAdminNewProduct.js` | Mensajes de error de alta |
| `productCategories.js` | Filtros vs estantes (`isShelfCategory`, etc.) |

### Componentes (`src/components/`)

| Archivo | Rol |
|---------|-----|
| `GranolaLineCard.jsx` | Tarjeta línea de producto |
| `FlavorLineCard.jsx` | Tarjeta producto con sabores |
| `FlavorPickerPanel.jsx` | Panel lateral de sabores (granola) |
| `ProductTitleBlock.jsx` | Nombre + categoría + aclaración |
| `AdminVariantsFields.jsx` | Sabores en formularios admin |
| `AdminPresentationsFields.jsx` | Presentaciones en admin |

### Servidor

| Archivo | Cambio |
|---------|--------|
| `server/catalog.mjs` | Mapeo `product_type`, `shelf_note`, sync y reorder de categorías |
| `server/app.mjs` | Ruta `PUT /api/categories/order` |

---

## 6. Lenguaje de dominio (CONTEXT.md)

Se amplió el vocabulario compartido:

- **Línea de producto** vs **Producto con sabores** vs **Sabor**
- **Aclaración de estante** vs textos largos del sabor en panel
- **Categoría de estante** vs **Filtro de tienda**
- Relación: orden del catálogo = filtros fijos + estantes ordenables

Ver [CONTEXT.md](../../CONTEXT.md).

---

## 7. Tests añadidos

- `buildDisplayCategoryOrder.test.js`
- `categoriesReferencedByProducts.test.js`
- `validateShelfCategoryReorder.test.js`
- `buildAdminNewProduct.test.js` / `validateAdminNewProduct.test.js`
- `sanitizeCatalog.test.js` (tipos y `shelfNote`)
- `FlavorLineCard.test.jsx`, `ProductTitleBlock.test.jsx`, y tests existentes de granola / carrito actualizados

Ejecutar: `npm test`.

---

## 8. Fuera de alcance (explícito)

- Import PDF/Excel no agrupa automáticamente líneas de producto.
- Orden de filtros de tienda solo por código, no desde Gestión.
- Orden alfabético de productos **dentro** de cada categoría no cambió con el reorder de estantes.

---

## Referencias cruzadas

- [Índice de documentación](../README.md)
- [DOCUMENTACION.md](../../DOCUMENTACION.md) — secciones 4.10–4.12 y modelo actualizado
- ADRs: [0001](../adr/0001-flavor-lines-jsonb.md), [0002](../adr/0002-category-display-order.md), [0003](../adr/0003-flavor-selection-on-card.md)
