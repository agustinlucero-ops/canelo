import { getSql } from "./db.mjs";
import { categoriesReferencedByProducts } from "../src/utils/categoriesReferencedByProducts.js";
import { normalizeCategoryLabel } from "../src/utils/catalogCategories.js";
import { isShelfCategory } from "../src/utils/productCategories.js";
import {
  validateShelfCategoryReorder,
  ValidationError,
} from "../src/utils/validateShelfCategoryReorder.js";
import { sanitizeShelfNote } from "../src/utils/sanitizeCatalog.js";

const DEFAULT_PRODUCT_IMAGE = "/images/products/almendra.svg";
const DEFAULT_CATEGORY = "Sin tacc";
const PRODUCT_TYPE_SIMPLE = "simple";
const PRODUCT_TYPE_FLAVOR_LINE = "flavor-line";
const PRODUCT_TYPE_FLAVORED = "flavored";

function productHasFlavorVariants(productType) {
  return productType === PRODUCT_TYPE_FLAVOR_LINE || productType === PRODUCT_TYPE_FLAVORED;
}
const RESERVED_CATEGORY_NAMES = new Set(["veganos", "vegano", "keto", "apto keto"]);

export class CatalogError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "CatalogError";
    this.code = code;
    this.details = details;
  }
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeBoolean(value) {
  return Boolean(value);
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePresentations(presentations) {
  if (!Array.isArray(presentations)) return [];
  return presentations
    .map((presentation) => {
      const label = normalizeText(presentation?.label);
      const price = Number(String(presentation?.price ?? "").replace(",", "."));
      if (!label || Number.isNaN(price) || price <= 0) return null;
      return { label, price: Math.round(price) };
    })
    .filter(Boolean);
}

function normalizeProductType(value) {
  const normalized = normalizeText(value) || PRODUCT_TYPE_SIMPLE;
  if (normalized === PRODUCT_TYPE_FLAVOR_LINE) return PRODUCT_TYPE_FLAVOR_LINE;
  if (normalized === PRODUCT_TYPE_FLAVORED) return PRODUCT_TYPE_FLAVORED;
  return PRODUCT_TYPE_SIMPLE;
}

function normalizeVariants(variants) {
  if (!Array.isArray(variants)) return [];

  return variants
    .map((variant, index) => {
      const id = normalizeText(variant?.id) || `sabor-${index + 1}`;
      const label = normalizeText(variant?.label);
      const image = normalizeText(variant?.image) || DEFAULT_PRODUCT_IMAGE;
      const description = normalizeText(variant?.description);
      const contents = Array.isArray(variant?.contents)
        ? variant.contents.map((entry) => normalizeText(entry)).filter(Boolean)
        : [];
      if (!label) return null;

      return {
        id,
        label,
        image,
        description,
        contents,
        isVegan: normalizeBoolean(variant?.isVegan),
        outOfStock: normalizeBoolean(variant?.outOfStock),
      };
    })
    .filter(Boolean);
}

async function findCategoryByName(sql, categoryName) {
  const normalizedCategoryName = normalizeText(categoryName);
  if (!normalizedCategoryName) return null;
  const rows = await sql`
    SELECT name, sort_order
    FROM categories
    WHERE lower(name) = lower(${normalizedCategoryName})
    LIMIT 1
  `;
  return rows[0] ?? null;
}

async function requireCategory(sql, categoryName) {
  const category = await findCategoryByName(sql, categoryName);
  if (!category) {
    throw new CatalogError("category_not_found", "La categoría indicada no existe.");
  }
  if (RESERVED_CATEGORY_NAMES.has(normalizeText(categoryName).toLowerCase())) {
    throw new CatalogError("reserved_category", "No se puede usar una categoría reservada.");
  }
  return category;
}

function mapProductRow(row) {
  const productType = row.product_type ?? PRODUCT_TYPE_SIMPLE;
  const shelfNote = sanitizeShelfNote(row.shelf_note);
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    image: row.image,
    productType,
    presentations: row.presentations,
    variants: Array.isArray(row.variants) ? row.variants : [],
    isVegan: row.is_vegan,
    isKeto: row.is_keto,
    isGlutenFree: row.is_gluten_free,
    outOfStock: row.out_of_stock,
    ...(productType === PRODUCT_TYPE_SIMPLE && shelfNote ? { shelfNote } : {}),
  };
}

