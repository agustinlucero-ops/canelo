# ADR 0001: Líneas con sabores en JSONB

## Estado

Aceptado (2026-05-27)

## Contexto

Algunos productos del catálogo (granolas CUCA y TUTTI GRANI) se venden como una sola tarjeta con varios sabores. Cada sabor tiene foto, texto y lista de ingredientes distintos, pero comparten presentación y precio a nivel de línea.

## Decisión

- Modelar **líneas de producto** con `productType: "flavor-line"` y un arreglo `variants` (sabores) en JSONB en la tabla `products`.
- Los productos simples usan `productType: "simple"` y `variants: []`.
- El carrito identifica ítems por el id del **sabor**; el nombre visible combina línea y sabor.

## Alternativas consideradas

1. **Tabla `product_variants`**: más normalizado, pero más migraciones y joins para un catálogo pequeño.
2. **Varios productos sueltos agrupados solo en UI**: duplica presentaciones y complica el admin.

## Consecuencias

- Migración `006_flavor_lines.sql` añade `product_type` y `variants`.
- Reconciliación del carrito debe indexar sabores dentro de líneas.
- El import Excel/PDF no agrupa líneas automáticamente (fuera de alcance inicial).
