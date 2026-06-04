import { ChevronDown } from "lucide-react";
import { useRef } from "react";

export default function CatalogCategorySearch({
  searchValue,
  onSearchChange,
  isOpen,
  onOpenChange,
  suggestions,
  hasSuggestions,
  showNoMatches,
  onSelectCategory,
  onSelectProduct,
  children,
}) {
  const inputRef = useRef(null);
  const showSuggestionsPanel = isOpen && (hasSuggestions || showNoMatches);

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
      <label className="field-label" htmlFor="category-filter">
        Buscar categoría o producto
      </label>
      <div className="category-filter-field">
        <input
          ref={inputRef}
          id="category-filter"
          className="select-field"
          type="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="category-filter-suggestions"
          value={searchValue}
          placeholder="Buscar categoría o producto..."
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
          aria-controls="category-filter-suggestions"
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
          id="category-filter-suggestions"
          className="category-suggestions"
          role="listbox"
        >
          <button
            type="button"
            className="category-suggestion-item"
            role="option"
            onMouseDown={() => onSelectCategory("Todas")}
          >
            Todas
          </button>
          {suggestions.categories.map((category) => (
            <button
              key={`category-${category}`}
              type="button"
              className="category-suggestion-item"
              role="option"
              onMouseDown={() => onSelectCategory(category)}
            >
              <span className="category-suggestion-label">{category}</span>
              <span className="category-suggestion-meta">Categoría</span>
            </button>
          ))}
          {suggestions.products.length > 0 && (
            <>
              <p className="category-suggestions-heading">Productos</p>
              {suggestions.products.map((product) => (
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
            </>
          )}
          {showNoMatches && (
            <p className="category-suggestion-empty" role="status">
              Sin coincidencias
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
