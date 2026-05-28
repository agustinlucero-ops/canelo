# Canelo — Catálogo de tienda

Contexto del negocio: tienda dietética con catálogo web, carrito y pedidos por WhatsApp. El dueño actualiza productos y precios periódicamente desde el panel admin.

## Language

**Catálogo en línea**:
Los productos y categorías visibles para los clientes en la tienda web.
_Avoid_: Live, producción, publicado (como sustantivo suelto)

**Borrador**:
Conjunto de productos y categorías importados que aún no son visibles para clientes; se revisa y edita antes de publicar.
_Avoid_: Staging, draft, preview, pendiente

**Publicar**:
Acción que hace visibles en el catálogo en línea los ítems del borrador.
_Avoid_: Subir, activar, sincronizar

**Importación**:
Proceso de cargar un archivo (PDF o Excel), parsearlo y crear o reemplazar un borrador.
_Avoid_: Upload, seed, carga masiva

**Archivo de catálogo**:
Documento que el dueño entrega con productos y precios; puede ser catálogo completo o solo novedades.
_Avoid_: Listado, planilla, inventario

**Producto existente**:
Producto que ya figura en el catálogo en línea antes de una importación.
_Avoid_: Duplicado, viejo, legacy

**Carrito**:
Conjunto de productos que el cliente selecciona en la tienda antes de armar el pedido por WhatsApp.
_Avoid_: Cart, bolsa, cesta

**Confirmación de agregado**:
Aviso breve y visible que confirma al cliente que un producto entró al carrito.
_Avoid_: Toast, snackbar, notificación push

**Línea de producto**:
Ítem del catálogo en línea que agrupa varios sabores bajo una marca o familia (ej. Granola CUCA). El cliente abre el panel de sabores desde la tarjeta.
_Avoid_: Producto padre, combo, familia

**Producto con sabores**:
Ítem del estante con un solo nombre y varios sabores elegibles en la tarjeta (ej. Maní saborizado). No es línea de producto.
_Avoid_: Variante, subproducto

**Sabor**:
Opción elegible dentro de una línea o de un producto con sabores.
_Avoid_: Variante, presentación, subproducto

**Aclaración de estante**:
Texto corto opcional bajo el nombre en la tarjeta de un producto simple del catálogo en línea.
_Avoid_: Subtítulo, descripción (no confundir con textos largos del **Sabor** en paneles de sabores)

**Tipo de archivo**:
Elección explícita al importar: catálogo completo (comparar con la tienda) o solo productos nuevos (agregar filas del archivo).
_Avoid_: Modo, estrategia de diff

**Categoría de estante**:
Categoría donde vive un producto en el catálogo en línea (ej. Granolas, Frutos secos). El dueño puede cambiar el orden en que aparecen en la tienda.
_Avoid_: Sección, familia, rubro

**Filtro de tienda**:
Entrada del listado horizontal que agrupa productos por un criterio transversal (Sin tacc, Keto, Veganos), no por estante. Siempre va al inicio del catálogo; no se reordena con los estantes.
_Avoid_: Chip, tag, badge (como sustantivo de catálogo)

## Relationships

- Una **Importación** produce exactamente un **Borrador** activo
- **Publicar** transfiere ítems del **Borrador** al **Catálogo en línea**
- Un **Producto existente** se identifica por nombre normalizado (sin acentos, minúsculas)
- Los clientes solo ven el **Catálogo en línea**, nunca un **Borrador**
- Agregar un producto desde una tarjeta dispara una **Confirmación de agregado** y actualiza el **Carrito**
- Una **Línea de producto** tiene uno o más **Sabores**; el cliente los explora en un panel y agrega al **Carrito** un **Sabor** concreto
- Un **Producto con sabores** tiene uno o más **Sabores**; el cliente elige **Sabor** en la tarjeta y agrega al **Carrito**
- Un producto simple puede tener cero o una **Aclaración de estante**; no aplica a **Líneas de producto** ni a **Productos con sabores**
- El orden visible del **Catálogo en línea** combina **Filtros de tienda** fijos y **Categorías de estante** ordenadas por el dueño; si un producto usa una categoría que aún no estaba en la tabla, el sistema la registra automáticamente al final

## Example dialogue

> **Dev:** "Subió un PDF de catálogo completo con 200 productos, pero 180 ya están en línea. ¿Qué entra al borrador?"
> **Dueño:** "Solo lo que falta, y si marco actualizar precios, también los que cambiaron de valor. Lo reviso en el borrador y recién ahí publico."

> **Dev:** "El PDF tiene una sección KETO. ¿Es categoría nueva?"
> **Dueño:** "No, es como la tienda hoy: badge keto y el producto va en su categoría real, no en una categoría que diga Keto."

## Flagged ambiguities

- "Subir" se usaba para importar y para publicar — resuelto: **Importación** crea borrador; **Publicar** pone en línea.
- "Vista previa" se usaba para revisión del borrador y para modo `preview` de una tarjeta — resuelto: revisión del borrador es pantalla admin; preview de tarjeta es solo visualización sin carrito.
