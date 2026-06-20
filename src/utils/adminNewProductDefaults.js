export function createDefaultNewProductPresentations() {
  return [{ label: "1kg", price: "" }];
}

export function createDefaultNewProductVariant(productId, _image, index = 1) {
  return {
    id: `${productId}-sabor-${index}`,
    label: "",
    image: "",
    description: "",
    contentsText: "",
    isVegan: false,
    outOfStock: false,
  };
}

export function createDefaultNewProductVariants(productId, image, count = 2) {
  return Array.from({ length: count }, (_, index) =>
    createDefaultNewProductVariant(productId, image, index + 1)
  );
}
