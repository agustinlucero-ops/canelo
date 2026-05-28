# ADR 0002: Orden visible de categorías en la tienda

## Estado

Aceptado (mayo 2026)

## Contexto

La tabla `categories` guarda `sort_order`, pero la tienda también muestra chips de **Filtros de tienda** (Sin tacc, Keto, Veganos) que no son estantes de producto. Los productos pueden referenciar categorías que aún no existían en la tabla.

## Decisión

El orden que ve el cliente se compone en dos capas visibles:

1. **Filtros de tienda** en posición fija al inicio (Sin tacc → Keto → Veganos).
2. **Categorías de estante** según `sort_order` en la DB, editable desde Gestión con flechas.

Al listar categorías (`GET /api/categories`), el servidor **crea filas faltantes** a partir de `products.category` (al final del orden). El frontend aplica la misma regla en modo offline.

Solo las categorías de estante se envían al endpoint `PUT /api/categories/order`.

## Consecuencias

- Cambiar el orden de un filtro requiere cambio de código, no de Gestión.
- `sort_order` en la DB para Keto/Veganos puede quedar obsoleto respecto al orden visible; la fuente de verdad del display es la regla de composición en el frontend.
- Reordenar estantes no afecta el orden alfabético de productos dentro de cada sección.
- Categorías detectadas solo en productos entran al final hasta que el dueño las reubique con las flechas.
