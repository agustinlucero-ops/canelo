import { resolvePresentationPricing } from "./presentationPricing";

export function buildCartPresentationFields(presentation) {
  const pricing = resolvePresentationPricing(presentation);
  const fields = {
    unitPrice: pricing.salePrice,
    listPrice: pricing.listPrice,
  };

  if (pricing.hasDiscount) {
    fields.discountPercent = Number(presentation.discountPercent);
  }

  return fields;
}

export function itemHasCartDiscount(item) {
  const discountPercent = Number(item?.discountPercent);
  return Number.isInteger(discountPercent) && discountPercent >= 1 && discountPercent <= 99;
}
