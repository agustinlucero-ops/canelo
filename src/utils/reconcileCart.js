import { PRODUCT_TYPE_FLAVOR_LINE } from "./sanitizeCatalog";

function buildCatalogIndexes(products) {
  const productById = new Map();
  const flavorLineByVariantId = new Map();

  for (const product of products) {
    productById.set(product.id, product);
    if (product.productType !== PRODUCT_TYPE_FLAVOR_LINE || !Array.isArray(product.variants)) {
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

      const nextItem = {
        ...item,
        key: `${variant.id}-${presentation.label}`,
        lineId: line.id,
        flavorLabel: variant.label,
        name: `${line.name} — ${variant.label}`,
        image: variant.image || line.image,
        presentation: presentation.label,
        unitPrice: presentation.price,
      };

      if (
        nextItem.name !== item.name ||
        nextItem.image !== item.image ||
        nextItem.unitPrice !== item.unitPrice ||
        nextItem.presentation !== item.presentation
      ) {
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

    const nextItem = {
      ...item,
      key: `${product.id}-${presentation.label}`,
      name: product.name,
      image: product.image,
      presentation: presentation.label,
      unitPrice: presentation.price,
    };

    if (
      nextItem.name !== item.name ||
      nextItem.image !== item.image ||
      nextItem.unitPrice !== item.unitPrice ||
      nextItem.presentation !== item.presentation
    ) {
      updatedCount += 1;
    }

    nextItems.push(nextItem);
  }

  return { items: nextItems, removedCount, updatedCount };
}
