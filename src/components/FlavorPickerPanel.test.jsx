import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import FlavorPickerPanel from "./FlavorPickerPanel";

describe("FlavorPickerPanel", () => {
  const line = {
    id: "granola-cuca",
    name: "Granola CUCA",
    image: "/images/products/granola.svg",
    presentations: [{ label: "1kg", price: 10300 }],
    variants: [
      {
        id: "cuca-tradicional",
        label: "Tradicional",
        image: "/images/products/granola.svg",
        description: "Clásica y crocante.",
        contents: ["Avena", "Miel"],
        outOfStock: false,
      },
    ],
  };

  it("usa presentación controlada cuando se pasa desde la tarjeta", () => {
    const onPresentationChange = vi.fn();
    const html = renderToStaticMarkup(
      <FlavorPickerPanel
        isOpen
        line={{
          ...line,
          presentations: [
            { label: "100g", price: 2700 },
            { label: "500g", price: 9500 },
          ],
        }}
        onClose={vi.fn()}
        onAddToCart={vi.fn()}
        selectedPresentation="500g"
        onPresentationChange={onPresentationChange}
      />
    );

    expect(html).toContain('aria-checked="true"');
    expect(html).toContain("500g");
    expect(html).toContain("$9.500");
  });

  it("muestra chips de sabor y agregar al carrito para líneas de producto", () => {
    const html = renderToStaticMarkup(
      <FlavorPickerPanel isOpen line={line} onClose={vi.fn()} onAddToCart={vi.fn()} />
    );

    expect(html).toContain("Tradicional");
    expect(html).toContain("Agregar al carrito");
    expect(html).toContain("flavor-picker-panel open");
  });
});
