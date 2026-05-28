import { Vegan } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import QuantitySelector from "./QuantitySelector";
import { formatPrice } from "../utils/whatsapp";
import { normalizeProductName } from "../utils/productName";
import { getFirstAvailableVariant } from "../utils/flavorLineCart";

export default function FlavorLineCard({ line, onAddToCart, preview = false }) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    () => getFirstAvailableVariant(line?.variants)?.id ?? ""
  );
  const [selectedPresentation, setSelectedPresentation] = useState(
    () => line?.presentations?.[0]?.label ?? ""
  );

  useEffect(() => {
    const firstVariant = getFirstAvailableVariant(line?.variants);
    setSelectedVariantId(firstVariant?.id ?? "");
    setSelectedPresentation(line?.presentations?.[0]?.label ?? "");
  }, [line?.id, line?.variants, line?.presentations]);

  const selectedVariant = useMemo(
    () => line?.variants?.find((variant) => variant.id === selectedVariantId) ?? null,
    [line?.variants, selectedVariantId]
  );

  const currentPresentation = useMemo(
    () =>
      line?.presentations?.find((presentation) => presentation.label === selectedPresentation) ??
      line?.presentations?.[0] ??
      null,
    [line?.presentations, selectedPresentation]
  );

  const displayName = normalizeProductName(line.name, line.category);
  const hasVeganVariant = line.variants?.some((variant) => variant.isVegan);
  const canAdd =
    !preview &&
    selectedVariant &&
    !selectedVariant.outOfStock &&
    !line.outOfStock &&
    currentPresentation;

  const handleAdd = () => {
    if (!canAdd) return;
    onAddToCart(line, selectedVariant, currentPresentation);
  };

  return (
    <article className="product-card flavor-line-card">
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
        {currentPresentation && (
          <p className="product-price">{formatPrice(currentPresentation.price)}</p>
        )}

        {preview ? (
          <p className="product-preview-note">Vista previa del catálogo</p>
        ) : (
          <div className="flavor-line-actions">
            <label className="flavor-line-flavor-field">
              <span className="flavor-line-flavor-label">Sabor</span>
              <select
                className="flavor-line-select"
                aria-label="Sabor"
                value={selectedVariantId}
                onChange={(event) => setSelectedVariantId(event.target.value)}
                disabled={line.outOfStock}
              >
                {line.variants.map((variant) => (
                  <option key={variant.id} value={variant.id} disabled={variant.outOfStock}>
                    {variant.label}
                    {variant.outOfStock ? " (sin stock)" : ""}
                  </option>
                ))}
              </select>
            </label>

            {line.presentations.length > 1 && (
              <QuantitySelector
                idPrefix={`${line.id}-line`}
                presentations={line.presentations}
                value={selectedPresentation}
                onChange={setSelectedPresentation}
              />
            )}

            <button
              type="button"
              className={`button primary ${canAdd ? "" : "disabled"}`.trim()}
              onClick={handleAdd}
              disabled={!canAdd}
            >
              {line.outOfStock ? "No disponible" : "Agregar al carrito"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
