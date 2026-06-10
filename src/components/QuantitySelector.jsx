export default function QuantitySelector({
  presentations,
  value,
  onChange,
  idPrefix,
  readOnly = false,
}) {
  const selected =
    presentations.find((presentation) => presentation.label === value) ?? presentations[0];

  if (readOnly) {
    if (!selected) return null;

    return (
      <div className="presentation-selector">
        <div className="presentation-chip-group" aria-label="Peso">
          <span className="presentation-chip active">{selected.label}</span>
        </div>
      </div>
    );
  }

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
