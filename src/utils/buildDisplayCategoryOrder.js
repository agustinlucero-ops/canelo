import { categoriesReferencedByProducts } from "./categoriesReferencedByProducts.js";
import { normalizeCategoryLabel } from "./catalogCategories.js";
import { isShelfCategory, isStoreFilterCategory, STORE_FILTER_CATEGORIES } from "./productCategories.js";

const normalizeKey = (value) => String(value ?? "").trim().toLowerCase();

function pushCategory(ordered, seen, name) {
  const label = normalizeCategoryLabel(name);
  if (!label) return;
  const key = normalizeKey(label);
  if (seen.has(key)) return;
  seen.add(key);
  ordered.push(label);
}

/**
 * Orden visible en la tienda: filtros fijos → estantes (sort_order).
 * Las categorías solo presentes en productos se tratan como estantes al final.
 */
export function buildDisplayCategoryOrder({
  apiCategories = [],
  products = [],
  fallbackOrder = [],
} = {}) {
  const ordered = [];
  const seen = new Set();

  const apiRows = (apiCategories ?? [])
    .map((row) => ({
      name: normalizeCategoryLabel(row?.name ?? row),
      sortOrder: Number(row?.sortOrder ?? row?.sort_order ?? 0),
    }))
    .filter((row) => row.name);

  const apiNameKeys = new Set(apiRows.map((row) => normalizeKey(row.name)));

  if (!apiRows.length && fallbackOrder.length) {
    for (let index = 0; index < fallbackOrder.length; index += 1) {
      apiRows.push({
        name: normalizeCategoryLabel(fallbackOrder[index]),
        sortOrder: index,
      });
    }
  }

  const maxSortOrder = apiRows.reduce((max, row) => Math.max(max, row.sortOrder), -1);
  const missingFromCatalog = categoriesReferencedByProducts(
    products,
    apiRows.map((row) => row.name)
  );

  for (let index = 0; index < missingFromCatalog.length; index += 1) {
    const name = missingFromCatalog[index];
    if (!isShelfCategory(name)) continue;
    apiRows.push({
      name,
      sortOrder: maxSortOrder + 1 + index,
    });
    apiNameKeys.add(normalizeKey(name));
  }

  for (const filterName of STORE_FILTER_CATEGORIES) {
    const row = apiRows.find((entry) => normalizeKey(entry.name) === normalizeKey(filterName));
    if (row || isStoreFilterCategory(filterName)) {
      pushCategory(ordered, seen, filterName);
    }
  }

  const shelfRows = apiRows
    .filter((row) => isShelfCategory(row.name))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es"));

  for (const row of shelfRows) {
    pushCategory(ordered, seen, row.name);
  }

  return ordered;
}
