import { Trash2, X } from "lucide-react";
import GranolaLineCard from "./GranolaLineCard";

function draftToPreviewLine(draft) {
  const presentations = draft.presentations
    .map((presentation) => {
      const label = String(presentation.label ?? "").trim();
      const price = Number(String(presentation.price ?? "").replace(",", "."));
      if (!label || Number.isNaN(price) || price <= 0) return null;
      return { label, price: Math.round(price) };
    })
    .filter(Boolean);

  const variants = (draft.variants ?? []).map((variant, index) => ({
    id: String(variant.id ?? "").trim() || `sabor-${index + 1}`,
    label: String(variant.label ?? "").trim() || "Sabor",
    image: String(variant.image ?? "").trim() || draft.image,
    description: String(variant.description ?? "").trim(),
    contents: String(variant.contentsText ?? "")
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean),
    isVegan: Boolean(variant.isVegan),
    outOfStock: Boolean(variant.outOfStock),
  }));

  return {
    id: draft.id,
    name: draft.name.trim() || "Línea sin nombre",
    category: draft.category,
    productType: "flavor-line",
    image: draft.image.trim() || "/images/products/granola.svg",
    outOfStock: Boolean(draft.outOfStock),
    presentations: presentations.length ? presentations : [{ label: "1kg", price: 1 }],
    variants: variants.length ? variants : [{ id: "sabor-1", label: "Sabor", image: draft.image, contents: [] }],
  };
}

export default function FlavorLineEditModal({
  draft,
  productCategoryOptions,
  productAdminError,
  onClose,
  onSave,
  onEditProductField,
  onEditProductPresentationField,
  onAddPresentationToDraft,
  onRemovePresentationFromDraft,
  onEditVariantField,
  onAddVariantToDraft,
  onRemoveVariantFromDraft,
  onEditProductImageFile,
  onEditVariantImageFile,
  isActionDisabled = false,
  isSaving = false,
}) {
  const previewLine = draftToPreviewLine(draft);

  return (
    <>
      <button
        type="button"
        className="overlay"
        onClick={onClose}
        aria-label="Cerrar editor"
        disabled={isSaving}
      />
      <div
        className="modal-card product-edit-modal flavor-line-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flavor-line-edit-title"
      >
        <div className="product-edit-modal-header">
          <h2 id="flavor-line-edit-title">Editar línea de producto</h2>
          <button
            type="button"
            className="admin-icon-button"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={isSaving}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <section className="product-edit-preview" aria-label="Vista previa en catálogo">
          <GranolaLineCard line={previewLine} onOpenFlavorPicker={() => {}} preview />
        </section>

        <form
          className="product-edit-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <label className="field-label" htmlFor="flavor-line-edit-name">
            Nombre de la línea
          </label>
          <input
            id="flavor-line-edit-name"
            type="text"
            value={draft.name}
            onChange={(event) => onEditProductField("name", event.target.value)}
            disabled={isActionDisabled}
          />

          <label className="field-label" htmlFor="flavor-line-edit-category">
            Categoría
          </label>
          <select
            id="flavor-line-edit-category"
            className="select-field"
            value={draft.category}
            onChange={(event) => onEditProductField("category", event.target.value)}
            disabled={isActionDisabled}
          >
            {productCategoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <div className="product-edit-image-field">
            <p className="field-label">Imagen de la línea</p>
            <input
              type="text"
              value={draft.image}
              onChange={(event) => onEditProductField("image", event.target.value)}
              placeholder="Ruta o URL de imagen"
              disabled={isActionDisabled}
            />
            <label className="product-edit-image-upload">
              <span className="product-edit-image-upload-copy">
                <strong>Cambiar imagen de línea</strong>
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={onEditProductImageFile}
                disabled={isActionDisabled}
              />
            </label>
          </div>

          <label className="stock-toggle">
            <input
              type="checkbox"
              checked={draft.outOfStock}
              onChange={(event) => onEditProductField("outOfStock", event.target.checked)}
              disabled={isActionDisabled}
            />
            Toda la línea sin stock
          </label>

          <p className="field-label">Presentaciones y precios (compartidas por sabores)</p>
          <div className="presentation-admin-list">
            {draft.presentations.map((presentation, index) => (
              <div key={`${draft.id}-presentation-${index}`} className="presentation-admin-row">
                <input
                  type="text"
                  value={presentation.label}
                  onChange={(event) =>
                    onEditProductPresentationField(index, "label", event.target.value)
                  }
                  disabled={isActionDisabled}
                />
                <input
                  type="number"
                  min="1"
                  value={presentation.price}
                  onChange={(event) =>
                    onEditProductPresentationField(index, "price", event.target.value)
                  }
                  disabled={isActionDisabled}
                />
                <button
                  type="button"
                  className="admin-icon-button admin-icon-button-danger"
                  onClick={() => onRemovePresentationFromDraft(index)}
                  disabled={isActionDisabled || draft.presentations.length === 1}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="button product-edit-add-presentation"
            onClick={onAddPresentationToDraft}
            disabled={isActionDisabled}
          >
            + Añadir presentación
          </button>

          <p className="field-label">Sabores</p>
          {(draft.variants ?? []).map((variant, index) => (
            <fieldset key={`${draft.id}-variant-${variant.id || index}`} className="flavor-variant-editor">
              <legend>Sabor {index + 1}</legend>
              <input
                type="text"
                value={variant.label}
                onChange={(event) => onEditVariantField(index, "label", event.target.value)}
                placeholder="Nombre del sabor"
                disabled={isActionDisabled}
              />
              <input
                type="text"
                value={variant.image}
                onChange={(event) => onEditVariantField(index, "image", event.target.value)}
                placeholder="Imagen del sabor"
                disabled={isActionDisabled}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(event) => onEditVariantImageFile(index, event)}
                disabled={isActionDisabled}
              />
              <textarea
                value={variant.description}
                onChange={(event) => onEditVariantField(index, "description", event.target.value)}
                placeholder="Descripción"
                rows={2}
                disabled={isActionDisabled}
              />
              <textarea
                value={variant.contentsText}
                onChange={(event) => onEditVariantField(index, "contentsText", event.target.value)}
                placeholder="Contiene (un ingrediente por línea)"
                rows={3}
                disabled={isActionDisabled}
              />
              <label className="stock-toggle">
                <input
                  type="checkbox"
                  checked={variant.isVegan}
                  onChange={(event) => onEditVariantField(index, "isVegan", event.target.checked)}
                  disabled={isActionDisabled}
                />
                Sabor vegano
              </label>
              <label className="stock-toggle">
                <input
                  type="checkbox"
                  checked={variant.outOfStock}
                  onChange={(event) => onEditVariantField(index, "outOfStock", event.target.checked)}
                  disabled={isActionDisabled}
                />
                Sabor sin stock
              </label>
              <button
                type="button"
                className="button"
                onClick={() => onRemoveVariantFromDraft(index)}
                disabled={isActionDisabled || (draft.variants?.length ?? 0) <= 1}
              >
                Quitar sabor
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            className="button"
            onClick={onAddVariantToDraft}
            disabled={isActionDisabled}
          >
            + Añadir sabor
          </button>

          {productAdminError && <p className="admin-error">{productAdminError}</p>}

          <div className="modal-actions">
            <button className="button" type="button" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button className="button primary" type="submit" disabled={isActionDisabled}>
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
