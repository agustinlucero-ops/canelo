export const VEGAN_FILTER_CATEGORY = "Veganos";
export const KETO_FILTER_CATEGORY = "Keto";
export const GLUTEN_FREE_FILTER_CATEGORY = "Sin tacc";

const VEGAN_FILTER_ALIASES = new Set(["veganos", "vegano"]);
const KETO_FILTER_ALIASES = new Set(["keto", "apto keto"]);
const GLUTEN_FREE_FILTER_ALIASES = new Set(["sin tacc", "sin gluten", "gluten free", "gluten-free"]);

export function isVeganFilterCategory(category) {
  return VEGAN_FILTER_ALIASES.has(normalizeCategoryName(category).toLowerCase());
}

export function isKetoFilterCategory(category) {
  return KETO_FILTER_ALIASES.has(normalizeCategoryName(category).toLowerCase());
}

export function isGlutenFreeFilterCategory(category) {
  return GLUTEN_FREE_FILTER_ALIASES.has(normalizeCategoryName(category).toLowerCase());
}

export function normalizeCategoryName(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function getProductCategoryOptions(categories) {
  return categories.filter(
    (category) => !isVeganFilterCategory(category) && !isKetoFilterCategory(category)
  );
}

export function inferLegacyVeganProductCategory(product) {
  const name = String(product?.name ?? "").toLowerCase();
  if (name.includes("granola")) return "Granolas";
  return "Sin tacc";
}

export function inferLegacyKetoProductCategory(product) {
  const name = String(product?.name ?? "").toLowerCase();
  if (name.includes("harina") || name.includes("psyllium")) return "Harinas y legumbres";
  return "Sin tacc";
}

export function resolveProductCategoryAndVegan(product, normalizedCategory) {
  const isLegacyGlutenFreeCategory = isGlutenFreeFilterCategory(normalizedCategory);

  if (isKetoFilterCategory(normalizedCategory)) {
    return {
      category: inferLegacyKetoProductCategory(product),
      isVegan: Boolean(product?.isVegan),
      isKeto: true,
      isGlutenFree: Boolean(product?.isGlutenFree),
    };
  }

  if (isVeganFilterCategory(normalizedCategory)) {
    return {
      category: inferLegacyVeganProductCategory(product),
      isVegan: true,
      isKeto: Boolean(product?.isKeto),
      isGlutenFree: Boolean(product?.isGlutenFree),
    };
  }

  return {
    category: normalizedCategory,
    isVegan: Boolean(product?.isVegan),
    isKeto: Boolean(product?.isKeto),
    isGlutenFree: Boolean(product?.isGlutenFree) || isLegacyGlutenFreeCategory,
  };
}
