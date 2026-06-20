import { useEffect, useMemo, useState } from "react";
import QuantitySelector from "./QuantitySelector";
import ProductNutritionBadges from "./ProductNutritionBadges";
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
      </div>
      <div className="product-content">
        <ProductTitleBlock
          name={product.name}
          category={product.category}
          shelfNote={product.shelfNote}
        />
        <ProductNutritionBadges
          isVegan={product.isVegan}
          isKeto={product.isKeto}
          isGlutenFree={product.isGlutenFree}
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
