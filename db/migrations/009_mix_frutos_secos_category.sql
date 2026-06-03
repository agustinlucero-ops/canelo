-- Categoría de estante para mixes y reubicación de productos existentes (sin fusionar)
INSERT INTO categories (name, sort_order)
VALUES ('Mix frutos secos', 4)
ON CONFLICT (name) DO UPDATE
SET sort_order = EXCLUDED.sort_order;

UPDATE products
SET
  category = 'Mix frutos secos',
  product_type = 'flavor-line',
  variants = jsonb_build_array(
    jsonb_build_object(
      'id', id,
      'label', name,
      'image', image,
      'outOfStock', COALESCE(out_of_stock, false)
    )
  ),
  updated_at = now()
WHERE id IN (
  'mix-energetico',
  'mix-clasico',
  'mix-power',
  'mix-patagonico',
  'mix-canelo'
);
