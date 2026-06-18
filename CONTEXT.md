# Canelo — Catálogo de tienda

Contexto del negocio: tienda dietética con catálogo web, carrito y pedidos por WhatsApp. El dueño actualiza productos y precios periódicamente desde el panel admin.

---

## Lenguaje ubicuo

### Catálogo y flujo editorial


| Término                 | Definición                                                                    | Evitar                        |
| ----------------------- | ----------------------------------------------------------------------------- | ----------------------------- |
| **Catálogo en línea**   | Productos y categorías visibles para clientes en la tienda web                | Live, producción, publicado   |
| **Borrador**            | Productos/categorías importados aún no visibles; se revisan antes de publicar | Staging, draft, preview       |
| **Publicar**            | Hacer visibles en línea los ítems del borrador                                | Subir, activar, sincronizar   |
| **Importación**         | Cargar archivo (PDF/Excel), parsear y crear o reemplazar borrador             | Upload, seed, carga masiva    |
| **Archivo de catálogo** | Documento del dueño con productos y precios (completo o novedades)            | Listado, planilla, inventario |
| **Producto existente**  | Producto ya en catálogo en línea antes de una importación                     | Duplicado, viejo, legacy      |


### Compra en tienda


| Término                      | Definición                                            | Evitar             |
| ---------------------------- | ----------------------------------------------------- | ------------------ |
| **Carrito**                  | Productos seleccionados antes del pedido por WhatsApp | Cart, bolsa, cesta |
| **Carrito anterior**         | Copia recuperable del último carrito enviado a WhatsApp, disponible hasta 24 h; se ofrece restaurar solo dentro del carrito vacío; el cliente puede descartar la oferta | Carrito guardado, backup |
| **Confirmación de agregado** | Aviso breve de que el producto entró al carrito       | Toast, snackbar    |
| **Pie de página**            | Bloque al final del **Catálogo en línea** con contacto, copyright y acceso «Ingresar admin»; no aparece en **Gestión** | Footer genérico    |


### Navegación en tienda


| Término                 | Definición                                                                 | Evitar              |
| ----------------------- | -------------------------------------------------------------------------- | ------------------- |
| **Gesto atrás**         | Botón atrás del navegador o deslizar para volver en el celular             | Back, swipe back    |
| **Capa superpuesta**    | Panel o modal que tapa el **Catálogo en línea** (carrito, sabores, login) | Overlay, popup      |
| **Catálogo en foco**    | **Catálogo en línea** visible sin ninguna **Capa superpuesta** abierta     | Vista base, home    |
| **Confirmación de salida** | Aviso antes de abandonar el sitio (gesto atrás, cerrar pestaña o recargar) si el **Carrito** tiene productos; texto en atrás: «¿Querés salir de la tienda? Tu carrito todavía tiene productos.» | Alerta de salida    |


### Productos en estante


| Término                   | Definición                                                                                 | Evitar                       |
| ------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------- |
| **Línea de producto**     | Ítem que agrupa varios sabores bajo una marca (ej. Granola CUCA); panel lateral de sabores | Producto padre, combo        |
| **Producto con sabores**  | Un nombre en estante y sabores elegibles en la tarjeta (ej. Maní saborizado); la **Presentación** siempre visible | Variante, subproducto        |
| **Sabor**                 | Opción dentro de una línea o de un producto con sabores                                    | Variante, presentación       |
| **Aclaración de estante** | Texto corto opcional bajo el nombre en producto **simple** (máx. 50 caracteres)            | Subtítulo, descripción larga |
| **Indicación de sin stock en tarjeta** | En la tienda, el producto o línea sin stock se comunica en el botón principal de la tarjeta («Sin stock»), no con cartel sobre la foto | No disponible (en botón de catálogo) |


### Categorías y navegación


| Término                      | Definición                                                                  | Evitar                    |
| ---------------------------- | --------------------------------------------------------------------------- | ------------------------- |
| **Categoría de estante**     | Dónde vive el producto (Granolas, Frutos secos, Mix frutos secos); orden editable en Gestión | Sección, rubro            |
| **Mix frutos secos**         | Estante de los mixes comerciales (energético, clásico, etc.), cada uno como producto propio | Subcategoría, combo       |
| **Presentación**             | Peso o formato de venta (100g, 500g, 1kg) con su precio; distinto del **Sabor**; en **Producto con sabores**, una sola presentación se muestra fija; varias permiten elegir | Peso, tamaño, variante    |
| **Filtro de tienda**         | Criterio transversal (Sin tacc, Keto, Veganos); fijo al inicio del catálogo | Chip, tag como sustantivo |
| **Tipo de archivo** (import) | Catálogo completo vs solo productos nuevos                                  | Modo, estrategia de diff  |


---

## Formas de producto (`productType`)

Correspondencia entre lenguaje de negocio y valor técnico:


