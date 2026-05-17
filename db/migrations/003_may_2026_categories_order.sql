UPDATE categories
SET name = 'Keto'
WHERE lower(name) = 'apto keto'
  AND NOT EXISTS (
    SELECT 1
    FROM categories AS c
    WHERE lower(c.name) = 'keto'
  );

WITH ordered_categories(name, sort_order) AS (
  VALUES
    ('Sin tacc', 0),
    ('Granolas', 1),
    ('Keto', 2),
    ('Frutos secos', 3),
    ('Semillas', 4),
    ('Avenas/Arroz/Harinas', 5),
    ('Cereales', 6),
    ('Pastas de mani', 7),
    ('Maní suelto', 8),
    ('Miel/Polen', 9),
    ('Ghee', 10),
    ('Barritas', 11),
    ('Combos', 12),
    ('Varios', 13),
    ('Aceite de coco', 14),
    ('Veganos', 15),
    ('Congelados', 16)
)
INSERT INTO categories (name, sort_order)
SELECT name, sort_order
FROM ordered_categories
ON CONFLICT (name) DO UPDATE
SET sort_order = EXCLUDED.sort_order;
