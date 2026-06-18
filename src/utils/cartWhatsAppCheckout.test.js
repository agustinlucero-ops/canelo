import { describe, expect, it, vi } from "vitest";
import { runWhatsAppCheckout } from "./cartWhatsAppCheckout";

describe("runWhatsAppCheckout", () => {
  it("guarda el carrito anterior antes de vaciar el carrito activo", () => {
    const items = [{ key: "a", name: "Almendra", quantity: 1 }];
    const onSavePreviousCart = vi.fn();
    const clearCart = vi.fn();

    runWhatsAppCheckout({ items, onSavePreviousCart, clearCart });

    expect(onSavePreviousCart).toHaveBeenCalledWith(items);
    expect(clearCart).toHaveBeenCalledTimes(1);
  });

  it("no hace nada si el carrito está vacío", () => {
    const onSavePreviousCart = vi.fn();
    const clearCart = vi.fn();

    runWhatsAppCheckout({ items: [], onSavePreviousCart, clearCart });

    expect(onSavePreviousCart).not.toHaveBeenCalled();
    expect(clearCart).not.toHaveBeenCalled();
  });
});
