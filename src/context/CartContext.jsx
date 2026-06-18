import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { cartInitialState, cartReducer, computeCartTotals } from "./cartReducer";
import { reconcileCartItems } from "../utils/reconcileCart";
import {
  clearCartSession,
  loadCartSession,
  saveCartSession,
} from "../utils/cartSessionStorage";

const CartContext = createContext(null);

function initCartState() {
  return {
    items: loadCartSession(),
  };
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, initCartState);

  useEffect(() => {
    if (state.items.length === 0) {
      clearCartSession();
      return;
    }

    saveCartSession(state.items);
  }, [state.items]);

  const totals = useMemo(() => computeCartTotals(state.items), [state.items]);

  const reconcileWithCatalog = useCallback(
    (products) => {
      const { items, removedCount } = reconcileCartItems(state.items, products);
      const isSame =
        items.length === state.items.length &&
        items.every((item, index) => {
          const current = state.items[index];
          return (
            item.key === current.key &&
            item.name === current.name &&
            item.unitPrice === current.unitPrice &&
            item.image === current.image &&
            item.quantity === current.quantity &&
            item.presentation === current.presentation
          );
        });

      if (!isSame) {
        dispatch({ type: "RECONCILE_WITH_CATALOG", payload: { items } });
      }

      return { removedCount };
    },
    [state.items]
  );

  const value = useMemo(
    () => ({
      items: state.items,
      totals,
      addItem: (product, presentation) =>
        dispatch({ type: "ADD_ITEM", payload: { product, presentation } }),
      addFlavorLineItem: (line, variant, presentation) =>
        dispatch({ type: "ADD_FLAVOR_LINE_ITEM", payload: { line, variant, presentation } }),
      setQuantity: (key, quantity) =>
        dispatch({ type: "SET_QUANTITY", payload: { key, quantity } }),
      removeItem: (key) => dispatch({ type: "REMOVE_ITEM", payload: { key } }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),
      restoreItems: (items) => dispatch({ type: "RESTORE_ITEMS", payload: { items } }),
      reconcileWithCatalog,
    }),
    [state.items, totals, reconcileWithCatalog]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }
  return context;
}
