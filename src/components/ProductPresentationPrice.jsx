import { formatPrice } from "../utils/whatsapp";
import { resolvePresentationPricing } from "../utils/presentationPricing";

export default function ProductPresentationPrice({ presentation, className = "product-price" }) {
  const pricing = resolvePresentationPricing(presentation);

  if (!pricing.hasDiscount) {
    return <p className={className}>{formatPrice(pricing.salePrice)}</p>;
  }

  return (
    <p className={`${className} product-price-promo`.trim()}>
      <span className="product-price-list">{formatPrice(pricing.listPrice)}</span>{" "}
      <span className="product-price-sale">{formatPrice(pricing.salePrice)}</span>
    </p>
  );
}
