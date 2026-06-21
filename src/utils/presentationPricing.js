function isValidDiscountPercent(value) {
  return Number.isInteger(value) && value >= 1 && value <= 99;
}

export function resolvePresentationPricing(presentation) {
  const listPrice = Math.round(Number(presentation?.price));
  const discountPercent = Number(presentation?.discountPercent);
  const hasDiscount = isValidDiscountPercent(discountPercent);
  const salePrice = hasDiscount
    ? Math.round(listPrice * (1 - discountPercent / 100))
    : listPrice;

  return {
    listPrice,
    salePrice,
    promoLabel: hasDiscount ? `${discountPercent}% OFF` : null,
    hasDiscount,
  };
}
