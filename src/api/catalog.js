export async function fetchCatalogFromApi() {
  const [categoriesResponse, productsResponse] = await Promise.all([
    fetch("/api/categories"),
    fetch("/api/products"),
  ]);

  if (!categoriesResponse.ok || !productsResponse.ok) {
    throw new Error("catalog_fetch_failed");
  }

  const { categories: categoryRows } = await categoriesResponse.json();
  const { products } = await productsResponse.json();

  const categories = (categoryRows ?? [])
    .map((row) => {
      const name = String(row?.name ?? "").trim();
      if (!name) return null;
      return {
        name,
        sortOrder: Number(row?.sortOrder ?? row?.sort_order ?? 0),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es"));

  return { categories, products: products ?? [] };
}
