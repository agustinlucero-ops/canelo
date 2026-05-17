const normalizeKey = (value) => String(value ?? "").trim().toLowerCase();

export function normalizeCategoryLabel(value) {
  const normalizedValue = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
  return normalizedValue.toLowerCase() === "ceriales" ? "Cereales" : normalizedValue;
}

export function mergeOrderedCategories(apiCategoryRows, products, fallbackOrder = []) {
  const ordered = [];
  const seen = new Set();

  const pushCategory = (name) => {
    const label = normalizeCategoryLabel(name);
    if (!label) return;
    const key = normalizeKey(label);
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(label);
  };

  for (const row of apiCategoryRows ?? []) {
    pushCategory(row?.name ?? row);
  }

  if (!apiCategoryRows?.length && fallbackOrder.length) {
    for (const name of fallbackOrder) {
      pushCategory(name);
    }
  }

  const orphanCategories = [
    ...new Set(
      (products ?? [])
        .map((product) => normalizeCategoryLabel(product?.category))
        .filter(Boolean)
    ),
  ]
    .filter((category) => !seen.has(normalizeKey(category)))
    .sort((a, b) => a.localeCompare(b, "es"));

  for (const category of orphanCategories) {
    pushCategory(category);
  }

  return ordered;
}

export function clearCatalogLocalStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("canelo.products");
  window.localStorage.removeItem("canelo.categories");
}
