export function groupDraftItemsByCategory(items) {
  const groups = new Map();

  for (const item of items ?? []) {
    const category = String(item?.payload?.category ?? "Sin categoría").trim() || "Sin categoría";
    const bucket = groups.get(category) ?? [];
    bucket.push(item);
    groups.set(category, bucket);
  }

  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right, "es"));
}
