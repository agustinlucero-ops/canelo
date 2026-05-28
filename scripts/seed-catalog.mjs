import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getSql } from "../server/db.mjs";
import {
  collectCategoryNames,
  sanitizeProducts,
} from "./lib/catalogSanitize.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const productsPath = join(__dirname, "..", "src", "data", "products.json");

async function upsertCategory(sql, name, sortOrder) {
  await sql`
    INSERT INTO categories (name, sort_order)
    VALUES (${name}, ${sortOrder})
    ON CONFLICT (name) DO UPDATE SET sort_order = EXCLUDED.sort_order
  `;
}

async function upsertProduct(sql, product) {
  const presentationsJson = JSON.stringify(product.presentations);
  const variantsJson = JSON.stringify(product.variants ?? []);
  await sql`
    INSERT INTO products (
      id,
      name,
      category,
      image,
      product_type,
      variants,
      is_vegan,
      is_keto,
      is_gluten_free,
      out_of_stock,
      presentations,
      shelf_note
    )
    VALUES (
      ${product.id},
      ${product.name},
      ${product.category},
      ${product.image},
      ${product.productType ?? "simple"},
      ${variantsJson}::jsonb,
      ${product.isVegan},
      ${product.isKeto},
      ${product.isGlutenFree},
      ${product.outOfStock},
      ${presentationsJson}::jsonb,
      ${product.shelfNote ?? ""}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      category = EXCLUDED.category,
      image = EXCLUDED.image,
      product_type = EXCLUDED.product_type,
      variants = EXCLUDED.variants,
      is_vegan = EXCLUDED.is_vegan,
      is_keto = EXCLUDED.is_keto,
      is_gluten_free = EXCLUDED.is_gluten_free,
      out_of_stock = EXCLUDED.out_of_stock,
      presentations = EXCLUDED.presentations,
      shelf_note = EXCLUDED.shelf_note,
      updated_at = now()
  `;
}

async function main() {
  const raw = JSON.parse(readFileSync(productsPath, "utf8"));
  const { products, skipped } = sanitizeProducts(raw);
  const categoryNames = collectCategoryNames(products);
  const sql = getSql();

  for (let index = 0; index < categoryNames.length; index += 1) {
    await upsertCategory(sql, categoryNames[index], index);
  }

  for (const product of products) {
    await upsertProduct(sql, product);
  }

  const counts = await sql`
    SELECT category, COUNT(*)::int AS count
    FROM products
    GROUP BY category
    ORDER BY category
  `;

  console.log(`Seed completado: ${products.length} productos, ${categoryNames.length} categorías.`);
  if (skipped.length) {
    console.log("Productos omitidos:", skipped);
  }
  console.log("Productos por categoría:");
  for (const row of counts) {
    console.log(`  ${row.category}: ${row.count}`);
  }
}

main().catch((err) => {
  console.error("[db:seed]", err);
  process.exit(1);
});
