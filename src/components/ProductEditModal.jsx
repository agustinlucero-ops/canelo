import { Trash2, X } from "lucide-react";
import { formatPrice } from "../utils/whatsapp";
import {
  PRODUCT_TYPE_FLAVORED,
  PRODUCT_TYPE_FLAVOR_LINE,
  SHELF_NOTE_MAX_LENGTH,
} from "../utils/sanitizeCatalog";
import FlavorLineEditModal from "./FlavorLineEditModal";
import FlavoredProductEditModal from "./FlavoredProductEditModal";
import ProductTitleBlock from "./ProductTitleBlock";

function draftToPreviewProduct(draft) {
  const presentations = draft.presentations
    .map((presentation) => {
      const label = String(presentation.label ?? "").trim();
      const price = Number(String(presentation.price ?? "").replace(",", "."));
      if (!label || Number.isNaN(price) || price <= 0) return null;
      return { label, price: Math.round(price) };
    })
    .filter(Boolean);

  return {
    id: draft.id,
    name: draft.name.trim() || "Producto sin nombre",
    category: draft.category,
    image: draft.image.trim() || "/images/products/almendra.svg",
    isVegan: Boolean(draft.isVegan),
    isKeto: Boolean(draft.isKeto),
    isGlutenFree: Boolean(draft.isGlutenFree),
    outOfStock: Boolean(draft.outOfStock),
    presentations: presentations.length ? presentations : [{ label: "—", price: 1 }],
    shelfNote: String(draft.shelfNote ?? "").trim(),
  };
}

