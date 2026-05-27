import { normalizeProductName } from "../../src/utils/productName.js";
import {
  DEFAULT_PRODUCT_IMAGE,
  sanitizePresentations,
  sanitizeProducts as sanitizeProductsCore,
  sanitizeVariants,
} from "../../src/utils/sanitizeCatalog.js";

export {
  DEFAULT_PRODUCT_IMAGE,
  PRODUCT_TYPE_FLAVOR_LINE,
  PRODUCT_TYPE_SIMPLE,
} from "../../src/utils/sanitizeCatalog.js";

export { sanitizePresentations, sanitizeVariants };

export function sanitizeProducts(productList) {
  const products = sanitizeProductsCore(productList);
  return { products, skipped: [] };
}

export const DEFAULT_CATEGORIES = [
  "Sin tacc",
  "Granolas",
  "Keto",
  "Frutos secos",
  "Semillas",
  "Avenas/Arroz/Harinas",
  "Cereales",
  "Pastas de mani",
  "Maní suelto",
  "Miel/Polen",
  "Ghee",
  "Barritas",
  "Combos",
  "Varios",
  "Aceite de coco",
  "Veganos",
  "Congelados",
];

const normalizeCategoryName = (value) => value.trim().replace(/\s+/g, " ");

export const normalizeCategoryLabel = (value) => {
  const normalizedValue = normalizeCategoryName(value || "");
  return normalizedValue.toLowerCase() === "ceriales" ? "Cereales" : normalizedValue;
};

export function collectCategoryNames(products) {
  const fromProducts = products.map((product) => product.category).filter(Boolean);
  return [...new Set([...DEFAULT_CATEGORIES, ...fromProducts])];
}

export { normalizeProductName };
