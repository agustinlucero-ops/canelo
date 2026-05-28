# ADR 0003: Dos formas de vender con sabores

## Estado

Aceptado (2026-05-27), revisado tras corrección de alcance

## Contexto

Hay dos casos distintos en el catálogo:

1. **Líneas de producto** (granolas por marca): varios sabores con foto, descripción e ingredientes; el cliente explora en un panel lateral.
2. **Productos con sabores** (maní saborizado): un nombre en el estante y sabores que solo necesitan nombre; el cliente elige en la tarjeta.

## Decisión

- `productType: "flavor-line"` → tarjeta con **Sabores y contenidos** + `FlavorPickerPanel` (pills y detalle).
- `productType: "flavored"` → tarjeta con `<select>` de sabor + **Agregar al carrito** (`FlavorLineCard`).
- Ambos comparten presentaciones/precio a nivel producto y el mismo modelo de carrito por id de sabor (ADR 0001).

## Alternativas consideradas

1. **Un solo tipo con la misma UI**: mezclaba granolas (rico en detalle) con maní (selector simple).
2. **Varios productos simples por sabor**: duplica estante y admin.

## Consecuencias

- Admin distingue **Línea de producto (granola)** vs **Producto con sabores (maní)** al crear.
- Maní saborizado usa `flavored`, no `flavor-line`.
