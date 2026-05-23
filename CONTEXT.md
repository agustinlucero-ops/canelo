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

**Tipo de archivo**:
Elección explícita al importar: catálogo completo (comparar con la tienda) o solo productos nuevos (agregar filas del archivo).
_Avoid_: Modo, estrategia de diff

## Relationships

- Una **Importación** produce exactamente un **Borrador** activo
- **Publicar** transfiere ítems del **Borrador** al **Catálogo en línea**
- Un **Producto existente** se identifica por nombre normalizado (sin acentos, minúsculas)
- Los clientes solo ven el **Catálogo en línea**, nunca un **Borrador**

## Example dialogue

> **Dev:** "Subió un PDF de catálogo completo con 200 productos, pero 180 ya están en línea. ¿Qué entra al borrador?"
> **Dueño:** "Solo lo que falta, y si marco actualizar precios, también los que cambiaron de valor. Lo reviso en el borrador y recién ahí publico."

> **Dev:** "El PDF tiene una sección KETO. ¿Es categoría nueva?"
> **Dueño:** "No, es como la tienda hoy: badge keto y el producto va en su categoría real, no en una categoría que diga Keto."

## Flagged ambiguities

- "Subir" se usaba para importar y para publicar — resuelto: **Importación** crea borrador; **Publicar** pone en línea.
- "Vista previa" se usaba para revisión del borrador y para modo `preview` de una tarjeta — resuelto: revisión del borrador es pantalla admin; preview de tarjeta es solo visualización sin carrito.
