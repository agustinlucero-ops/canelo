import { PRODUCT_TYPE_FLAVOR_LINE } from "./sanitizeCatalog";

export const MIX_FRUTOS_SECOS_CATEGORY = "Mix frutos secos";
export const MIX_CERVECERO_LINE_ID = "mix-cervecero";

function normalizeLineLookupKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isMixCerveceroLine(line) {
  if (!line) return false;
  if (line.id === MIX_CERVECERO_LINE_ID) return true;
  return normalizeLineLookupKey(line.name) === MIX_CERVECERO_LINE_ID;
}

export function flavorLineShowsPresentationsOnCard(line) {
  if (line?.productType !== PRODUCT_TYPE_FLAVOR_LINE) return false;

  return line.category === MIX_FRUTOS_SECOS_CATEGORY || isMixCerveceroLine(line);
}
