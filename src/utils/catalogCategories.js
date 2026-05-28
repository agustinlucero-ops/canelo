import { buildDisplayCategoryOrder } from "./buildDisplayCategoryOrder.js";

export function normalizeCategoryLabel(value) {
  const normalizedValue = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
  return normalizedValue.toLowerCase() === "ceriales" ? "Cereales" : normalizedValue;
}

/** @deprecated Usar buildDisplayCategoryOrder */
export function mergeOrderedCategories(apiCategoryRows, products, fallbackOrder = []) {
  return buildDisplayCategoryOrder({
    apiCategories: apiCategoryRows,
    products,
    fallbackOrder,
  });
}

export function clearCatalogLocalStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("canelo.products");
  window.localStorage.removeItem("canelo.categories");
}