export default function ProductEditModal({
  draft,
  productCategoryOptions,
  productAdminError,
  onClose,
  onSave,
  onEditProductField,
  onEditProductPresentationField,
  onAddPresentationToDraft,
  onRemovePresentationFromDraft,
  onEditProductImageFile,
  onEditVariantField,
  onAddVariantToDraft,
  onRemoveVariantFromDraft,
  onEditVariantImageFile,
  onClearVariantImage,
  isActionDisabled = false,
  isSaving = false,
}) {
  if (draft?.productType === PRODUCT_TYPE_FLAVORED) {
    return (
      <FlavoredProductEditModal
        draft={draft}
        productCategoryOptions={productCategoryOptions}
        productAdminError={productAdminError}
        onClose={onClose}
        onSave={onSave}
        onEditProductField={onEditProductField}
        onEditProductPresentationField={onEditProductPresentationField}
        onAddPresentationToDraft={onAddPresentationToDraft}
        onRemovePresentationFromDraft={onRemovePresentationFromDraft}
        onEditVariantField={onEditVariantField}
        onAddVariantToDraft={onAddVariantToDraft}
        onRemoveVariantFromDraft={onRemoveVariantFromDraft}
        onEditProductImageFile={onEditProductImageFile}
        isActionDisabled={isActionDisabled}
        isSaving={isSaving}
      />
    );
  }

  if (draft?.productType === PRODUCT_TYPE_FLAVOR_LINE) {
    return (
      <FlavorLineEditModal
        draft={draft}
        productCategoryOptions={productCategoryOptions}
        productAdminError={productAdminError}
        onClose={onClose}
        onSave={onSave}
        onEditProductField={onEditProductField}
        onEditProductPresentationField={onEditProductPresentationField}
        onAddPresentationToDraft={onAddPresentationToDraft}
        onRemovePresentationFromDraft={onRemovePresentationFromDraft}
        onEditVariantField={onEditVariantField}
        onAddVariantToDraft={onAddVariantToDraft}
        onRemoveVariantFromDraft={onRemoveVariantFromDraft}
        onEditProductImageFile={onEditProductImageFile}
        onEditVariantImageFile={onEditVariantImageFile}
        onClearVariantImage={onClearVariantImage}
        isActionDisabled={isActionDisabled}
        isSaving={isSaving}
      />
    );
  }

  const previewProduct = draftToPreviewProduct(draft);

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
        className="modal-card product-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-edit-title"
      >
        <div className="product-edit-modal-header">
          <h2 id="product-edit-title">Editar producto</h2>
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
          <button
            type="button"
            className="admin-icon-button product-edit-preview-close"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={isSaving}
          >
            <X aria-hidden="true" />
          </button>
          <div className="product-edit-preview-body">
            <img
              src={previewProduct.image}
              alt={previewProduct.name}
              className="product-edit-preview-image"
            />
            <div className="product-edit-preview-copy">
              <ProductTitleBlock
                name={previewProduct.name}
                category={previewProduct.category}
                shelfNote={previewProduct.shelfNote}
              />
              <p className="product-edit-preview-note">Vista previa en catálogo</p>
              <p className="product-edit-preview-price">
                {formatPrice(previewProduct.presentations[0].price)}
              </p>
              <span className="product-edit-preview-chip">
                {previewProduct.presentations[0].label}
              </span>
            </div>
          </div>
        </section>

        <form
          className="product-edit-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <label className="field-label" htmlFor="product-edit-name">
            Nombre del producto
          </label>
          <input
            id="product-edit-name"
            type="text"
            value={draft.name}
            onChange={(event) => onEditProductField("name", event.target.value)}
            placeholder="Nombre del producto"
            disabled={isActionDisabled}
          />
          <label className="field-label" htmlFor="product-edit-shelf-note">
            Aclaración (opcional)
          </label>
          <input
            id="product-edit-shelf-note"
            type="text"
            value={draft.shelfNote ?? ""}
            onChange={(event) => onEditProductField("shelfNote", event.target.value)}
            placeholder="ej. sin piel, orgánico"
            maxLength={SHELF_NOTE_MAX_LENGTH}
            disabled={isActionDisabled}
          />
          <label className="field-label" htmlFor="product-edit-category">
            Categoría
          </label>
          <select
            id="product-edit-category"
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
            <p className="field-label">Imagen destacada</p>
            <label className="product-edit-image-upload">
              <span className="product-edit-image-thumb" aria-hidden="true" />
              <span className="product-edit-image-upload-copy">
                <strong>Cambiar imagen</strong>
                <small>SVG, PNG o JPG (max. 2MB)</small>
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={onEditProductImageFile}
                disabled={isActionDisabled}
              />
            </label>
            <input
              id="product-edit-image-url"
              type="text"
              value={draft.image}
              onChange={(event) => onEditProductField("image", event.target.value)}
              placeholder="Ruta o URL de imagen (opcional)"
              disabled={isActionDisabled}
            />
          </div>

          <div className="product-edit-flags">
            <label className="stock-toggle">
              <input
                type="checkbox"
                checked={draft.isVegan}
                onChange={(event) => onEditProductField("isVegan", event.target.checked)}
                disabled={isActionDisabled}
              />
              Producto vegano
            </label>
            <label className="stock-toggle">
              <input
                type="checkbox"
                checked={draft.outOfStock}
                onChange={(event) => onEditProductField("outOfStock", event.target.checked)}
                disabled={isActionDisabled}
              />
              Sin stock
            </label>
            <label className="stock-toggle">
              <input
                type="checkbox"
                checked={draft.isKeto}
                onChange={(event) => onEditProductField("isKeto", event.target.checked)}
                disabled={isActionDisabled}
              />
              Producto apto keto
            </label>
            <label className="stock-toggle">
              <input
                type="checkbox"
                checked={draft.isGlutenFree}
                onChange={(event) => onEditProductField("isGlutenFree", event.target.checked)}
                disabled={isActionDisabled}
              />
              Producto sin TACC
            </label>
          </div>

          <p className="field-label">Presentaciones y precios</p>
          <div className="presentation-admin-heading">
            <span>Variante (ej: 1kg)</span>
            <span>Precio ($)</span>
            <span />
          </div>
          <div className="presentation-admin-list">
            {draft.presentations.map((presentation, index) => (
              <div key={`${draft.id}-${index}`} className="presentation-admin-row">
                <input
                  type="text"
                  value={presentation.label}
                  onChange={(event) =>
                    onEditProductPresentationField(index, "label", event.target.value)
                  }
                  placeholder="Presentación"
                  disabled={isActionDisabled}
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={presentation.price}
                  onChange={(event) =>
                    onEditProductPresentationField(index, "price", event.target.value)
                  }
                  placeholder="Precio"
                  disabled={isActionDisabled}
                />
                <button
                  className="admin-icon-button admin-icon-button-danger"
                  type="button"
                  onClick={() => onRemovePresentationFromDraft(index)}
                  aria-label="Quitar presentación"
                  disabled={isActionDisabled || draft.presentations.length === 1}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <button
            className="button product-edit-add-presentation"
            type="button"
            onClick={onAddPresentationToDraft}
            disabled={isActionDisabled}
          >
            + Añadir presentación
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
