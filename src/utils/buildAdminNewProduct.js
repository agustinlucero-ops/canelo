import {
  PRODUCT_TYPE_FLAVORED,
  PRODUCT_TYPE_FLAVOR_LINE,
  PRODUCT_TYPE_SIMPLE,
  productHasFlavorVariants,
  sanitizeShelfNote,
  sanitizeVariants,
} from "./sanitizeCatalog";

function buildPlaceholderVariants(id) {
  return [
    {
      id: `${id}-sabor-1`,
      label: "Sabor 1",
      image: "",
      description: "",
      contents: [],
      isVegan: false,
      outOfStock: false,
    },
    {
      id: `${id}-sabor-2`,
      label: "Sabor 2",
      image: "",
      description: "",
      contents: [],
      isVegan: false,
      outOfStock: false,
    },
  ];
}

export function buildAdminNewProduct({
  id,
  name,
  category,
  image,
  isVegan,
  isKeto,
  isGlutenFree,
  outOfStock = false,
  presentations,
  productType = PRODUCT_TYPE_SIMPLE,
  shelfNote,
  variants,
}) {
  const normalizedType = productHasFlavorVariants(productType)
    ? productType === PRODUCT_TYPE_FLAVORED
      ? PRODUCT_TYPE_FLAVORED
      : PRODUCT_TYPE_FLAVOR_LINE
    : PRODUCT_TYPE_SIMPLE;
  const normalizedShelfNote = sanitizeShelfNote(shelfNote);
  const sanitizedVariants = sanitizeVariants(variants, {
    defaultImage: image,
    lineImage: image,
    productType: productHasFlavorVariants(normalizedType) ? normalizedType : null,
  });
  const resolvedVariants = productHasFlavorVariants(normalizedType)
    ? sanitizedVariants.length
      ? sanitizedVariants
      : buildPlaceholderVariants(id)
    : [];

  return {
    id,
    name,
    category,
    image,
    isVegan,
    isKeto,
    isGlutenFree,
    outOfStock,
    presentations,
    productType: normalizedType,
    variants: resolvedVariants,
    ...(normalizedType === PRODUCT_TYPE_SIMPLE && normalizedShelfNote
      ? { shelfNote: normalizedShelfNote }
      : {}),
  };
}
