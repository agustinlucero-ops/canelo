import { isStoreFilterCategory } from "./productCategories.js";
import { normalizeCategoryLabel } from "./catalogCategories.js";

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

const normalizeKey = (value) => String(value ?? "").trim().toLowerCase();

/**
 * Valida que `order` sea una permutación exacta de las categorías de estante en la DB.
 */
export function validateShelfCategoryReorder(order, shelfCategoryNames) {
  if (!Array.isArray(order) || order.length === 0) {
    throw new ValidationError("El orden de categorías es obligatorio.");
  }

  const expected = new Set(
    (shelfCategoryNames ?? []).map((name) => normalizeKey(normalizeCategoryLabel(name)))
  );

  if (expected.size === 0) {
    throw new ValidationError("No hay categorías de estante para reordenar.");
  }

  const received = new Set();

  for (const rawName of order) {
    const name = normalizeCategoryLabel(String(rawName ?? "").trim());
    if (!name) {
      throw new ValidationError("El orden incluye nombres vacíos.");
    }
    if (isStoreFilterCategory(name)) {
      throw new ValidationError("No se pueden reordenar los filtros de tienda.");
    }
    const key = normalizeKey(name);
    if (!expected.has(key)) {
      throw new ValidationError(`La categoría "${name}" no es un estante válido.`);
    }
    if (received.has(key)) {
      throw new ValidationError(`La categoría "${name}" está duplicada.`);
    }
    received.add(key);
  }

  if (received.size !== expected.size) {
    throw new ValidationError("El orden debe incluir todas las categorías de estante.");
  }
}
