import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CatalogImportReviewView from "../components/CatalogImportReviewView";

describe("CatalogImportReviewView", () => {
  it("muestra el borrador como vista previa del catálogo sin carrito", () => {
    const html = renderToStaticMarkup(
      <CatalogImportReviewView
        draft={{
          batch: { importMode: "new_products_only" },
          items: [
            {
              id: "item-1",
              action: "create",
              payload: {
                id: "nuez-pecan",
                name: "Nuez pecan",
                category: "Frutos secos",
                image: "/images/products/almendra.svg",
                presentations: [{ label: "500g", price: 8500 }],
                isVegan: false,
                isKeto: false,
                isGlutenFree: false,
                outOfStock: false,
              },
            },
          ],
          summary: { toCreate: 1, toUpdate: 0, skipped: 0 },
        }}
        isActionDisabled={false}
        onEditItem={() => {}}
        onRemoveItem={() => {}}
        onRenameCategory={() => {}}
        onDiscard={() => {}}
        onPublish={() => {}}
      />
    );

    expect(html).toContain("Borrador");
    expect(html).toContain("Nuez pecan");
    expect(html).toContain("Vista previa del catálogo");
    expect(html).not.toContain("Agregar al carrito");
  });
});
