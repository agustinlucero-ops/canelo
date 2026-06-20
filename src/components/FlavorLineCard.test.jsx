/**
 * @vitest-environment happy-dom
 */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import FlavorLineCard from "./FlavorLineCard";

function renderFlavorLineCard(ui) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

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

  it("no muestra insignia vegana cuando el sabor elegido por defecto no es vegano", () => {
    const html = renderToStaticMarkup(
      <FlavorLineCard
        line={{
          ...line,
          variants: [
            {
              id: "mani-tradicional",
              label: "Tradicional",
              image: "/images/products/mani.svg",
              isVegan: false,
              outOfStock: false,
            },
            {
              id: "mani-vegano",
              label: "Vegano",
              image: "/images/products/mani.svg",
              isVegan: true,
              outOfStock: false,
            },
          ],
        }}
        onAddToCart={vi.fn()}
      />
    );

    expect(html).not.toContain("product-floating-badges");
    expect(html).not.toContain('aria-label="Producto vegano"');
  });

  it("muestra insignia vegana entre nombre y precio cuando el sabor elegido es vegano", () => {
    const html = renderToStaticMarkup(
      <FlavorLineCard
        line={{
          ...line,
          variants: [
            {
              id: "mani-vegano",
              label: "Vegano",
              image: "/images/products/mani.svg",
              isVegan: true,
              outOfStock: false,
            },
          ],
        }}
        onAddToCart={vi.fn()}
      />
    );

    expect(html).not.toContain("product-floating-badges");
    expect(html).toContain('class="product-badges"');
    expect(html).toContain('aria-label="Producto vegano"');

    const badgesIndex = html.indexOf('class="product-badges"');
    const priceIndex = html.indexOf('class="product-price"');
    expect(badgesIndex).toBeGreaterThan(-1);
    expect(priceIndex).toBeGreaterThan(badgesIndex);
  });

  it("actualiza la insignia vegana al cambiar el sabor elegido", () => {
    const flavoredLine = {
      id: "mani-saborizado",
      name: "Mani saborizado",
      category: "Maní suelto",
      productType: "flavored",
      image: "/images/products/mani.svg",
      presentations: [{ label: "1kg", price: 7500 }],
      variants: [
        {
          id: "mani-tradicional",
          label: "Tradicional",
          image: "/images/products/mani.svg",
          isVegan: false,
          outOfStock: false,
        },
        {
          id: "mani-vegano",
          label: "Vegano",
          image: "/images/products/mani.svg",
          isVegan: true,
          outOfStock: false,
        },
      ],
    };

    const { container } = renderFlavorLineCard(
      <FlavorLineCard line={flavoredLine} onAddToCart={vi.fn()} />
    );

    expect(container.querySelector('[aria-label="Producto vegano"]')).toBeNull();

    act(() => {
      container.querySelector('select[aria-label="Sabor"]').value = "mani-vegano";
      container
        .querySelector('select[aria-label="Sabor"]')
        .dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(container.querySelector('[aria-label="Producto vegano"]')).not.toBeNull();
  });

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
