import { normalizeProductName } from "./productName.js";
import { normalizeCategoryLabel } from "./catalogCategories.js";
import { resolveProductCategoryAndVegan } from "./productCategories.js";

export const DEFAULT_PRODUCT_IMAGE = "/images/products/almendra.svg";

export const PRODUCT_TYPE_SIMPLE = "simple";
export const PRODUCT_TYPE_FLAVOR_LINE = "flavor-line";
export const PRODUCT_TYPE_FLAVORED = "flavored";

export const SHELF_NOTE_MAX_LENGTH = 50;

export function sanitizeShelfNote(value) {
  return String(value ?? "").trim().slice(0, SHELF_NOTE_MAX_LENGTH);
}

export function productHasFlavorVariants(productType) {
  return productType === PRODUCT_TYPE_FLAVOR_LINE || productType === PRODUCT_TYPE_FLAVORED;
}

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

export function sanitizeVariants(variants, { defaultImage = DEFAULT_PRODUCT_IMAGE } = {}) {
  if (!Array.isArray(variants)) return [];

  const usedIds = new Set();

  return variants
    .map((variant, index) => {
      const rawId = String(variant?.id ?? "").trim();
      const baseId = rawId || `sabor-${index + 1}`;
      let id = baseId;
      let duplicateIndex = 2;
      while (usedIds.has(id)) {
        id = `${baseId}-${duplicateIndex}`;
        duplicateIndex += 1;
      }
      const label = String(variant?.label ?? "").trim();
      const image = String(variant?.image ?? "").trim() || defaultImage;
      const description = String(variant?.description ?? "").trim();
      const contents = Array.isArray(variant?.contents)
        ? variant.contents.map((entry) => String(entry ?? "").trim()).filter(Boolean)
        : [];
      if (!label) return null;
      usedIds.add(id);

      return {
        id,
        label,
        image,
        description,
        contents,
        isVegan: Boolean(variant?.isVegan),
        outOfStock: Boolean(variant?.outOfStock),
      };
    })
    .filter(Boolean);
}

function normalizeProductType(value) {
  const normalized = String(value ?? PRODUCT_TYPE_SIMPLE).trim();
  if (normalized === PRODUCT_TYPE_FLAVOR_LINE) return PRODUCT_TYPE_FLAVOR_LINE;
  if (normalized === PRODUCT_TYPE_FLAVORED) return PRODUCT_TYPE_FLAVORED;
  return PRODUCT_TYPE_SIMPLE;
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
      const productType = normalizeProductType(product?.productType);
      const presentations = sanitizePresentations(product?.presentations);
      const variants = sanitizeVariants(product?.variants, { defaultImage });

      if (productHasFlavorVariants(productType)) {
        if (!name || !presentations.length || !variants.length) return null;
        return {
          id,
          name,
          category,
          image,
          productType,
          presentations,
          variants,
          isVegan,
          isKeto,
          isGlutenFree,
          outOfStock: Boolean(product?.outOfStock),
        };
      }

      if (!name || !presentations.length) return null;

      const shelfNote = sanitizeShelfNote(product?.shelfNote);

      return {
        id,
        name,
        category,
        image,
        productType: PRODUCT_TYPE_SIMPLE,
        presentations,
        variants: [],
        isVegan,
        isKeto,
        isGlutenFree,
        outOfStock: Boolean(product?.outOfStock),
        ...(shelfNote ? { shelfNote } : {}),
      };
    })
    .filter(Boolean);
}
