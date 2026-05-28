-- Maní saborizado: producto con sabores en tarjeta (no línea de producto)
UPDATE products
SET
  product_type = 'flavored',
  variants = '[
    {"id": "mani-saborizado-sabor-1", "label": "Sabor 1", "image": "/images/products/mani.svg", "outOfStock": false},
    {"id": "mani-saborizado-sabor-2", "label": "Sabor 2", "image": "/images/products/mani.svg", "outOfStock": false}
  ]'::jsonb,
  updated_at = now()
WHERE id = 'mani-saborizado';
