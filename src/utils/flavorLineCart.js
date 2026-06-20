import { resolveVariantImage } from "./variantImage.js";

export function buildFlavorLineCartItem({ line, variant, presentation, quantity = 1 }) {
  return {
    key: `${variant.id}-${presentation.label}`,
    productId: variant.id,
    lineId: line.id,
    flavorLabel: variant.label,
    name: `${line.name} — ${variant.label}`,
    image: resolveVariantImage(variant, line),
    presentation: presentation.label,
    unitPrice: presentation.price,
    quantity,
  };
}

export function getFirstAvailableVariant(variants) {
  if (!Array.isArray(variants) || !variants.length) return null;
  return variants.find((variant) => !variant.outOfStock) ?? variants[0];
}
