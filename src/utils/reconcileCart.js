export function reconcileCartItems(cartItems, products) {
  if (!cartItems.length) {
    return { items: [], removedCount: 0, updatedCount: 0 };
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  let removedCount = 0;
  let updatedCount = 0;
  const nextItems = [];

  for (const item of cartItems) {
    const product = productById.get(item.productId);

    if (!product || product.outOfStock) {
      removedCount += 1;
      continue;
    }

    const presentation = product.presentations.find(
      (entry) => entry.label === item.presentation
    );

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
