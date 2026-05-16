import { normalizeProductName } from "../../src/utils/productName.js";
import { resolveProductCategoryAndVegan } from "../../src/utils/productCategories.js";

export const DEFAULT_CATEGORIES = [
  "Sin tacc",
  "Granolas",
  "Apto keto",
  "Cereales",
  "Condimentos",
  "Congelados",
  "Aceites",
  "Pastas de mani",
  "Frutos secos",
  "Veganos",
  "Harinas y legumbres",
];

export const DEFAULT_PRODUCT_IMAGE = "/images/products/almendra.svg";

const normalizeCategoryName = (value) => value.trim().replace(/\s+/g, " ");

export const normalizeCategoryLabel = (value) => {
  const normalizedValue = normalizeCategoryName(value || "");
  return normalizedValue.toLowerCase() === "ceriales" ? "Cereales" : normalizedValue;
};

const sanitizePresentations = (presentations) => {
  if (!Array.isArray(presentations)) return [];

  return presentations
    .map((presentation) => {
      const label = String(presentation?.label ?? "").trim();
      const price = Number(presentation?.price);
      if (!label || Number.isNaN(price) || price <= 0) return null;
      return {
        label,
        price: Math.round(price),
      };
    })
    .filter(Boolean);
};

export function sanitizeProducts(productList) {
  if (!Array.isArray(productList)) return { products: [], skipped: [] };

  const skipped = [];

  const products = productList
    .map((product, index) => {
      const id = String(product?.id ?? "").trim() || `producto-${index + 1}`;
      const normalizedCategory =
        normalizeCategoryLabel(String(product?.category ?? "").trim()) || "Sin tacc";
      const { category, isVegan } = resolveProductCategoryAndVegan(product, normalizedCategory);
      const name = normalizeProductName(String(product?.name ?? "").trim(), category);
      const image = String(product?.image ?? "").trim() || DEFAULT_PRODUCT_IMAGE;
      const presentations = sanitizePresentations(product?.presentations);

      if (!name || !presentations.length) {
        skipped.push({ id, reason: "nombre o presentaciones inválidas" });
        return null;
      }

      return {
        id,
        name,
        category,
        image,
        presentations,
        isVegan,
        outOfStock: Boolean(product?.outOfStock),
      };
    })
    .filter(Boolean);

  return { products, skipped };
}

export function collectCategoryNames(products) {
  const fromProducts = products.map((product) => product.category).filter(Boolean);
  return [...new Set([...DEFAULT_CATEGORIES, ...fromProducts])];
}
