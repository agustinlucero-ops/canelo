import { Vegan } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import QuantitySelector from "./QuantitySelector";
import { formatPrice } from "../utils/whatsapp";
import ProductTitleBlock from "./ProductTitleBlock";
import { normalizeProductName } from "../utils/productName";

export default function ProductCard({ product, onAddToCart, preview = false }) {
  const [selectedPresentation, setSelectedPresentation] = useState(
    product.presentations[0].label
  );

  useEffect(() => {
    setSelectedPresentation(product.presentations[0].label);
  }, [product.id, product.presentations]);

  const currentPresentation = useMemo(
    () =>
      product.presentations.find(
        (presentation) => presentation.label === selectedPresentation
      ) ?? product.presentations[0],
    [product.presentations, selectedPresentation]
  );

  const displayName = useMemo(
    () => normalizeProductName(product.name, product.category),
    [product.category, product.name]
  );
  const hasNutritionBadges = product.isVegan || product.isKeto || product.isGlutenFree;

  const handleAdd = () => {
    if (product.outOfStock) return;
    onAddToCart(product, currentPresentation);
  };

  return (
    <article className="product-card">
      <div className="product-media">
        <img
          src={product.image}
          alt={displayName}
          className="product-image"
          loading="lazy"
        />
        {hasNutritionBadges && (
          <div className="product-floating-badges" aria-label="Insignias del producto">
            {product.isVegan && (
              <span className="vegan-badge" aria-label="Producto vegano">
                <Vegan aria-hidden="true" />
              </span>
            )}
            {product.isKeto && (
              <span className="keto-badge" aria-label="Producto apto keto">
                <img src="/images/keto-badge.svg" alt="" aria-hidden="true" />
              </span>
            )}
            {product.isGlutenFree && (
              <span className="gluten-free-badge" aria-label="Producto sin TACC">
                <img src="/images/gluten-free.svg" alt="" aria-hidden="true" />
              </span>
            )}
          </div>
        )}
      </div>
      <div className="product-content">
        <ProductTitleBlock
          name={product.name}
          category={product.category}
          shelfNote={product.shelfNote}
        />
        <p className="product-price">{formatPrice(currentPresentation.price)}</p>

        <QuantitySelector
          idPrefix={product.id}
          presentations={product.presentations}
          value={selectedPresentation}
          onChange={setSelectedPresentation}
        />

        {preview ? (
          <p className="product-preview-note">Vista previa del catálogo</p>
        ) : (
          <button
            className={`button primary ${product.outOfStock ? "disabled" : ""}`.trim()}
            onClick={handleAdd}
            disabled={product.outOfStock}
          >
            {product.outOfStock ? "Sin stock" : "Agregar al carrito"}
          </button>
        )}
      </div>
    </article>
  );
}
