import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import FlavorLineCard from "./FlavorLineCard";

describe("FlavorLineCard", () => {
  const line = {
    id: "mani-saborizado",
    name: "Mani saborizado",
    category: "Maní suelto",
    productType: "flavored",
    image: "/images/products/mani.svg",
    presentations: [{ label: "1kg", price: 7500 }],
    variants: [
      { id: "mani-sabor-1", label: "BBQ", image: "/images/products/mani.svg", outOfStock: false },
      { id: "mani-sabor-2", label: "Picante", image: "/images/products/mani.svg", outOfStock: false },
    ],
  };

  it("muestra selector de sabor y agregar al carrito en la tarjeta", () => {
    const html = renderToStaticMarkup(
      <FlavorLineCard line={line} onAddToCart={vi.fn()} />
    );

    expect(html).toContain("Agregar al carrito");
    expect(html).not.toContain("Sabores y contenidos");
    expect(html).toContain('aria-label="Sabor"');
    expect(html).toContain("BBQ");
    expect(html).toContain("Picante");
  });

  it("en vista previa no muestra agregar ni selector de sabor", () => {
    const html = renderToStaticMarkup(
      <FlavorLineCard line={line} onAddToCart={vi.fn()} preview />
    );

    expect(html).toContain("Vista previa del catálogo");
    expect(html).not.toContain("Agregar al carrito");
    expect(html).not.toContain('aria-label="Sabor"');
  });

  it("muestra la presentación fija cuando el producto con sabores tiene un solo peso", () => {
    const html = renderToStaticMarkup(<FlavorLineCard line={line} onAddToCart={vi.fn()} />);
    const saborIndex = html.indexOf('aria-label="Sabor"');
    const pesoIndex = html.indexOf('aria-label="Peso"');

    expect(html).toContain("1kg");
    expect(html).toContain('aria-label="Peso"');
    expect(html).toContain('class="presentation-chip active"');
    expect(html).not.toContain('role="radiogroup"');
    expect(saborIndex).toBeGreaterThan(-1);
    expect(pesoIndex).toBeGreaterThan(saborIndex);
  });

  it("muestra selector interactivo de presentación cuando hay más de una", () => {
    const lineMultiPres = {
      ...line,
      presentations: [
        { label: "500g", price: 4000 },
        { label: "1kg", price: 7500 },
      ],
    };

    const htmlMulti = renderToStaticMarkup(
      <FlavorLineCard line={lineMultiPres} onAddToCart={vi.fn()} />
    );

    expect(htmlMulti).toContain("500g");
    expect(htmlMulti).toContain("1kg");
    expect(htmlMulti).toContain('role="radiogroup"');
    expect(htmlMulti).toContain("presentation-selector");
  });

  it("muestra Sin stock en el botón cuando toda la línea está sin stock", () => {
    const html = renderToStaticMarkup(
      <FlavorLineCard line={{ ...line, outOfStock: true }} onAddToCart={vi.fn()} />
    );

    expect(html).toContain("Sin stock");
    expect(html).not.toContain("No disponible");
    expect(html).not.toContain("Agregar al carrito");
  });

  it("no muestra cartel Sin stock sobre la imagen cuando toda la línea está sin stock", () => {
    const html = renderToStaticMarkup(
      <FlavorLineCard line={{ ...line, outOfStock: true }} onAddToCart={vi.fn()} />
    );

    expect(html).not.toContain("product-stock-badge");
  });

  it("muestra Sin stock en el botón cuando el sabor elegido está sin stock", () => {
    const html = renderToStaticMarkup(
      <FlavorLineCard
        line={{
          ...line,
          variants: [{ id: "mani-sabor-1", label: "BBQ", image: "/images/products/mani.svg", outOfStock: true }],
        }}
        onAddToCart={vi.fn()}
      />
    );

    expect(html).toContain("Sin stock");
    expect(html).not.toContain("Agregar al carrito");
  });
});
