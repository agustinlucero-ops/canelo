import { describe, expect, it } from "vitest";
import { BACK_ACTIONS, resolveBackNavigation } from "./resolveBackNavigation";

describe("resolveBackNavigation", () => {
  const baseLayers = {
    productEdit: false,
    adminLogin: false,
    flavorPicker: false,
    cart: false,
  };

  it("cierra el carrito antes de abandonar el sitio", () => {
    expect(
      resolveBackNavigation({
        layers: { ...baseLayers, cart: true },
        isAdmin: false,
        activeView: "catalogo",
        cartItemCount: 2,
      })
    ).toEqual({
      type: BACK_ACTIONS.CLOSE_LAYER,
      layer: "cart",
    });
  });

  it("cierra capas en orden de prioridad", () => {
    expect(
      resolveBackNavigation({
        layers: {
          productEdit: true,
          adminLogin: true,
          flavorPicker: true,
          cart: true,
        },
        isAdmin: true,
        activeView: "gestion",
        cartItemCount: 1,
      })
    ).toEqual({
      type: BACK_ACTIONS.CLOSE_LAYER,
      layer: "productEdit",
    });
  });

  it("vuelve al catálogo cuando el admin está en gestión", () => {
    expect(
      resolveBackNavigation({
        layers: baseLayers,
        isAdmin: true,
        activeView: "gestion",
        cartItemCount: 0,
      })
    ).toEqual({
      type: BACK_ACTIONS.SWITCH_TO_CATALOGO,
    });
  });

  it("pide confirmación de salida si el carrito tiene productos", () => {
    expect(
      resolveBackNavigation({
        layers: baseLayers,
        isAdmin: false,
        activeView: "catalogo",
        cartItemCount: 3,
      })
    ).toEqual({
      type: BACK_ACTIONS.CONFIRM_EXIT,
    });
  });

  it("permite salir cuando el catálogo está en foco y el carrito está vacío", () => {
    expect(
      resolveBackNavigation({
        layers: baseLayers,
        isAdmin: false,
        activeView: "catalogo",
        cartItemCount: 0,
      })
    ).toEqual({
      type: BACK_ACTIONS.ALLOW_EXIT,
    });
  });
});