export async function syncCategoriesFromProducts() {
  const sql = getSql();
  const productRows = await sql`
    SELECT DISTINCT category
    FROM products
    WHERE category IS NOT NULL AND trim(category) <> ''
  `;

  const existingRows = await sql`SELECT name FROM categories`;
  const missing = categoriesReferencedByProducts(
    productRows.map((row) => ({ category: row.category })),
    existingRows.map((row) => row.name)
  );

  if (!missing.length) {
    return { created: [] };
  }

  const maxRows = await sql`SELECT COALESCE(MAX(sort_order), -1) AS max_sort_order FROM categories`;
  let nextSortOrder = Number(maxRows?.[0]?.max_sort_order ?? -1) + 1;
  const created = [];

  for (const name of missing) {
    const normalizedName = normalizeText(name);
    await sql`
      INSERT INTO categories (name, sort_order)
      VALUES (${normalizedName}, ${nextSortOrder})
      ON CONFLICT (name) DO NOTHING
    `;
    created.push(normalizedName);
    nextSortOrder += 1;
  }

  return { created };
}

export async function listCategories() {
  await syncCategoriesFromProducts();
  const sql = getSql();
  const rows = await sql`
    SELECT name, sort_order
    FROM categories
    ORDER BY sort_order ASC, name ASC
  `;
  return rows.map((row) => ({
    name: row.name,
    sortOrder: row.sort_order,
  }));
}

export async function listProducts({ category } = {}) {
  const sql = getSql();
  const normalizedCategory = category?.trim();

  const rows = normalizedCategory
    ? await sql`
        SELECT id, name, category, image, product_type, variants, is_vegan, is_keto, is_gluten_free, out_of_stock, presentations, shelf_note
        FROM products
        WHERE lower(category) = lower(${normalizedCategory})
        ORDER BY name ASC
      `
    : await sql`
        SELECT id, name, category, image, product_type, variants, is_vegan, is_keto, is_gluten_free, out_of_stock, presentations, shelf_note
        FROM products
        ORDER BY category ASC, name ASC
      `;

  return rows.map(mapProductRow);
}

export async function getProductById(id) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, name, category, image, product_type, variants, is_vegan, is_keto, is_gluten_free, out_of_stock, presentations, shelf_note
    FROM products
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ? mapProductRow(rows[0]) : null;
}

export async function createCategory({ name }) {
  const sql = getSql();
  const normalizedName = normalizeText(name);
  if (!normalizedName) {
    throw new CatalogError("invalid_category_name", "El nombre de categoría es obligatorio.");
  }

  const existing = await findCategoryByName(sql, normalizedName);
  if (existing) {
    throw new CatalogError("category_conflict", "La categoría ya existe.");
  }

  const maxRows = await sql`SELECT COALESCE(MAX(sort_order), -1) AS max_sort_order FROM categories`;
  const sortOrder = Number(maxRows?.[0]?.max_sort_order ?? -1) + 1;

  const rows = await sql`
    INSERT INTO categories (name, sort_order)
    VALUES (${normalizedName}, ${sortOrder})
    RETURNING name, sort_order
  `;
  return {
    name: rows[0].name,
    sortOrder: rows[0].sort_order,
  };
}

export async function renameCategory({ currentName, nextName }) {
  const sql = getSql();
  const normalizedCurrentName = normalizeText(currentName);
  const normalizedNextName = normalizeText(nextName);

  if (!normalizedCurrentName || !normalizedNextName) {
    throw new CatalogError("invalid_category_name", "Los nombres de categoría son obligatorios.");
  }

  const current = await findCategoryByName(sql, normalizedCurrentName);
  if (!current) {
    throw new CatalogError("category_not_found", "La categoría que querés editar no existe.");
  }

  const currentLower = current.name.toLowerCase();
  const nextLower = normalizedNextName.toLowerCase();
  if (currentLower !== nextLower) {
    const existing = await findCategoryByName(sql, normalizedNextName);
    if (existing) {
      throw new CatalogError("category_conflict", "Ya existe una categoría con ese nombre.");
    }
  }

  const rows = await sql`
    UPDATE categories
    SET name = ${normalizedNextName}
    WHERE name = ${current.name}
    RETURNING name, sort_order
  `;
  return {
    name: rows[0].name,
    sortOrder: rows[0].sort_order,
  };
}

function categoryNameKey(value) {
  return normalizeText(value).toLowerCase();
}

