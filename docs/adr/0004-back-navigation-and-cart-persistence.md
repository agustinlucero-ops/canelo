# ADR 0004: Navegación atrás y persistencia del carrito

## Estado

Aceptado (2026-06-17)

## Contexto

La tienda es una SPA sin rutas. El gesto atrás del navegador o del celular abandonaba el sitio entero aunque el cliente tuviera el carrito o un panel abierto. El carrito vivía solo en memoria y se vaciaba al tocar WhatsApp, aunque el pedido no se completara.

## Decisión

- Interceptar `popstate` con una pila de **Capas superpuestas** (edición de producto → login admin → panel de sabores → carrito) antes de permitir salir.
- En **Gestión**, el gesto atrás vuelve a **Catálogo en línea**.
- Si el **Carrito** tiene productos y el catálogo está en foco, mostrar **Confirmación de salida** (también vía `beforeunload` al cerrar pestaña o recargar).
- Persistir el carrito activo en `sessionStorage`.
- Guardar un **Carrito anterior** en `localStorage` (24 h) al iniciar pedido por WhatsApp, con oferta de restaurar dentro del drawer vacío.

## Alternativas consideradas

1. **React Router con rutas por capa**: más pesado para una sola pantalla con overlays.
2. **Solo `sessionStorage` sin History API**: no resuelve el gesto atrás dentro de la app.
3. **Mantener el carrito activo al ir a WhatsApp**: deja el drawer lleno al volver; se prefirió snapshot explícito como **Carrito anterior**.

## Consecuencias

- Módulos puros testeables: `resolveBackNavigation`, `cartSessionStorage`, `previousCartStorage`.
- El texto de confirmación al cerrar pestaña lo controla el navegador, no la app.
- No se toca la base de datos ni el flujo de imágenes del catálogo.
