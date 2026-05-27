import { Vegan } from "lucide-react";
import { formatPrice } from "../utils/whatsapp";
import { normalizeProductName } from "../utils/productName";

export default function GranolaLineCard({ line, onOpenFlavorPicker, preview = false }) {
  const displayName = normalizeProductName(line.name, line.category);
  const primaryPresentation = line.presentations[0];
  const hasVeganVariant = line.variants?.some((variant) => variant.isVegan);

  return (
    <article className="product-card granola-line-card">
      <div className="product-media">
        <img src={line.image} alt={displayName} className="product-image" loading="lazy" />
        {hasVeganVariant && (
          <div className="product-floating-badges" aria-label="Insignias del producto">
            <span className="vegan-badge" aria-label="Incluye opción vegana">
              <Vegan aria-hidden="true" />
            </span>
          </div>
        )}
        {line.outOfStock && <span className="stock-badge product-stock-badge">Sin stock</span>}
      </div>
      <div className="product-content">
        <h3>{displayName}</h3>
        {primaryPresentation && (
          <p className="product-price">{formatPrice(primaryPresentation.price)}</p>
        )}

        {preview ? (
          <p className="product-preview-note">Vista previa del catálogo</p>
        ) : (
          <button
            type="button"
            className={`button primary ${line.outOfStock ? "disabled" : ""}`.trim()}
            onClick={() => onOpenFlavorPicker(line)}
            disabled={line.outOfStock}
          >
            Sabores y contenidos
          </button>
        )}
      </div>
    </article>
  );
}