export async function reorderShelfCategories({ order }) {
  const sql = getSql();
  const categories = await listCategories();
  const shelfNames = categories.filter((row) => isShelfCategory(row.name)).map((row) => row.name);

  try {
    validateShelfCategoryReorder(order, shelfNames);
  } catch (err) {
    if (err instanceof ValidationError) {
      throw new CatalogError("invalid_category_order", err.message);
    }
    throw err;
  }

  const nameByKey = new Map(categories.map((row) => [categoryNameKey(row.name), row.name]));

  for (let index = 0; index < order.length; index += 1) {
    const label = normalizeCategoryLabel(String(order[index] ?? "").trim());
    const dbName = nameByKey.get(categoryNameKey(label));
    if (!dbName) {
      throw new CatalogError("invalid_category_order", `La categoría "${label}" no existe.`);
    }
    await sql`
      UPDATE categories
      SET sort_order = ${index}
      WHERE name = ${dbName}
    `;
  }

  return listCategories();
}

export async function deleteCategory({ name }) {
  const sql = getSql();
  const normalizedName = normalizeText(name);
  if (!normalizedName) {
    throw new CatalogError("invalid_category_name", "El nombre de categoría es obligatorio.");
  }

  const category = await findCategoryByName(sql, normalizedName);
  if (!category) {
    throw new CatalogError("category_not_found", "La categoría que querés eliminar no existe.");
  }

  if (category.name.toLowerCase() === DEFAULT_CATEGORY.toLowerCase()) {
    throw new CatalogError("default_category_protected", "No se puede eliminar la categoría base.");
  }

  const maxRows = await sql`SELECT COALESCE(MAX(sort_order), -1) AS max_sort_order FROM categories`;
  const fallbackSortOrder = Number(maxRows?.[0]?.max_sort_order ?? -1) + 1;

  await sql`
    INSERT INTO categories (name, sort_order)
    VALUES (${DEFAULT_CATEGORY}, ${fallbackSortOrder})
    ON CONFLICT (name) DO NOTHING
  `;

  const reassignedRows = await sql`
    UPDATE products
    SET category = ${DEFAULT_CATEGORY}, updated_at = now()
    WHERE category = ${category.name}
    RETURNING id
  `;

  await sql`
    DELETE FROM categories
    WHERE name = ${category.name}
  `;

  return {
    deletedCategory: category.name,
    reassignedTo: DEFAULT_CATEGORY,
    reassignedProducts: reassignedRows.length,
  };
}

async function buildProductPayload(sql, input, { baseProduct } = {}) {
  const isCreate = !baseProduct;
  const normalizedName = input?.name !== undefined ? normalizeText(input.name) : baseProduct?.name ?? "";
  const normalizedImage =
    input?.image !== undefined
      ? normalizeText(input.image) || DEFAULT_PRODUCT_IMAGE
      : baseProduct?.image ?? DEFAULT_PRODUCT_IMAGE;
  const normalizedOutOfStock =
    input?.outOfStock !== undefined
      ? normalizeBoolean(input.outOfStock)
      : normalizeBoolean(baseProduct?.outOfStock);
  const normalizedIsVegan =
    input?.isVegan !== undefined ? normalizeBoolean(input.isVegan) : normalizeBoolean(baseProduct?.isVegan);
  const normalizedIsKeto =
    input?.isKeto !== undefined ? normalizeBoolean(input.isKeto) : normalizeBoolean(baseProduct?.isKeto);
  const normalizedIsGlutenFree =
    input?.isGlutenFree !== undefined
      ? normalizeBoolean(input.isGlutenFree)
      : normalizeBoolean(baseProduct?.isGlutenFree);

  let categoryName = baseProduct?.category ?? "";
  if (input?.category !== undefined) {
    const normalizedCategory = normalizeText(input.category);
    if (RESERVED_CATEGORY_NAMES.has(normalizedCategory.toLowerCase())) {
      throw new CatalogError("reserved_category", "No se puede usar una categoría reservada.");
    }
    const category = await requireCategory(sql, normalizedCategory);
    categoryName = category.name;
  } else if (isCreate) {
    throw new CatalogError("invalid_product_category", "La categoría es obligatoria.");
  }

  const normalizedPresentations =
    input?.presentations !== undefined
      ? normalizePresentations(input.presentations)
      : baseProduct?.presentations ?? [];
  const normalizedProductType =
    input?.productType !== undefined
      ? normalizeProductType(input.productType)
      : normalizeProductType(baseProduct?.productType);
  const normalizedVariants =
    input?.variants !== undefined
      ? normalizeVariants(input.variants)
      : normalizeVariants(baseProduct?.variants);

  if (!normalizedName) {
    throw new CatalogError("invalid_product_name", "El nombre del producto es obligatorio.");
  }
  if (!categoryName) {
    throw new CatalogError("invalid_product_category", "La categoría es obligatoria.");
  }
  if (!normalizedPresentations.length) {
    throw new CatalogError("invalid_presentations", "Debe haber al menos una presentación válida.");
  }
  if (productHasFlavorVariants(normalizedProductType) && !normalizedVariants.length) {
    throw new CatalogError("invalid_variants", "Debe haber al menos un sabor válido.");
  }

  const shelfNote =
    normalizedProductType === PRODUCT_TYPE_SIMPLE
      ? input?.shelfNote !== undefined
        ? sanitizeShelfNote(input.shelfNote)
        : sanitizeShelfNote(baseProduct?.shelfNote)
      : "";

  return {
    name: normalizedName,
    category: categoryName,
    image: normalizedImage,
    productType: normalizedProductType,
    isVegan: normalizedIsVegan,
    isKeto: normalizedIsKeto,
    isGlutenFree: normalizedIsGlutenFree,
    outOfStock: normalizedOutOfStock,
    presentations: normalizedPresentations,
    variants: productHasFlavorVariants(normalizedProductType) ? normalizedVariants : [],
    shelfNote,
  };
}

