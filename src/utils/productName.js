export function normalizeProductName(name, category) {
  let normalizedName = String(name ?? "").trim();
  if (category === "Granolas") {
    normalizedName = normalizedName.replace(/^Granola\s+/i, "");
  }
  return normalizedName;
}
