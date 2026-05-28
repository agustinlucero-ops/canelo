# Canelo — Catálogo de tienda

Contexto del negocio: tienda dietética con catálogo web, carrito y pedidos por WhatsApp. El dueño actualiza productos y precios periódicamente desde el panel admin.

---

## Lenguaje ubicuo

### Catálogo y flujo editorial

| Término | Definición | Evitar |
|---------|------------|--------|
| **Catálogo en línea** | Productos y categorías visibles para clientes en la tienda web | Live, producción, publicado |
| **Borrador** | Productos/categorías importados aún no visibles; se revisan antes de publicar | Staging, draft, preview |
| **Publicar** | Hacer visibles en línea los ítems del borrador | Subir, activar, sincronizar |
| **Importación** | Cargar archivo (PDF/Excel), parsear y crear o reemplazar borrador | Upload, seed, carga masiva |
| **Archivo de catálogo** | Documento del dueño con productos y precios (completo o novedades) | Listado, planilla, inventario |
| **Producto existente** | Producto ya en catálogo en línea antes de una importación | Duplicado, viejo, legacy |

### Compra en tienda

| Término | Definición | Evitar |
|---------|------------|--------|
| **Carrito** | Productos seleccionados antes del pedido por WhatsApp | Cart, bolsa, cesta |
| **Confirmación de agregado** | Aviso breve de que el producto entró al carrito | Toast, snackbar |

### Productos en estante

| Término | Definición | Evitar |
|---------|------------|--------|
| **Línea de producto** | Ítem que agrupa varios sabores bajo una marca (ej. Granola CUCA); panel lateral de sabores | Producto padre, combo |
| **Producto con sabores** | Un nombre en estante y sabores elegibles en la tarjeta (ej. Maní saborizado) | Variante, subproducto |
| **Sabor** | Opción dentro de una línea o de un producto con sabores | Variante, presentación |
| **Aclaración de estante** | Texto corto opcional bajo el nombre en producto **simple** (máx. 50 caracteres) | Subtítulo, descripción larga |

### Categorías y navegación

| Término | Definición | Evitar |
|---------|------------|--------|
| **Categoría de estante** | Dónde vive el producto (Granolas, Frutos secos); orden editable en Gestión | Sección, rubro |
| **Filtro de tienda** | Criterio transversal (Sin tacc, Keto, Veganos); fijo al inicio del catálogo | Chip, tag como sustantivo |
| **Tipo de archivo** (import) | Catálogo completo vs solo productos nuevos | Modo, estrategia de diff |

---

## Formas de producto (`productType`)

Correspondencia entre lenguaje de negocio y valor técnico:

| Negocio | `productType` | UI en tienda | Admin al crear |
|---------|---------------|--------------|----------------|
| Producto simple | `simple` | `ProductCard` + aclaración opcional | “Simple” |
| Línea de producto | `flavor-line` | `GranolaLineCard` + `FlavorPickerPanel` | “Línea de producto (granola)” |
| Producto con sabores | `flavored` | `FlavorLineCard` (select de sabor) | “Producto con sabores (maní)” |

Presentaciones y precio son a nivel producto en los tres casos con sabores. El carrito guarda el **id del sabor**.

---

## Relaciones

- Una **Importación** produce exactamente un **Borrador** activo.
- **Publicar** transfiere ítems del **Borrador** al **Catálogo en línea**.
- Un **Producto existente** se identifica por nombre normalizado (sin acentos, minúsculas).
- Los clientes solo ven el **Catálogo en línea**, nunca un **Borrador**.
- Agregar desde tarjeta → **Confirmación de agregado** → actualiza el **Carrito**.
- **Línea de producto** → uno o más **Sabores** → panel lateral → carrito con id de sabor.
- **Producto con sabores** → uno o más **Sabores** → elección en tarjeta → carrito con id de sabor.
- **Aclaración de estante** solo en productos `simple`; no en líneas ni productos con sabores.
- Orden visible del catálogo = **Filtros de tienda** (fijos) + **Categorías de estante** (`sort_order`, flechas en admin).
- Categoría referenciada solo por productos se registra automáticamente al final hasta que el dueño la reubique.

---

## Diálogos de ejemplo

> **Dev:** "Subió un PDF de catálogo completo con 200 productos, pero 180 ya están en línea. ¿Qué entra al borrador?"  
> **Dueño:** "Solo lo que falta, y si marco actualizar precios, también los que cambiaron. Lo reviso en el borrador y recién ahí publico."

> **Dev:** "El PDF tiene una sección KETO. ¿Es categoría nueva?"  
> **Dueño:** "No, es como la tienda hoy: badge keto y el producto va en su categoría real, no en una categoría que diga Keto."

> **Dev:** "¿Maní saborizado es línea de granola?"  
> **Dueño:** "No. Es un producto con sabores en la tarjeta: el cliente elige sabor y agrega. La granola abre el panel con fotos e ingredientes."

> **Dev:** "¿Puedo poner 'sin piel' debajo del nombre de la almendra?"  
> **Dueño:** "Sí, es la aclaración de estante. Corta, no un párrafo."

---

## Decisiones registradas (ADR)

| ADR | Tema |
|-----|------|
| [0001](docs/adr/0001-flavor-lines-jsonb.md) | Sabores en JSONB (`variants`) |
| [0002](docs/adr/0002-category-display-order.md) | Orden filtros + estantes |
| [0003](docs/adr/0003-flavor-selection-on-card.md) | `flavor-line` vs `flavored` |

Registro de implementación: [docs/changelog/2026-05-27-estante-y-sabores.md](docs/changelog/2026-05-27-estante-y-sabores.md).

---

## Ambigüedades resueltas

| Antes | Resolución |
|-------|------------|
| "Subir" = importar o publicar | **Importación** → borrador; **Publicar** → en línea |
| "Vista previa" del borrador vs de tarjeta | Borrador = pantalla admin; preview de tarjeta = sin carrito |
| Un solo tipo “con sabores” | **Línea de producto** (panel rico) vs **Producto con sabores** (select en tarjeta) |
| Keto/Veganos como categoría de alta | Son **Filtros de tienda**; el producto vive en estante real + flags |
