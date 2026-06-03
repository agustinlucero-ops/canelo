import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import GranolaLineCard from "./GranolaLineCard";

describe("GranolaLineCard", () => {
  const line = {
    id: "granola-cuca",
    name: "Granola CUCA",
    category: "Granolas",
    productType: "flavor-line",
    image: "/images/products/granola.svg",
    presentations: [{ label: "1kg", price: 10300 }],
    variants: [
      {
        id: "cuca-tradicional",
        label: "Tradicional",
        image: "/images/products/granola.svg",
        outOfStock: false,
      },
    ],
  };

  it("abre el panel de sabores en lugar de agregar directo al carrito", () => {
    const html = renderToStaticMarkup(
      <GranolaLineCard line={line} onOpenFlavorPicker={vi.fn()} />
    );

    expect(html).toContain("Ver contenido");
    expect(html).not.toContain("Agregar al carrito");
  });
});
