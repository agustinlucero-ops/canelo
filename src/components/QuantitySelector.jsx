export default function QuantitySelector({ presentations, value, onChange, idPrefix }) {
  return (
    <div className="presentation-selector">
      <div
        className="presentation-chip-group"
        role="radiogroup"
        aria-label="Peso"
      >
        {presentations.map((presentation) => {
          const isSelected = value === presentation.label;

          return (
            <button
              key={presentation.label}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`presentation-chip ${isSelected ? "active" : ""}`}
              onClick={() => onChange(presentation.label)}
            >
              {presentation.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
