import { Pencil, Trash2 } from "lucide-react";
import ProductCard from "./ProductCard";
import { groupDraftItemsByCategory } from "../utils/groupDraftItemsByCategory";

export default function CatalogImportReviewView({
  draft,
  isActionDisabled,
  onEditItem,
  onRemoveItem,
  onRenameCategory,
  onDiscard,
  onPublish,
}) {
  const groupedItems = groupDraftItemsByCategory(draft.items);

  return (
    <div className="admin-import-review">
      <p className="admin-import-banner" role="status">
        Borrador — no visible para clientes. Revisá cómo quedarían en la tienda antes de publicar.
      </p>

      <p className="field-label">
        Resumen: {draft.summary.toCreate} nuevos · {draft.summary.toUpdate} actualizaciones ·{" "}
        {draft.summary.skipped ?? 0} omitidos
      </p>

      {groupedItems.map(([category, items]) => (
        <section key={category} className="category-section admin-import-category">
          <div className="admin-import-category-header">
            <h3>{category}</h3>
            <button
              className="button button-sm"
              type="button"
              onClick={() => onRenameCategory(category)}
              disabled={isActionDisabled}
            >
              Renombrar categoría
            </button>
          </div>
          <div className="product-grid">
            {items.map((item) => (
              <ProductCard key={item.id} product={item.payload} preview />
            ))}
          </div>

          <ul className="admin-product-list admin-import-list">
            {items.map((item) => (
              <li key={`${item.id}-admin`} className="admin-product-list-item">
                <div className="admin-product-list-row">
                  <div className="admin-product-list-info">
                    <span className="admin-product-list-name">{item.payload.name}</span>
                    <span className="admin-product-list-meta">
                      {item.action === "update" ? "Actualización" : "Nuevo"}
                    </span>
                  </div>
                  <div className="admin-product-list-actions">
                    <button
                      className="admin-icon-button"
                      type="button"
                      onClick={() => onEditItem(item)}
                      aria-label={`Editar ${item.payload.name}`}
                      disabled={isActionDisabled}
                    >
                      <Pencil aria-hidden="true" />
                    </button>
                    <button
                      className="admin-icon-button admin-icon-button-danger"
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      aria-label={`Quitar ${item.payload.name}`}
                      disabled={isActionDisabled}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="admin-import-actions">
        <button
          className="button primary"
          type="button"
          onClick={onPublish}
          disabled={isActionDisabled || !draft.items.length}
        >
          Publicar en la tienda
        </button>
        <button className="button" type="button" onClick={onDiscard} disabled={isActionDisabled}>
          Descartar borrador
        </button>
      </div>
    </div>
  );
}
