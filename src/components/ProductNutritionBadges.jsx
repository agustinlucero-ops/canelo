import { Vegan } from "lucide-react";

export default function ProductNutritionBadges({ isVegan, isKeto, isGlutenFree }) {
  if (!isVegan && !isKeto && !isGlutenFree) return null;

  return (
    <div className="product-badges" aria-label="Insignias del producto">
      {isVegan && (
        <span className="vegan-badge" aria-label="Producto vegano">
          <Vegan aria-hidden="true" />
        </span>
      )}
      {isKeto && (
        <span className="keto-badge" aria-label="Producto apto keto">
          <img src="/images/keto-badge.svg" alt="" aria-hidden="true" />
        </span>
      )}
      {isGlutenFree && (
        <span className="gluten-free-badge" aria-label="Producto sin TACC">
          <img src="/images/gluten-free.svg" alt="" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
