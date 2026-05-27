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
        description: "Clásica.",
        contents: ["Avena"],
        outOfStock: false,
      },
    ],
  };

  it("shows Sabores y contenidos instead of add to cart", () => {
    const html = renderToStaticMarkup(
      <GranolaLineCard line={line} onOpenFlavorPicker={vi.fn()} />
    );

    expect(html).toContain("Sabores y contenidos");
    expect(html).not.toContain("Agregar al carrito");
    expect(html).toContain("CUCA");
  });
});
