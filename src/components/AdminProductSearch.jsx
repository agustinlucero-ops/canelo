import { ChevronDown } from "lucide-react";
import { useRef } from "react";

export default function AdminProductSearch({
  searchValue,
  onSearchChange,
  isOpen,
  onOpenChange,
  products,
  showNoMatches,
  onSelectProduct,
}) {
  const inputRef = useRef(null);
  const showSuggestionsPanel = isOpen && (products.length > 0 || showNoMatches);

  const handleChevronPointerDown = (event) => {
    event.preventDefault();
    if (isOpen) {
      onOpenChange(false);
      return;
    }
    onOpenChange(true);
    inputRef.current?.focus();
  };

  return (
    <div className="category-filter">
      <label className="field-label" htmlFor="admin-product-search">
        Buscar producto
      </label>
      <div className="category-filter-field">
        <input
          ref={inputRef}
          id="admin-product-search"
          className="select-field"
          type="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="admin-product-search-suggestions"
          value={searchValue}
          placeholder="Buscar producto..."
          onFocus={() => onOpenChange(true)}
          onChange={(event) => {
            onSearchChange(event.target.value);
            onOpenChange(true);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              onOpenChange(false);
            }, 120);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onOpenChange(false);
            }
          }}
        />
        <button
          type="button"
          className="category-filter-chevron-btn"
          aria-label={isOpen ? "Ocultar sugerencias" : "Mostrar sugerencias"}
          aria-expanded={isOpen}
          aria-controls="admin-product-search-suggestions"
          onMouseDown={handleChevronPointerDown}
        >
          <ChevronDown
            aria-hidden="true"
            className={`category-filter-chevron ${isOpen ? "is-open" : ""}`}
          />
        </button>
      </div>

      {showSuggestionsPanel && (
        <div
          id="admin-product-search-suggestions"
          className="category-suggestions"
          role="listbox"
        >
          {products.map((product) => (
            <button
              key={`product-${product.id}`}
              type="button"
              className="category-suggestion-item category-suggestion-item--product"
              role="option"
              onMouseDown={() => onSelectProduct(product)}
            >
              <span className="category-suggestion-label">{product.name}</span>
              <span className="category-suggestion-meta">{product.category}</span>
            </button>
          ))}
          {showNoMatches && (
            <p className="category-suggestion-empty" role="status">
              Sin coincidencias
            </p>
          )}
        </div>
      )}
    </div>
  );
}
