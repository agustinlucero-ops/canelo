import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ProductPromoBadge from "./ProductPromoBadge";

describe("ProductPromoBadge", () => {
  it("muestra etiqueta de promoción con aria-label en español", () => {
    const html = renderToStaticMarkup(<ProductPromoBadge promoLabel="10% OFF" />);

    expect(html).toContain('class="product-promo-badge"');
    expect(html).toContain("10% OFF");
    expect(html).toContain('aria-label="Promoción: 10% de descuento"');
  });

  it("no renderiza nada sin promo activa", () => {
    const html = renderToStaticMarkup(<ProductPromoBadge promoLabel={null} />);

    expect(html).toBe("");
  });
});
