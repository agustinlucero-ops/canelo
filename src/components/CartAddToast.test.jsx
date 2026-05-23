import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CartAddToast from "./CartAddToast";

describe("CartAddToast", () => {
  it("muestra la confirmación de agregado al carrito cuando hay mensaje", () => {
    const html = renderToStaticMarkup(
      <CartAddToast message="¡Agregado al carrito! 🛒" />
    );

    expect(html).toContain("¡Agregado al carrito! 🛒");
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("cart-add-toast");
  });

  it("no renderiza nada cuando no hay mensaje", () => {
    const html = renderToStaticMarkup(<CartAddToast message="" />);

    expect(html).toBe("");
  });
});
