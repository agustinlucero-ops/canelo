import { formatPrice } from "../utils/whatsapp";
import { itemHasCartDiscount } from "../utils/cartItemPricing";
import ProductPromoBadge from "./ProductPromoBadge";

export default function CartItemPricing({ item }) {
  if (!itemHasCartDiscount(item)) {
    return <span>{formatPrice(item.unitPrice)} c/u</span>;
  }

  return (
    <div className="cart-item-pricing">
      <span className="product-price-promo cart-item-price-promo">
        <span className="product-price-list">{formatPrice(item.listPrice)}</span>{" "}
        <span className="product-price-sale">{formatPrice(item.unitPrice)} c/u</span>
      </span>
      <ProductPromoBadge promoLabel={`${item.discountPercent}% OFF`} />
    </div>
  );
}
