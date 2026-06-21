import { buildCartPresentationFields } from "./cartItemPricing";
import { productHasFlavorVariants } from "./sanitizeCatalog";
import { resolveVariantImage } from "./variantImage.js";

function cartItemMatchesCatalogSnapshot(item, nextItem) {
  return (
    nextItem.name === item.name &&
    nextItem.image === item.image &&
    nextItem.unitPrice === item.unitPrice &&
    nextItem.listPrice === item.listPrice &&
    (nextItem.discountPercent ?? null) === (item.discountPercent ?? null) &&
    nextItem.presentation === item.presentation
  );
}

function buildCatalogIndexes(products) {
  const productById = new Map();
  const flavorLineByVariantId = new Map();

  for (const product of products) {
    productById.set(product.id, product);
    if (!productHasFlavorVariants(product.productType) || !Array.isArray(product.variants)) {
      continue;
    }

    for (const variant of product.variants) {
      flavorLineByVariantId.set(variant.id, { line: product, variant });
    }
  }

  return { productById, flavorLineByVariantId };
}

export function reconcileCartItems(cartItems, products) {
  if (!cartItems.length) {
    return { items: [], removedCount: 0, updatedCount: 0 };
  }

  const { productById, flavorLineByVariantId } = buildCatalogIndexes(products);
  let removedCount = 0;
  let updatedCount = 0;
  const nextItems = [];

  for (const item of cartItems) {
    const flavorEntry = flavorLineByVariantId.get(item.productId);

    if (flavorEntry) {
      const { line, variant } = flavorEntry;

      if (variant.outOfStock || line.outOfStock) {
        removedCount += 1;
        continue;
      }

      const presentation = line.presentations.find((entry) => entry.label === item.presentation);

      if (!presentation) {
        removedCount += 1;
        continue;
      }

      const priceFields = buildCartPresentationFields(presentation);
      const nextItem = {
        ...item,
        key: `${variant.id}-${presentation.label}`,
        lineId: line.id,
        flavorLabel: variant.label,
        name: `${line.name} — ${variant.label}`,
        image: resolveVariantImage(variant, line),
        presentation: presentation.label,
        ...priceFields,
      };

      if (!priceFields.discountPercent) {
        delete nextItem.discountPercent;
      }

      if (!cartItemMatchesCatalogSnapshot(item, nextItem)) {
        updatedCount += 1;
      }

      nextItems.push(nextItem);
      continue;
    }

    const product = productById.get(item.productId);

    if (!product || product.outOfStock) {
      removedCount += 1;
      continue;
    }

    const presentation = product.presentations.find((entry) => entry.label === item.presentation);

    if (!presentation) {
      removedCount += 1;
      continue;
    }

    const priceFields = buildCartPresentationFields(presentation);
    const nextItem = {
      ...item,
      key: `${product.id}-${presentation.label}`,
      name: product.name,
      image: product.image,
      presentation: presentation.label,
      ...priceFields,
    };

    if (!priceFields.discountPercent) {
      delete nextItem.discountPercent;
    }

    if (!cartItemMatchesCatalogSnapshot(item, nextItem)) {
      updatedCount += 1;
    }

    nextItems.push(nextItem);
  }

  return { items: nextItems, removedCount, updatedCount };
}
