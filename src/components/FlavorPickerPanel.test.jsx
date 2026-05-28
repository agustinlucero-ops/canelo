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

  it("muestra chips de sabor y agregar al carrito para líneas de producto", () => {
    const html = renderToStaticMarkup(
      <FlavorPickerPanel isOpen line={line} onClose={vi.fn()} onAddToCart={vi.fn()} />
    );

    expect(html).toContain("Tradicional");
    expect(html).toContain("Agregar al carrito");
    expect(html).toContain("flavor-picker-panel open");
  });
});
