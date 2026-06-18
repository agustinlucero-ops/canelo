import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CartDrawer from "./CartDrawer";

describe("CartDrawer", () => {
  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    items: [],
    totals: { subtotal: 0, total: 0, totalItems: 0 },
    setQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    onSavePreviousCart: vi.fn(),
    previousCartOffer: null,
    onRestorePreviousCart: vi.fn(),
    onDismissPreviousCart: vi.fn(),
  };

  it("ofrece restaurar el carrito anterior cuando el carrito está vacío", () => {
    const html = renderToStaticMarkup(
      <CartDrawer
        {...baseProps}
        previousCartOffer={{
          items: [
            {
              key: "almendra-1kg",
              name: "Almendra",
              presentation: "1kg",
              unitPrice: 1000,
              quantity: 1,
            },
          ],
        }}
      />
    );

    expect(html).toContain("carrito anterior");
    expect(html).toContain("Restaurar");
    expect(html).toContain("Descartar");
  });
});
