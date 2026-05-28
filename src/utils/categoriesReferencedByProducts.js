import { normalizeCategoryLabel } from "./catalogCategories.js";

const normalizeKey = (value) => String(value ?? "").trim().toLowerCase();

/**
 * Categorías usadas por productos pero ausentes en la tabla/listado oficial de categorías.
 */
export function categoriesReferencedByProducts(products, catalogCategoryNames) {
  const catalogKeys = new Set(
    (catalogCategoryNames ?? []).map((name) => normalizeKey(normalizeCategoryLabel(name)))
  );

  const missingKeys = new Set();
  const missing = [];

  for (const product of products ?? []) {
    const label = normalizeCategoryLabel(product?.category);
    if (!label) continue;

    const key = normalizeKey(label);
    if (catalogKeys.has(key) || missingKeys.has(key)) continue;

    missingKeys.add(key);
    missing.push(label);
  }

  return missing.sort((a, b) => a.localeCompare(b, "es"));
}
