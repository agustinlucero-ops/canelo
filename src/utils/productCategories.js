export const VEGAN_FILTER_CATEGORY = "Veganos";

export function isVeganFilterCategory(category) {
  return normalizeCategoryName(category) === VEGAN_FILTER_CATEGORY;
}

export function normalizeCategoryName(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function getProductCategoryOptions(categories) {
  return categories.filter((category) => !isVeganFilterCategory(category));
}

export function inferLegacyVeganProductCategory(product) {
  const name = String(product?.name ?? "").toLowerCase();
  if (name.includes("granola")) return "Granolas";
  return "Sin tacc";
}

export function resolveProductCategoryAndVegan(product, normalizedCategory) {
  if (isVeganFilterCategory(normalizedCategory)) {
    return {
      category: inferLegacyVeganProductCategory(product),
      isVegan: true,
    };
  }

  return {
    category: normalizedCategory,
    isVegan: Boolean(product?.isVegan),
  };
}
