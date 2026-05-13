import { createContext, useContext, useMemo, useReducer } from "react";

const CartContext = createContext(null);

const initialState = {
  items: [],
};

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const { product, presentation } = action.payload;
      const key = `${product.id}-${presentation.label}`;
      const existing = state.items.find((item) => item.key === key);

      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.key === key ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            key,
            productId: product.id,
            name: product.name,
            image: product.image,
            presentation: presentation.label,
            unitPrice: presentation.price,
            quantity: 1,
          },
        ],
      };
    }
    case "SET_QUANTITY": {
      const { key, quantity } = action.payload;

      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.key !== key),
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.key === key ? { ...item, quantity } : item
        ),
      };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.key !== action.payload.key),
      };
    case "CLEAR_CART":
      return initialState;
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const totals = useMemo(() => {
    const subtotal = state.items.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0
    );

    return {
      subtotal,
      total: subtotal,
      totalItems: state.items.reduce((acc, item) => acc + item.quantity, 0),
    };
  }, [state.items]);

  const value = useMemo(
    () => ({
      items: state.items,
      totals,
      addItem: (product, presentation) =>
        dispatch({ type: "ADD_ITEM", payload: { product, presentation } }),
      setQuantity: (key, quantity) =>
        dispatch({ type: "SET_QUANTITY", payload: { key, quantity } }),
      removeItem: (key) => dispatch({ type: "REMOVE_ITEM", payload: { key } }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),
    }),
    [state.items, totals]
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
