ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_keto BOOLEAN;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_gluten_free BOOLEAN;

INSERT INTO categories (name, sort_order)
SELECT 'Sin tacc', COALESCE(MAX(sort_order), -1) + 1
FROM categories
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, sort_order)
SELECT 'Granolas', COALESCE(MAX(sort_order), -1) + 1
FROM categories
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, sort_order)
SELECT 'Harinas y legumbres', COALESCE(MAX(sort_order), -1) + 1
FROM categories
ON CONFLICT (name) DO NOTHING;

UPDATE products
SET category = CASE
  WHEN lower(trim(category)) IN ('veganos', 'vegano')
    THEN CASE
      WHEN lower(name) LIKE '%granola%' THEN 'Granolas'
      ELSE 'Sin tacc'
    END
  WHEN lower(trim(category)) IN ('keto', 'apto keto')
    THEN CASE
      WHEN lower(name) LIKE '%harina%' OR lower(name) LIKE '%psyllium%' THEN 'Harinas y legumbres'
      ELSE 'Sin tacc'
    END
  ELSE category
END
WHERE lower(trim(category)) IN ('veganos', 'vegano', 'keto', 'apto keto');

UPDATE products
SET is_keto = false
WHERE is_keto IS NULL;

UPDATE products
SET is_gluten_free = false
WHERE is_gluten_free IS NULL;

ALTER TABLE products
ALTER COLUMN is_keto SET DEFAULT false;

ALTER TABLE products
ALTER COLUMN is_gluten_free SET DEFAULT false;

ALTER TABLE products
ALTER COLUMN is_keto SET NOT NULL;

ALTER TABLE products
ALTER COLUMN is_gluten_free SET NOT NULL;

ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_reserved_category_check;

ALTER TABLE products
ADD CONSTRAINT products_reserved_category_check
CHECK (lower(trim(category)) NOT IN ('veganos', 'keto', 'apto keto'));

CREATE INDEX IF NOT EXISTS products_is_vegan_idx ON products (is_vegan);
CREATE INDEX IF NOT EXISTS products_is_keto_idx ON products (is_keto);
CREATE INDEX IF NOT EXISTS products_is_gluten_free_idx ON products (is_gluten_free);
