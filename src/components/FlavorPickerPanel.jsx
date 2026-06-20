import { useEffect, useMemo, useState } from "react";
import { Vegan, X } from "lucide-react";
import QuantitySelector from "./QuantitySelector";
import { formatPrice } from "../utils/whatsapp";
import { getFirstAvailableVariant } from "../utils/flavorLineCart";
import { resolveVariantImage } from "../utils/variantImage";

export default function FlavorPickerPanel({
  isOpen,
  line,
  onClose,
  onAddToCart,
  preview = false,
  selectedPresentation: controlledPresentation,
  onPresentationChange,
}) {
  const isControlledPresentation = onPresentationChange != null;
  const [selectedVariantId, setSelectedVariantId] = useState(
    () => getFirstAvailableVariant(line?.variants)?.id ?? null
  );
  const [internalPresentation, setInternalPresentation] = useState(
    () => line?.presentations?.[0]?.label ?? ""
  );

  const selectedPresentation = isControlledPresentation
    ? (controlledPresentation ?? line?.presentations?.[0]?.label ?? "")
    : internalPresentation;

  const setSelectedPresentation = isControlledPresentation
    ? onPresentationChange
    : setInternalPresentation;

  useEffect(() => {
    if (!line) return;
    const firstVariant = getFirstAvailableVariant(line.variants);
    setSelectedVariantId(firstVariant?.id ?? null);
    if (!isControlledPresentation) {
      setInternalPresentation(line.presentations[0]?.label ?? "");
    }
  }, [line, isControlledPresentation]);

  const selectedVariant = useMemo(
    () => line?.variants?.find((variant) => variant.id === selectedVariantId) ?? null,
    [line, selectedVariantId]
  );

  const currentPresentation = useMemo(
    () =>
      line?.presentations?.find((presentation) => presentation.label === selectedPresentation) ??
      line?.presentations?.[0] ??
      null,
    [line, selectedPresentation]
  );

  if (!line) return null;

  const canAdd =
    !preview &&
    selectedVariant &&
    !selectedVariant.outOfStock &&
    !line.outOfStock &&
    currentPresentation;

  const handleAdd = () => {
    if (!canAdd) return;
    onAddToCart(line, selectedVariant, currentPresentation);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <button type="button" className="overlay" onClick={onClose} aria-label="Cerrar sabores" />
      )}
      <aside
        className={`flavor-picker-panel ${isOpen ? "open" : ""}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="flavor-picker-title"
        aria-hidden={!isOpen}
      >
        <header className="flavor-picker-header">
          <h2 id="flavor-picker-title">{line.name}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="flavor-picker-body">
          <div className="flavor-chip-list" role="listbox" aria-label="Sabores">
            {line.variants.map((variant) => {
              const isSelected = variant.id === selectedVariantId;
              const isDisabled = variant.outOfStock;
              return (
                <button
                  key={variant.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`flavor-chip ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`.trim()}
                  onClick={() => !isDisabled && setSelectedVariantId(variant.id)}
                  disabled={isDisabled}
                >
                  <span>{variant.label}</span>
                  {variant.isVegan && (
                    <span className="flavor-chip-vegan" aria-label="Vegano">
                      <Vegan aria-hidden="true" size={14} />
                    </span>
                  )}
                  {isDisabled && <span className="flavor-chip-stock">Sin stock</span>}
                </button>
              );
            })}
          </div>

          {selectedVariant && (
            <section className="flavor-detail" aria-live="polite">
              <img
                src={resolveVariantImage(selectedVariant, line)}
                alt={selectedVariant.label}
                className="flavor-detail-image"
              />
              {selectedVariant.description && (
                <p className="flavor-detail-description">{selectedVariant.description}</p>
              )}
              {selectedVariant.contents?.length > 0 && (
                <div className="flavor-detail-contents">
                  <h3>Contiene</h3>
                  <ul>
                    {selectedVariant.contents.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </div>

        <footer className="flavor-picker-footer">
          {line.presentations.length > 1 && (
            <QuantitySelector
              idPrefix={`${line.id}-picker`}
              presentations={line.presentations}
              value={selectedPresentation}
              onChange={setSelectedPresentation}
            />
          )}
          {preview ? (
            <p className="product-preview-note">Vista previa del catálogo</p>
          ) : (
            <button
              type="button"
              className={`button primary ${canAdd ? "" : "disabled"}`.trim()}
              onClick={handleAdd}
              disabled={!canAdd}
            >
              Agregar al carrito
            </button>
          )}
          {currentPresentation && (
            <p className="flavor-picker-price">{formatPrice(currentPresentation.price)}</p>
          )}
        </footer>
      </aside>
    </>
  );
}
