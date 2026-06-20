import { DEFAULT_PRODUCT_IMAGE } from "./sanitizeCatalog.js";

export function isGenericProductImage(image) {
  const normalized = String(image ?? "").trim();
  return !normalized || normalized === DEFAULT_PRODUCT_IMAGE;
}

export function isVariantImageOverride(variantImage, lineImage) {
  const normalizedVariant = String(variantImage ?? "").trim();
  if (!normalizedVariant) return false;
  if (isGenericProductImage(normalizedVariant)) return false;
  if (normalizedVariant === String(lineImage ?? "").trim()) return false;
  return true;
}

export function normalizeVariantImageForStorage(variantImage, lineImage) {
  return isVariantImageOverride(variantImage, lineImage) ? String(variantImage).trim() : "";
}

export function resolveVariantImage(variant, line, { defaultImage = DEFAULT_PRODUCT_IMAGE } = {}) {
  const lineImage = String(line?.image ?? "").trim() || defaultImage;
  const variantImage = String(variant?.image ?? "").trim();

  if (isVariantImageOverride(variantImage, lineImage)) {
    return variantImage;
  }

  return lineImage;
}