| Negocio              | `productType` | UI en tienda                            | Admin al crear                |
| -------------------- | ------------- | --------------------------------------- | ----------------------------- |
| Producto simple      | `simple`      | `ProductCard` + aclaración opcional     | “Simple”                      |
| Línea de producto    | `flavor-line` | `GranolaLineCard` + `FlavorPickerPanel`; en **Mix frutos secos** y en **Mix cervecero**, presentaciones también en la tarjeta | “Línea de producto (granola)” |
| Producto con sabores | `flavored`    | `FlavorLineCard` (select de sabor)      | “Producto con sabores (maní)” |


Presentaciones y precio son a nivel producto en los tres casos con sabores. El carrito guarda el **id del sabor**.

---

## Relaciones

- Una **Importación** produce exactamente un **Borrador** activo.
- **Publicar** transfiere ítems del **Borrador** al **Catálogo en línea**.
- Un **Producto existente** se identifica por nombre normalizado (sin acentos, minúsculas).
- Los clientes solo ven el **Catálogo en línea**, nunca un **Borrador**.
- Agregar desde tarjeta → **Confirmación de agregado** → actualiza el **Carrito**.
- En **Producto con sabores**, la **Presentación** siempre es visible en la tarjeta, aunque haya una sola.
- Los pesos faltantes de un **Producto con sabores** se cargan después en **Gestión**; el arreglo de visibilidad no depende de tener varias **Presentaciones** ya cargadas.
- Una sola **Presentación** en **Producto con sabores** → chip fijo de solo lectura; dos o más → selector interactivo como Almohaditas u Ositos.
- En la tarjeta de **Producto con sabores**, el selector de **Sabor** queda arriba y la **Presentación** abajo.
- El **Carrito** activo persiste en la pestaña mientras el cliente navega (recargas, ida y vuelta dentro de la misma sesión).
- Al iniciar pedido por WhatsApp se conserva un **Carrito anterior** recuperable durante 24 horas.
- Si el **Carrito** está vacío y hay **Carrito anterior** vigente, el cliente puede restaurarlo desde el propio carrito.
- El cliente puede **Descartar** la oferta de **Carrito anterior**; no se vuelve a mostrar aunque el snapshot siga vigente hasta 24 h.
- Cada nuevo envío a WhatsApp reemplaza el **Carrito anterior** con el carrito que se acaba de intentar mandar.
- **Gesto atrás** con el **Carrito** abierto → cierra el carrito, mantiene los ítems, permanece en **Catálogo en línea**.
- **Gesto atrás** con una **Capa superpuesta** abierta → cierra la capa superior (prioridad: edición de producto → login admin → panel de sabores → carrito) antes de abandonar el sitio.
- **Gesto atrás** en **Gestión** sin capas abiertas → vuelve a **Catálogo en línea** (pestaña catálogo).
- **Gesto atrás** en **Catálogo en foco** → puede abandonar el sitio; si el **Carrito** tiene productos, muestra **Confirmación de salida** antes (también al cerrar pestaña o recargar).
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


| ADR                                               | Tema                          |
| ------------------------------------------------- | ----------------------------- |
| [0001](docs/adr/0001-flavor-lines-jsonb.md)       | Sabores en JSONB (`variants`) |
| [0002](docs/adr/0002-category-display-order.md)   | Orden filtros + estantes      |
| [0003](docs/adr/0003-flavor-selection-on-card.md) | `flavor-line` vs `flavored`   |
| [0004](docs/adr/0004-back-navigation-and-cart-persistence.md) | Navegación atrás y persistencia del carrito |

Registro de implementación: [docs/changelog/2026-05-27-estante-y-sabores.md](docs/changelog/2026-05-27-estante-y-sabores.md).

---

## Ambigüedades resueltas


| Antes                                     | Resolución                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| "Subir" = importar o publicar             | **Importación** → borrador; **Publicar** → en línea                                |
| "Vista previa" del borrador vs de tarjeta | Borrador = pantalla admin; preview de tarjeta = sin carrito ni sabor/peso (solo imagen y nombre) |
| Un solo tipo “con sabores”                | **Línea de producto** (panel rico) vs **Producto con sabores** (select en tarjeta) |
| Keto/Veganos como categoría de alta       | Son **Filtros de tienda**; el producto vive en estante real + flags                |
| Gesto atrás sale de la app entera         | **Capas superpuestas** y **Gestión** interceptan atrás antes de salir              |
| Harina sin piel/con piel como **Sabor** vs producto **simple** | Pendiente de revisión con el dueño; por ahora se mantiene `flavored` y solo se corrige visibilidad de **Presentación** |
| "Guardar" el carrito al cerrar el drawer  | El **Carrito** persiste en `sessionStorage`; cerrar el drawer no es una acción de guardado |
