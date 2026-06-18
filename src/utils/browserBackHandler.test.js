import { describe, expect, it, vi } from "vitest";
import { BACK_ACTIONS, createBrowserBackHandler } from "./browserBackHandler";

describe("createBrowserBackHandler", () => {
  it("cierra el carrito en gesto atrás sin abandonar la página", () => {
    const onCloseLayer = vi.fn();
    const pushState = vi.fn();
    const handler = createBrowserBackHandler({
      getNavigationState: () => ({
        layers: {
          productEdit: false,
          adminLogin: false,
          flavorPicker: false,
          cart: true,
        },
        isAdmin: false,
        activeView: "catalogo",
        cartItemCount: 2,
      }),
      onCloseLayer,
      onSwitchToCatalogo: vi.fn(),
      onConfirmExit: vi.fn(),
      pushState,
    });

    const result = handler();

    expect(result).toEqual({ handled: true });
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(onCloseLayer).toHaveBeenCalledWith("cart");
  });

  it("permite salir cuando el catálogo está en foco y el carrito está vacío", () => {
    const handler = createBrowserBackHandler({
      getNavigationState: () => ({
        layers: {
          productEdit: false,
          adminLogin: false,
          flavorPicker: false,
          cart: false,
        },
        isAdmin: false,
        activeView: "catalogo",
        cartItemCount: 0,
      }),
      onCloseLayer: vi.fn(),
      onSwitchToCatalogo: vi.fn(),
      onConfirmExit: vi.fn(),
      pushState: vi.fn(),
    });

    expect(handler()).toEqual({ handled: false });
  });
});
