/**
 * @vitest-environment happy-dom
 */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import AdminProductSearch from "./AdminProductSearch";

function renderSearch(ui) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe("AdminProductSearch", () => {
  it("lista solo productos al buscar en gestión", () => {
    const onSelectProduct = vi.fn();
    const { container } = renderSearch(
      <AdminProductSearch
        searchValue="gran"
        onSearchChange={vi.fn()}
        isOpen
        onOpenChange={vi.fn()}
        products={[
          { id: "granola-cuca", name: "Granola CUCA", category: "Granolas" },
        ]}
        showNoMatches={false}
        onSelectProduct={onSelectProduct}
      />
    );

    expect(container.textContent).toContain("Granola CUCA");
    expect(container.textContent).not.toContain("Categoría");

    const option = container.querySelector(".category-suggestion-item--product");
    act(() => {
      option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    expect(onSelectProduct).toHaveBeenCalledWith({
      id: "granola-cuca",
      name: "Granola CUCA",
      category: "Granolas",
    });
  });
});
