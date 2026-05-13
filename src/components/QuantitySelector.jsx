export default function QuantitySelector({ presentations, value, onChange, idPrefix }) {
  return (
    <div className="presentation-selector">
      <label htmlFor={`${idPrefix}-presentation`} className="field-label">
        Presentacion
      </label>
      <select
        id={`${idPrefix}-presentation`}
        className="select-field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {presentations.map((presentation) => (
          <option key={presentation.label} value={presentation.label}>
            {presentation.label}
          </option>
        ))}
      </select>
    </div>
  );
}
