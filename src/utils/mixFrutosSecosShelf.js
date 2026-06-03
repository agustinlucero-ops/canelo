import { PRODUCT_TYPE_FLAVOR_LINE } from "./sanitizeCatalog";

export const MIX_FRUTOS_SECOS_CATEGORY = "Mix frutos secos";

export function flavorLineShowsPresentationsOnCard(line) {
  return (
    line?.category === MIX_FRUTOS_SECOS_CATEGORY &&
    line?.productType === PRODUCT_TYPE_FLAVOR_LINE
  );
}
