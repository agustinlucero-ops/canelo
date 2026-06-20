import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ProductCard from "./ProductCard";

describe("ProductCard", () => {
  const product = {
    id: "avena-naturitas",
    name: "Naturitas de frutos rojos",
    category: "Avena",
    image: "/images/products/avena.svg",
    outOfStock: false,
    presentations: [
      { label: "100g", price: 2300 },
      { label: "500g", price: 5000 },
    ],
  };

  it("muestra insignias nutricionales entre nombre y precio, no sobre la foto", () => {
    const html = renderToStaticMarkup(
      <ProductCard
        product={{
          ...product,
          isVegan: true,
          isKeto: true,
          isGlutenFree: true,
        }}
        onAddToCart={vi.fn()}
      />
    );

    expect(html).not.toContain("product-floating-badges");
    expect(html).toContain('class="product-badges"');
    expect(html).toContain('aria-label="Producto vegano"');
    expect(html).toContain('aria-label="Producto apto keto"');
    expect(html).toContain('aria-label="Producto sin TACC"');

    const mediaEnd = html.indexOf("</div>", html.indexOf('class="product-media"'));
    const badgesIndex = html.indexOf('class="product-badges"');
    const priceIndex = html.indexOf('class="product-price"');

    expect(badgesIndex).toBeGreaterThan(mediaEnd);
    expect(priceIndex).toBeGreaterThan(badgesIndex);
  });

  it("muestra Sin stock en el botón cuando el producto está sin stock", () => {
    const html = renderToStaticMarkup(
      <ProductCard product={{ ...product, outOfStock: true }} onAddToCart={vi.fn()} />
    );

    expect(html).toContain("Sin stock");
    expect(html).not.toContain("No disponible");
    expect(html).not.toContain("Agregar al carrito");
  });

  it("no muestra cartel Sin stock sobre la imagen cuando el producto está sin stock", () => {
    const html = renderToStaticMarkup(
      <ProductCard product={{ ...product, outOfStock: true }} onAddToCart={vi.fn()} />
    );

    expect(html).not.toContain("product-stock-badge");
  });
});
