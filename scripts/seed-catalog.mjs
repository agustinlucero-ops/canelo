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
  await sql`
    INSERT INTO products (
      id,
      name,
      category,
      image,
      is_vegan,
      out_of_stock,
      presentations
    )
    VALUES (
      ${product.id},
      ${product.name},
      ${product.category},
      ${product.image},
      ${product.isVegan},
      ${product.outOfStock},
      ${presentationsJson}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      category = EXCLUDED.category,
      image = EXCLUDED.image,
      is_vegan = EXCLUDED.is_vegan,
      out_of_stock = EXCLUDED.out_of_stock,
      presentations = EXCLUDED.presentations,
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