export async function createProduct(input) {
  const sql = getSql();
  const payload = await buildProductPayload(sql, input);

  let normalizedId = normalizeText(input?.id);
  if (!normalizedId) {
    const baseId = slugify(payload.name) || "producto";
    normalizedId = baseId;
    let suffix = 2;
    // Evita conflictos de IDs auto-generados en altas repetidas.
    while (await getProductById(normalizedId)) {
      normalizedId = `${baseId}-${suffix}`;
      suffix += 1;
    }
  }

  const existing = await getProductById(normalizedId);
  if (existing) {
    throw new CatalogError("product_conflict", "Ya existe un producto con ese ID.");
  }

  const presentationsJson = JSON.stringify(payload.presentations);
  const variantsJson = JSON.stringify(payload.variants);
  const rows = await sql`
    INSERT INTO products (
      id,
      name,
      category,
      image,
      product_type,
      variants,
      is_vegan,
      is_keto,
      is_gluten_free,
      out_of_stock,
      presentations,
      shelf_note
    )
    VALUES (
      ${normalizedId},
      ${payload.name},
      ${payload.category},
      ${payload.image},
      ${payload.productType},
      ${variantsJson}::jsonb,
      ${payload.isVegan},
      ${payload.isKeto},
      ${payload.isGlutenFree},
      ${payload.outOfStock},
      ${presentationsJson}::jsonb,
      ${payload.shelfNote ?? ""}
    )
    RETURNING id, name, category, image, product_type, variants, is_vegan, is_keto, is_gluten_free, out_of_stock, presentations, shelf_note
  `;
  return mapProductRow(rows[0]);
}

export async function updateProduct(id, input) {
  const sql = getSql();
  const current = await getProductById(id);
  if (!current) {
    throw new CatalogError("product_not_found", "El producto no existe.");
  }

  const payload = await buildProductPayload(sql, input, { baseProduct: current });
  const presentationsJson = JSON.stringify(payload.presentations);
  const variantsJson = JSON.stringify(payload.variants);

  const rows = await sql`
    UPDATE products
    SET
      name = ${payload.name},
      category = ${payload.category},
      image = ${payload.image},
      product_type = ${payload.productType},
      variants = ${variantsJson}::jsonb,
      is_vegan = ${payload.isVegan},
      is_keto = ${payload.isKeto},
      is_gluten_free = ${payload.isGlutenFree},
      out_of_stock = ${payload.outOfStock},
      presentations = ${presentationsJson}::jsonb,
      shelf_note = ${payload.shelfNote ?? ""},
      updated_at = now()
    WHERE id = ${id}
    RETURNING id, name, category, image, product_type, variants, is_vegan, is_keto, is_gluten_free, out_of_stock, presentations, shelf_note
  `;
  return mapProductRow(rows[0]);
}

export async function deleteProduct(id) {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM products
    WHERE id = ${id}
    RETURNING id
  `;
  if (!rows.length) {
    throw new CatalogError("product_not_found", "El producto no existe.");
  }
  return { id: rows[0].id };
}
