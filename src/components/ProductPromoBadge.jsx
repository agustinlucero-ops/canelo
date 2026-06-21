export default function ProductPromoBadge({ promoLabel }) {
  if (!promoLabel) return null;

  const discountPercent = Number.parseInt(promoLabel, 10);
  const ariaLabel = Number.isNaN(discountPercent)
    ? "Promoción activa"
    : `Promoción: ${discountPercent}% de descuento`;

  return (
    <span className="product-promo-badge" aria-label={ariaLabel}>
      {promoLabel}
    </span>
  );
}
