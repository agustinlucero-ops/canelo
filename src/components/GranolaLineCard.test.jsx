import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import GranolaLineCard from "./GranolaLineCard";
import { MIX_FRUTOS_SECOS_CATEGORY } from "../utils/mixFrutosSecosShelf";

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

  it("muestra Sin stock en el botón cuando la línea está sin stock", () => {
    const html = renderToStaticMarkup(
      <GranolaLineCard
        line={{ ...line, outOfStock: true }}
        onOpenFlavorPicker={vi.fn()}
      />
    );

    expect(html).toContain("Sin stock");
    expect(html).not.toContain("Ver contenido");
  });

  it("muestra selector de peso en tarjeta para mix en Mix frutos secos", () => {
    const mixLine = {
      id: "mix-energetico",
      name: "Mix energetico",
      category: MIX_FRUTOS_SECOS_CATEGORY,
      productType: "flavor-line",
      image: "/images/products/almendra.svg",
      presentations: [
        { label: "100g", price: 2700 },
        { label: "500g", price: 9500 },
        { label: "1kg", price: 14500 },
      ],
      variants: [
        {
          id: "mix-energetico",
          label: "Mix energetico",
          image: "/images/products/almendra.svg",
          outOfStock: false,
        },
      ],
    };

    const html = renderToStaticMarkup(
      <GranolaLineCard
        line={mixLine}
        onOpenFlavorPicker={vi.fn()}
        selectedPresentation="500g"
        onPresentationChange={vi.fn()}
      />
    );

    expect(html).toContain("presentation-selector");
    expect(html).toContain("100g");
    expect(html).toContain("500g");
    expect(html).toContain("$9.500");
  });

  it("no muestra selector de peso en tarjeta para granolas", () => {
    const html = renderToStaticMarkup(
      <GranolaLineCard
        line={{
          ...line,
          presentations: [
            { label: "500g", price: 5000 },
            { label: "1kg", price: 10300 },
          ],
        }}
        onOpenFlavorPicker={vi.fn()}
      />
    );

    expect(html).not.toContain("presentation-selector");
  });

  it("no muestra cartel Sin stock sobre la imagen cuando la línea está sin stock", () => {
    const html = renderToStaticMarkup(
      <GranolaLineCard
        line={{ ...line, outOfStock: true }}
        onOpenFlavorPicker={vi.fn()}
      />
    );

    expect(html).not.toContain("product-stock-badge");
  });
});
