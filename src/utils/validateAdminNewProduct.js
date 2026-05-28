import {
  isKetoFilterCategory,
  isVeganFilterCategory,
} from "./productCategories.js";
import { productHasFlavorVariants, sanitizePresentations } from "./sanitizeCatalog.js";

function normalizePriceValue(value) {
  const normalized = Number(String(value ?? "").replace(",", "."));
  return Number.isNaN(normalized) ? NaN : normalized;
}

export function validateAdminNewProduct({
  name,
  category,
  categoryExists,
  presentations,
  productType,
  variants,
}) {
  const normalizedName = String(name ?? "").trim();
  const normalizedCategory = String(category ?? "").trim();

  if (!normalizedName) {
    return "Completá el nombre del producto.";
  }

  if (!normalizedCategory) {
    return "Seleccioná una categoría para el producto.";
  }

  if (isVeganFilterCategory(normalizedCategory) || isKetoFilterCategory(normalizedCategory)) {
    return 'Elegí el tipo de producto, no "Veganos/Keto". Marcá los checks de producto si corresponde.';
  }

  if (!categoryExists) {
    return "La categoría no existe. Creala primero en el bloque de Categorías.";
  }

  const sanitizedPresentations = sanitizePresentations(
    (presentations ?? []).map((presentation) => ({
      label: String(presentation?.label ?? "").trim(),
      price: normalizePriceValue(presentation?.price),
    }))
  );

  if (!sanitizedPresentations.length) {
    return "Completá al menos una presentación y precio válido.";
  }

  if (productHasFlavorVariants(productType)) {
    const hasNamedVariant = (variants ?? []).some((variant) =>
      String(variant?.label ?? "").trim()
    );
    if (!hasNamedVariant) {
      return "Cargá al menos un sabor con nombre.";
    }
  }

  return null;
}
