import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ProductPresentationPrice from "./ProductPresentationPrice";

describe("ProductPresentationPrice", () => {
  it("sin descuento muestra solo el precio de venta", () => {
    const html = renderToStaticMarkup(
      <ProductPresentationPrice presentation={{ label: "1kg", price: 28000 }} />
    );

    expect(html).toContain('class="product-price"');
    expect(html).not.toContain("product-price-list");
    expect(html).toContain("$28.000");
  });

  it("con descuento muestra precio de lista tachado y precio de venta", () => {
    const html = renderToStaticMarkup(
      <ProductPresentationPrice presentation={{ label: "500g", price: 16000, discountPercent: 10 }} />
    );

    expect(html).toContain('class="product-price-list"');
    expect(html).toContain('class="product-price-sale"');
    expect(html).toContain("$16.000");
    expect(html).toContain("$14.400");
  });
});
