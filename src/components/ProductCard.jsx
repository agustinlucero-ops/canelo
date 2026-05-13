import { useEffect, useMemo, useState } from "react";
import QuantitySelector from "./QuantitySelector";
import { formatPrice } from "../utils/whatsapp";

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

  const handleAdd = () => {
    if (product.outOfStock) return;
    onAddToCart(product, currentPresentation);
  };

  return (
    <article className="product-card">
      <img
        src={product.image}
        alt={product.name}
        className="product-image"
        loading="lazy"
      />
      <div className="product-content">
        <span className="product-category">{product.category}</span>
        {product.outOfStock && <span className="stock-badge">Sin stock</span>}
        <h3>{product.name}</h3>
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
