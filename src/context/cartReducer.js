import { buildFlavorLineCartItem } from "../utils/flavorLineCart";

export const cartInitialState = {
  items: [],
};

export function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_FLAVOR_LINE_ITEM": {
      const { line, variant, presentation } = action.payload;
      const nextItem = buildFlavorLineCartItem({ line, variant, presentation });
      const existing = state.items.find((item) => item.key === nextItem.key);

      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.key === nextItem.key ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }

      return {
        ...state,
        items: [...state.items, nextItem],
      };
    }
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
    case "RECONCILE_WITH_CATALOG":
      return {
        ...state,
        items: action.payload.items,
      };
    case "CLEAR_CART":
      return cartInitialState;
    default:
      return state;
  }
}

export function computeCartTotals(items) {
  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  return {
    subtotal,
    total: subtotal,
    totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
  };
}
