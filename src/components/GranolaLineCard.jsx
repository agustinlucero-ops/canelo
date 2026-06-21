import { useMemo } from "react";
import QuantitySelector from "./QuantitySelector";
import ProductPresentationPrice from "./ProductPresentationPrice";
import ProductPromoBadge from "./ProductPromoBadge";
import { resolvePresentationPricing } from "../utils/presentationPricing";
import { normalizeProductName } from "../utils/productName";
import { flavorLineShowsPresentationsOnCard } from "../utils/mixFrutosSecosShelf";

export default function GranolaLineCard({
  line,
  onOpenFlavorPicker,
  preview = false,
  selectedPresentation,
  onPresentationChange,
}) {
  const displayName = normalizeProductName(line.name, line.category);
  const showPresentationsOnCard = flavorLineShowsPresentationsOnCard(line);
  const showWeightSelector =
    showPresentationsOnCard && line.presentations.length > 1 && !preview;

  const currentPresentation = useMemo(() => {
    if (!line.presentations?.length) return null;
    if (!showPresentationsOnCard || !selectedPresentation) {
      return line.presentations[0];
    }
    return (
      line.presentations.find((presentation) => presentation.label === selectedPresentation) ??
      line.presentations[0]
    );
  }, [line.presentations, selectedPresentation, showPresentationsOnCard]);

  const presentationPricing = useMemo(
    () => (currentPresentation ? resolvePresentationPricing(currentPresentation) : null),
    [currentPresentation]
  );

  return (
    <article className="product-card granola-line-card">
      <div className="product-media">
        <img src={line.image} alt={displayName} className="product-image" loading="lazy" />
        <ProductPromoBadge promoLabel={presentationPricing?.promoLabel ?? null} />
      </div>
      <div className="product-content">
        <h3>{displayName}</h3>
        {currentPresentation && <ProductPresentationPrice presentation={currentPresentation} />}

        {showWeightSelector ? (
          <QuantitySelector
            idPrefix={`${line.id}-card`}
            presentations={line.presentations}
            value={selectedPresentation ?? line.presentations[0].label}
            onChange={onPresentationChange}
          />
        ) : (
          currentPresentation?.label && (
            <QuantitySelector
              presentations={line.presentations}
              value={currentPresentation.label}
              readOnly
            />
          )
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
            {line.outOfStock ? "Sin stock" : "Ver contenido"}
          </button>
        )}
      </div>
    </article>
  );
}
