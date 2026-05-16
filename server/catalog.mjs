import { getSql } from "./db.mjs";

function mapProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    image: row.image,
    presentations: row.presentations,
    isVegan: row.is_vegan,
    outOfStock: row.out_of_stock,
  };
}

export async function listCategories() {
  const sql = getSql();
  const rows = await sql`
    SELECT name, sort_order
    FROM categories
    ORDER BY sort_order ASC, name ASC
  `;
  return rows.map((row) => ({
    name: row.name,
    sortOrder: row.sort_order,
  }));
}

export async function listProducts({ category } = {}) {
  const sql = getSql();
  const normalizedCategory = category?.trim();

  const rows = normalizedCategory
    ? await sql`
        SELECT id, name, category, image, is_vegan, out_of_stock, presentations
        FROM products
        WHERE category = ${normalizedCategory}
        ORDER BY name ASC
      `
    : await sql`
        SELECT id, name, category, image, is_vegan, out_of_stock, presentations
        FROM products
        ORDER BY category ASC, name ASC
      `;

  return rows.map(mapProductRow);
}

export async function getProductById(id) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, name, category, image, is_vegan, out_of_stock, presentations
    FROM products
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ? mapProductRow(rows[0]) : null;
}
