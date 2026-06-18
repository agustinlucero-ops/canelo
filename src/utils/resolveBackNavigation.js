export const BACK_ACTIONS = {
  CLOSE_LAYER: "close_layer",
  SWITCH_TO_CATALOGO: "switch_to_catalogo",
  CONFIRM_EXIT: "confirm_exit",
  ALLOW_EXIT: "allow_exit",
};

const LAYER_PRIORITY = ["productEdit", "adminLogin", "flavorPicker", "cart"];

export function resolveBackNavigation({ layers, isAdmin, activeView, cartItemCount }) {
  for (const layer of LAYER_PRIORITY) {
    if (layers[layer]) {
      return { type: BACK_ACTIONS.CLOSE_LAYER, layer };
    }
  }

  if (isAdmin && activeView === "gestion") {
    return { type: BACK_ACTIONS.SWITCH_TO_CATALOGO };
  }

  if (cartItemCount > 0) {
    return { type: BACK_ACTIONS.CONFIRM_EXIT };
  }

  return { type: BACK_ACTIONS.ALLOW_EXIT };
}

export function shouldWarnBeforeUnload(cartItemCount) {
  return cartItemCount > 0;
}

export const EXIT_CONFIRM_MESSAGE =
  "¿Querés salir de la tienda? Tu carrito todavía tiene productos.";
