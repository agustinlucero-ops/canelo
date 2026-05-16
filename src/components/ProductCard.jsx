import { Vegan } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import QuantitySelector from "./QuantitySelector";
import { formatPrice } from "../utils/whatsapp";
import { normalizeProductName } from "../utils/productName";

export default function ProductCard({ product, onAddToCart }) {
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
      <img
        src={product.image}
        alt={displayName}
        className="product-image"
        loading="lazy"
      />
      <div className="product-content">
        {(product.isVegan || product.outOfStock) && (
          <div className="product-badges">
            {product.isVegan && (
              <span className="vegan-badge" aria-label="Producto vegano">
                <Vegan aria-hidden="true" />
              </span>
            )}
            {product.outOfStock && <span className="stock-badge">Sin stock</span>}
          </div>
        )}
        <h3>{displayName}</h3>
        <p className="product-price">{formatPrice(currentPresentation.price)}</p>

        <QuantitySelector
          idPrefix={product.id}
          presentations={product.presentations}
          value={selectedPresentation}
          onChange={setSelectedPresentation}
        />

        <button
          className={`button primary ${product.outOfStock ? "disabled" : ""}`.trim()}
          onClick={handleAdd}
          disabled={product.outOfStock}
        >
          {product.outOfStock ? "No disponible" : "Agregar al carrito"}
        </button>
      </div>
    </article>
  );
}
