import { X } from "lucide-react";
import ProductCard from "./ProductCard";

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
    outOfStock: Boolean(draft.outOfStock),
    presentations: presentations.length ? presentations : [{ label: "—", price: 1 }],
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
}) {
  const previewProduct = draftToPreviewProduct(draft);

  return (
    <>
      <button type="button" className="overlay" onClick={onClose} aria-label="Cerrar editor" />
      <div
        className="modal-card product-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-edit-title"
      >
        <div className="product-edit-modal-header">
          <h2 id="product-edit-title">Editar producto</h2>
          <button type="button" className="admin-icon-button" onClick={onClose} aria-label="Cerrar">
            <X aria-hidden="true" />
          </button>
        </div>

        <section className="product-edit-preview" aria-label="Vista previa en catálogo">
          <p className="product-edit-preview-label">Vista en catálogo</p>
          <ProductCard product={previewProduct} onAddToCart={() => {}} preview />
        </section>

        <form
          className="product-edit-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <input
            type="text"
            value={draft.name}
            onChange={(event) => onEditProductField("name", event.target.value)}
            placeholder="Nombre"
          />
          <select
            className="select-field"
            value={draft.category}
            onChange={(event) => onEditProductField("category", event.target.value)}
          >
            {productCategoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <label className="field-label" htmlFor="product-edit-image-url">
            Foto (URL)
          </label>
          <input
            id="product-edit-image-url"
            type="url"
            value={draft.image}
            onChange={(event) => onEditProductField("image", event.target.value)}
            placeholder="URL de foto"
          />
          <input type="file" accept="image/*" onChange={onEditProductImageFile} />

          <label className="stock-toggle">
            <input
              type="checkbox"
              checked={draft.isVegan}
              onChange={(event) => onEditProductField("isVegan", event.target.checked)}
            />
            Producto vegano
          </label>

          <label className="stock-toggle">
            <input
              type="checkbox"
              checked={draft.outOfStock}
              onChange={(event) => onEditProductField("outOfStock", event.target.checked)}
            />
            Sin stock
          </label>

          <p className="field-label">Presentaciones y precios</p>
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
                />
                <button
                  className="admin-icon-button"
                  type="button"
                  onClick={() => onRemovePresentationFromDraft(index)}
                  aria-label="Quitar presentación"
                  disabled={draft.presentations.length === 1}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <button className="button" type="button" onClick={onAddPresentationToDraft}>
            + Presentación
          </button>

          {productAdminError && <p className="admin-error">{productAdminError}</p>}

          <div className="modal-actions">
            <button className="button" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="button primary" type="submit">
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
