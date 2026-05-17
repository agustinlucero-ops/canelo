import { normalizeProductName } from "./productName";
import { normalizeCategoryLabel } from "./catalogCategories";
import { resolveProductCategoryAndVegan } from "./productCategories";

export const DEFAULT_PRODUCT_IMAGE = "/images/products/almendra.svg";

export function sanitizePresentations(presentations) {
  if (!Array.isArray(presentations)) return [];

  return presentations
    .map((presentation) => {
      const label = String(presentation?.label ?? "").trim();
      const price = Number(presentation?.price);
      if (!label || Number.isNaN(price) || price <= 0) return null;
      return {
        label,
        price: Math.round(price),
      };
    })
    .filter(Boolean);
}

export function sanitizeProducts(productList, { defaultImage = DEFAULT_PRODUCT_IMAGE } = {}) {
  if (!Array.isArray(productList)) return [];

  return productList
    .map((product, index) => {
      const id = String(product?.id ?? "").trim() || `producto-${index + 1}`;
      const normalizedCategory =
        normalizeCategoryLabel(String(product?.category ?? "").trim()) || "Sin tacc";
      const { category, isVegan, isKeto, isGlutenFree } = resolveProductCategoryAndVegan(
        product,
        normalizedCategory
      );
      const name = normalizeProductName(String(product?.name ?? "").trim(), category);
      const image = String(product?.image ?? "").trim() || defaultImage;
      const presentations = sanitizePresentations(product?.presentations);
      if (!name || !presentations.length) return null;

      return {
        ...product,
        id,
        name,
        category,
        image,
        presentations,
        isVegan,
        isKeto,
        isGlutenFree,
        outOfStock: Boolean(product?.outOfStock),
      };
    })
    .filter(Boolean);
}
