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
    .map((row) => String(row?.name ?? "").trim())
    .filter(Boolean);

  return { categories, products: products ?? [] };
}
