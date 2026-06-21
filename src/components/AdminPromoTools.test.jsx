/**
 * @vitest-environment happy-dom
 */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import AdminPromoTools from "./AdminPromoTools";

function renderPromoTools(ui) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

const baseProps = {
  promoSearchValue: "",
  onPromoSearchChange: vi.fn(),
  promoSearchOpen: false,
  onPromoSearchOpenChange: vi.fn(),
  promoSearchProducts: [],
  promoSearchShowNoMatches: false,
  onSelectPromoProduct: vi.fn(),
  promoPresentationLabel: "",
  onPromoPresentationLabelChange: vi.fn(),
  promoDiscountValue: "",
  onPromoDiscountChange: vi.fn(),
  promoAdminError: "",
  promoSuccessMessage: "",
  onApplyPromo: vi.fn(),
  onRemovePromo: vi.fn(),
  isActionDisabled: false,
};

describe("AdminPromoTools", () => {
  it("oculta selector de presentación cuando el producto tiene un solo peso", () => {
    const { container } = renderPromoTools(
      <AdminPromoTools
        {...baseProps}
        promoProduct={{
          id: "stevia",
          name: "Stevia",
          presentations: [{ label: "1u", price: 3200 }],
        }}
      />
    );

    expect(container.querySelector("#admin-promo-presentation")).toBeNull();
    expect(container.textContent).toContain("Stevia");
  });

  it("muestra selector de presentación cuando hay más de un peso", () => {
    const { container } = renderPromoTools(
      <AdminPromoTools
        {...baseProps}
        promoProduct={{
          id: "almendra",
          name: "Almendra",
          presentations: [
            { label: "500g", price: 16000 },
            { label: "1kg", price: 28000 },
          ],
        }}
        promoPresentationLabel="500g"
      />
    );

    expect(container.querySelector("#admin-promo-presentation")).not.toBeNull();
  });
});
