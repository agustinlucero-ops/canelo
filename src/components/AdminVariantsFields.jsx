import { Trash2 } from "lucide-react";
import { PRODUCT_TYPE_FLAVOR_LINE } from "../utils/sanitizeCatalog";

export default function AdminVariantsFields({
  variants,
  productType,
  onVariantChange,
  onVariantImageFile,
  onAddVariant,
  onRemoveVariant,
  disabled = false,
}) {
  const isFlavorLine = productType === PRODUCT_TYPE_FLAVOR_LINE;

  return (
    <>
      <p className="field-label">Sabores</p>
      {(variants ?? []).map((variant, index) => (
        <fieldset key={variant.id || `new-variant-${index}`} className="flavor-variant-editor">
          <legend>Sabor {index + 1}</legend>
          <input
            type="text"
            value={variant.label}
            onChange={(event) => onVariantChange(index, "label", event.target.value)}
            placeholder="Nombre del sabor"
            disabled={disabled}
          />
          <input
            type="text"
            value={variant.image}
            onChange={(event) => onVariantChange(index, "image", event.target.value)}
            placeholder="Imagen del sabor (opcional)"
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
      ))}
      <button className="button" type="button" onClick={onAddVariant} disabled={disabled}>
        + Añadir sabor
      </button>
    </>
  );
}
