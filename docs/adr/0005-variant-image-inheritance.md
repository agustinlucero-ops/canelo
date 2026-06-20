# Herencia de foto de línea vs foto del sabor

En **Línea de producto**, la **Foto de línea** es la fuente de verdad; cada **Sabor** hereda salvo **Foto del sabor** explícita (override). En **Producto con sabores** solo existe **Foto de línea**. En datos, `variants[].image` vacío significa herencia; no se duplica la URL de la línea salvo override real. Al leer el catálogo, placeholder genérico o imagen idéntica a la línea se trata como herencia (no override). Cambiar la foto de línea actualiza solo sabores que heredan; quitar un override vuelve a heredar de inmediato.

**Considered options:** copiar siempre la foto de línea en cada sabor al guardar (más simple en lectura, frágil al editar); flag `hasCustomImage` por sabor (explícito pero más modelo).

**Consequences:** `sanitizeVariants` y la tienda resuelven la imagen visible con un helper compartido; **Gestión** muestra override colapsado solo en líneas de producto.
