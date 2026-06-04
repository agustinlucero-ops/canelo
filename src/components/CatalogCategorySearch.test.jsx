/**
 * @vitest-environment happy-dom
 */
import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import CatalogCategorySearch from "./CatalogCategorySearch";

function renderSearch(ui) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

const defaultSuggestions = {
  categories: ["Granolas", "Frutos secos"],
  products: [],
};

describe("CatalogCategorySearch", () => {
  it("muestra un botón de flecha para mostrar u ocultar sugerencias", () => {
    const { container } = renderSearch(
      <CatalogCategorySearch
        searchValue=""
        onSearchChange={vi.fn()}
        isOpen={false}
        onOpenChange={vi.fn()}
        suggestions={defaultSuggestions}
        hasSuggestions
        showNoMatches={false}
        onSelectCategory={vi.fn()}
        onSelectProduct={vi.fn()}
      />
    );

    const toggle = container.querySelector(".category-filter-chevron-btn");
    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute("aria-label")).toBe("Mostrar sugerencias");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("al pulsar la flecha con sugerencias cerradas, abre el listado y enfoca el buscador", () => {
    const onOpenChange = vi.fn();
    const { container } = renderSearch(
      <CatalogCategorySearch
        searchValue=""
        onSearchChange={vi.fn()}
        isOpen={false}
        onOpenChange={onOpenChange}
        suggestions={defaultSuggestions}
        hasSuggestions
        showNoMatches={false}
        onSelectCategory={vi.fn()}
        onSelectProduct={vi.fn()}
      />
    );

    const toggle = container.querySelector(".category-filter-chevron-btn");
    const input = container.querySelector("#category-filter");
    act(() => {
      toggle.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(document.activeElement).toBe(input);
  });

  it("al pulsar la flecha con sugerencias abiertas, cierra el listado", () => {
    const onOpenChange = vi.fn();
    const { container } = renderSearch(
      <CatalogCategorySearch
        searchValue=""
        onSearchChange={vi.fn()}
        isOpen
        onOpenChange={onOpenChange}
        suggestions={defaultSuggestions}
        hasSuggestions
        showNoMatches={false}
        onSelectCategory={vi.fn()}
        onSelectProduct={vi.fn()}
      />
    );

    expect(container.querySelector("#category-filter-suggestions")).not.toBeNull();

    const toggle = container.querySelector(".category-filter-chevron-btn");
    act(() => {
      toggle.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("con estado controlado, la flecha alterna la visibilidad del listado de sugerencias", () => {
    function ControlledSearch() {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <CatalogCategorySearch
          searchValue=""
          onSearchChange={vi.fn()}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          suggestions={defaultSuggestions}
          hasSuggestions
          showNoMatches={false}
          onSelectCategory={vi.fn()}
          onSelectProduct={vi.fn()}
        />
      );
    }

    const { container } = renderSearch(<ControlledSearch />);
    const toggle = container.querySelector(".category-filter-chevron-btn");

    act(() => {
      toggle.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(container.querySelector("#category-filter-suggestions")).not.toBeNull();

    act(() => {
      toggle.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(container.querySelector("#category-filter-suggestions")).toBeNull();
  });
});
