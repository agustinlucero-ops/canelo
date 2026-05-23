export function normalizeProductNameForMatch(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function indexLiveProductsByName(liveProducts) {
  const index = new Map();
  for (const product of liveProducts) {
    index.set(normalizeProductNameForMatch(product.name), product);
  }
  return index;
}

function collectNewCategories(parsedProducts, liveCategories) {
  const liveSet = new Set(
    (liveCategories ?? []).map((category) => normalizeProductNameForMatch(category))
  );
  const seen = new Set();
  const newCategories = [];

  for (const parsed of parsedProducts) {
    const category = String(parsed.category ?? "").trim();
    if (!category) continue;
    const key = normalizeProductNameForMatch(category);
    if (liveSet.has(key) || seen.has(key)) continue;
    seen.add(key);
    newCategories.push(category);
  }

  return newCategories;
}

export function extractProductsFromPdfText(text) {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const products = [];
  let currentCategory = "Sin tacc";

  for (const line of lines) {
    if (/^categor[ií]a\b/i.test(line)) {
      continue;
    }

    if (line.length <= 40 && line === line.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(line)) {
      currentCategory = line
        .replace(/^[^\wÁÉÍÓÚÑ]+/u, "")
        .replace(/[^\wÁÉÍÓÚÑ\s/-]+$/u, "")
        .trim();
      continue;
    }

    const priceMatch = line.match(/(.+?)\s+[\$]?\s*([\d.]{2,})\s*$/);
    if (!priceMatch) continue;

    const name = priceMatch[1].trim();
    const digits = String(priceMatch[2]).replace(/[^\d]/g, "");
    const price = digits ? Number(digits) : null;
    if (!name || !price || price <= 0) continue;

    products.push({
      name,
      category: currentCategory,
      presentations: [{ label: "1u", price }],
    });
  }

  return products;
}

export function buildImportPlan({
  parsedProducts,
  liveProducts,
  liveCategories = [],
  importMode,
  updateExisting,
}) {
  const liveByName = indexLiveProductsByName(liveProducts);
  const toCreate = [];
  const toUpdate = [];
  const skipped = [];
  const newCategories = collectNewCategories(parsedProducts, liveCategories);

  for (const parsed of parsedProducts) {
    const key = normalizeProductNameForMatch(parsed.name);
    const existing = liveByName.get(key);

    if (!existing) {
      toCreate.push({ ...parsed, action: "create" });
      continue;
    }

    if (importMode === "full_catalog" && updateExisting) {
      toUpdate.push({
        ...parsed,
        action: "update",
        existingId: existing.id,
      });
      continue;
    }

    skipped.push({
      name: parsed.name,
      category: parsed.category,
      reason: "producto existente en el catálogo en línea",
    });
  }

  return { toCreate, toUpdate, skipped, newCategories };
}

const REQUIRED_ROW_KEYS = ["categoria", "nombre", "precio"];

function normalizeRowKeys(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [String(key).trim().toLowerCase(), value])
  );
}

function parsePrice(value) {
  const price = Number(String(value ?? "").replace(",", "."));
  if (Number.isNaN(price) || price <= 0) return null;
  return Math.round(price);
}

export function parseStrictCatalogRows(rows) {
  if (!Array.isArray(rows) || !rows.length) {
    throw new Error("La plantilla debe incluir al menos una fila de producto.");
  }

  const grouped = new Map();

  for (const rawRow of rows) {
    const row = normalizeRowKeys(rawRow);
    const missing = REQUIRED_ROW_KEYS.filter((key) => row[key] === undefined || row[key] === "");
    if (missing.length) {
      throw new Error(
        `Plantilla inválida: faltan columnas obligatorias (${REQUIRED_ROW_KEYS.join(", ")}).`
      );
    }

    const category = String(row.categoria).trim();
    const name = String(row.nombre).trim();
    const price = parsePrice(row.precio);
    const label = String(row.presentacion ?? "1u").trim() || "1u";
    if (!category || !name || !price) continue;

    const key = `${normalizeProductNameForMatch(category)}::${normalizeProductNameForMatch(name)}`;
    const existing = grouped.get(key) ?? { name, category, presentations: [] };
    existing.presentations.push({ label, price });
    grouped.set(key, existing);
  }

  return [...grouped.values()].filter((product) => product.presentations.length);
}
