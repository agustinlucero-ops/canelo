import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  PRODUCT_TYPE_FLAVOR_LINE,
  PRODUCT_TYPE_FLAVORED,
} from "../utils/sanitizeCatalog";
import { isVariantImageOverride } from "../utils/variantImage";

export default function AdminVariantsFields({
  variants,
  productType,
  lineImage = "",
  onVariantChange,
  onVariantImageFile,
  onClearVariantImage,
  onAddVariant,
  onRemoveVariant,
  disabled = false,
  showVariantMetaFields = false,
  onVariantMetaChange,
}) {
  const isFlavorLine = productType === PRODUCT_TYPE_FLAVOR_LINE;
  const isFlavored = productType === PRODUCT_TYPE_FLAVORED;
  const [expandedOverrides, setExpandedOverrides] = useState(() => new Set());

  const toggleOverride = (index) => {
    setExpandedOverrides((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <>
      <p className="field-label">Sabores</p>
      {(variants ?? []).map((variant, index) => {
        const hasOverride = isVariantImageOverride(variant.image, lineImage);
        const showOverrideFields = isFlavorLine && (hasOverride || expandedOverrides.has(index));

        return (
          <fieldset key={variant.id || `new-variant-${index}`} className="flavor-variant-editor">
            <legend>Sabor {index + 1}</legend>
            <input
              type="text"
              value={variant.label}
              onChange={(event) => onVariantChange(index, "label", event.target.value)}
              placeholder="Nombre del sabor"
              disabled={disabled}
            />
            {isFlavorLine && (
              <div className="flavor-variant-image-override">
                {!showOverrideFields ? (
                  <button
                    type="button"
                    className="button button-sm"
                    onClick={() => toggleOverride(index)}
                    disabled={disabled}
                  >
                    Foto propia (opcional)
                  </button>
                ) : (
                  <>
                    <input
                      type="text"
                      value={variant.image}
                      onChange={(event) => onVariantChange(index, "image", event.target.value)}
                      placeholder="Imagen del sabor (override)"
                      disabled={disabled}
                    />
                    {onVariantImageFile && (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => onVariantImageFile(index, event)}
                        disabled={disabled}
                      />
                    )}
                    <button
                      type="button"
                      className="button button-sm"
                      onClick={() => {
                        onClearVariantImage?.(index);
                        setExpandedOverrides((current) => {
                          const next = new Set(current);
                          next.delete(index);
                          return next;
                        });
                      }}
                      disabled={disabled}
                    >
                      Usar foto de la línea
                    </button>
                  </>
                )}
              </div>
            )}
            {isFlavorLine && (
              <>
                <textarea
                  value={variant.description ?? ""}
                  onChange={(event) => onVariantChange(index, "description", event.target.value)}
                  placeholder="Descripción"
                  rows={2}
                  disabled={disabled}
                />
                <textarea
                  value={variant.contentsText ?? ""}
                  onChange={(event) => onVariantChange(index, "contentsText", event.target.value)}
                  placeholder="Contiene (un ingrediente por línea)"
                  rows={3}
                  disabled={disabled}
                />
              </>
            )}
            {showVariantMetaFields && isFlavorLine && onVariantMetaChange && (
              <>
                <label className="stock-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(variant.isVegan)}
                    onChange={(event) =>
                      onVariantMetaChange(index, "isVegan", event.target.checked)
                    }
                    disabled={disabled}
                  />
                  Sabor vegano
                </label>
                <label className="stock-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(variant.outOfStock)}
                    onChange={(event) =>
                      onVariantMetaChange(index, "outOfStock", event.target.checked)
                    }
                    disabled={disabled}
                  />
                  Sabor sin stock
                </label>
              </>
            )}
            <button
              type="button"
              className="admin-icon-button admin-icon-button-danger"
              onClick={() => onRemoveVariant(index)}
              aria-label="Quitar sabor"
              disabled={disabled || (variants?.length ?? 0) === 1}
            >
              <Trash2 aria-hidden="true" />
            </button>
          </fieldset>
        );
      })}
      <button className="button" type="button" onClick={onAddVariant} disabled={disabled}>
        + Añadir sabor
      </button>
      {isFlavored && (
        <p className="admin-field-hint">Los sabores usan la foto de línea subida arriba.</p>
      )}
    </>
  );
}
