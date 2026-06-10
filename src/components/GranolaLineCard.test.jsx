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

  it("permite elegir peso en tarjeta para mix con varias presentaciones", () => {
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

    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain("100g");
    expect(html).toContain("500g");
    expect(html).toContain("$9.500");
  });

  it("muestra el peso ofrecido en tarjeta para granolas", () => {
    const html = renderToStaticMarkup(
      <GranolaLineCard line={line} onOpenFlavorPicker={vi.fn()} />
    );

    expect(html).toContain('class="presentation-chip active"');
    expect(html).toContain("1kg");
    expect(html).toContain("$10.300");
  });

  it("muestra el peso ofrecido en vista previa de granolas", () => {
    const html = renderToStaticMarkup(
      <GranolaLineCard line={line} onOpenFlavorPicker={vi.fn()} preview />
    );

    expect(html).toContain('class="presentation-chip active"');
    expect(html).toContain("1kg");
    expect(html).toContain("Vista previa del catálogo");
    expect(html).not.toContain('role="radio"');
  });

  it("muestra el peso por defecto sin selector en granolas con varias presentaciones", () => {
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

    expect(html).not.toContain('role="radio"');
    expect(html).toContain('class="presentation-chip active"');
    expect(html).toContain("500g");
    expect(html).toContain("$5.000");
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
