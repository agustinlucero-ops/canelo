import { Trash2 } from "lucide-react";

export default function AdminPresentationsFields({
  presentations,
  onPresentationChange,
  onAddPresentation,
  onRemovePresentation,
  disabled = false,
  heading = "Presentaciones y precios",
}) {
  return (
    <>
      <p className="field-label">{heading}</p>
      <div className="presentation-admin-heading">
        <span>Presentación</span>
        <span>Precio ($)</span>
        <span />
      </div>
      <div className="presentation-admin-list">
        {presentations.map((presentation, index) => (
          <div key={`new-presentation-${index}`} className="presentation-admin-row">
            <input
              type="text"
              value={presentation.label}
              onChange={(event) => onPresentationChange(index, "label", event.target.value)}
              placeholder="ej. 500g"
              disabled={disabled}
            />
            <input
              type="number"
              min="1"
              step="1"
              value={presentation.price}
              onChange={(event) => onPresentationChange(index, "price", event.target.value)}
              placeholder="Precio"
              disabled={disabled}
            />
            <button
              className="admin-icon-button admin-icon-button-danger"
              type="button"
              onClick={() => onRemovePresentation(index)}
              aria-label="Quitar presentación"
              disabled={disabled || presentations.length === 1}
            >
              <Trash2 aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <button
        className="button product-edit-add-presentation"
        type="button"
        onClick={onAddPresentation}
        disabled={disabled}
      >
        + Añadir presentación
      </button>
    </>
  );
}
