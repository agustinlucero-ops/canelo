import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ProductTitleBlock from "./ProductTitleBlock";

describe("ProductTitleBlock", () => {
  it("shows shelf note below the product name when provided", () => {
    const html = renderToStaticMarkup(
      <ProductTitleBlock name="Almendra" category="Frutos secos" shelfNote="sin piel" />
    );

    expect(html).toContain("Almendra");
    expect(html).toContain('class="product-shelf-note"');
    expect(html).toContain("sin piel");
  });

  it("omits shelf note markup when empty", () => {
    const html = renderToStaticMarkup(
      <ProductTitleBlock name="Almendra" category="Frutos secos" shelfNote="" />
    );

    expect(html).not.toContain("product-shelf-note");
  });
});
