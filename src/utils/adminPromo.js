function formatPresentationSummary(presentation) {
  const label = String(presentation?.label ?? "").trim();
  const price = Math.round(Number(presentation?.price));
  const discountPercent = Number(presentation?.discountPercent);
  const hasDiscount = Number.isInteger(discountPercent) && discountPercent >= 1 && discountPercent <= 99;
  const discountSuffix = hasDiscount ? ` (${discountPercent}% OFF)` : "";
  return `${label}: $${price}${discountSuffix}`;
}

export function formatAdminPresentationsSummary(presentations) {
  if (!Array.isArray(presentations)) return "";
  return presentations.map(formatPresentationSummary).join(" · ");
}

export function buildPromoPresentationUpdates(product, presentationLabel, discountPercent) {
  const normalizedLabel = String(presentationLabel ?? "").trim();

  return (product?.presentations ?? []).map((presentation) => {
    const label = String(presentation?.label ?? "").trim();
    const price = Math.round(Number(presentation?.price));
    const base = { label, price };

    if (label !== normalizedLabel) {
      return base;
    }

    if (discountPercent === null) {
      return { ...base, discountPercent: null };
    }

    return { ...base, discountPercent };
  });
}

export function validatePromoDiscountInput(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return { ok: false, message: "Ingresá un descuento entre 1 y 99." };
  }

  const discountPercent = Number(trimmed);
  if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 99) {
    return { ok: false, message: "El descuento debe ser un entero entre 1 y 99." };
  }

  return { ok: true, value: discountPercent };
}

export function shouldShowPromoPresentationSelector(presentations) {
  return Array.isArray(presentations) && presentations.length > 1;
}

export function getPromoDiscountDraftValue(presentation) {
  const discountPercent = Number(presentation?.discountPercent);
  if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 99) {
    return "";
  }
  return String(discountPercent);
}

export function resolvePromoPresentationLabel(presentations, selectedLabel) {
  const normalizedSelected = String(selectedLabel ?? "").trim();
  if (normalizedSelected) {
    return normalizedSelected;
  }

  const first = presentations?.[0];
  return String(first?.label ?? "").trim();
}
