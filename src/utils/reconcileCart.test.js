import { describe, expect, it } from "vitest";
import { reconcileCartItems } from "./reconcileCart";

describe("reconcileCartItems", () => {
  it("actualiza precio de venta y metadata de descuento al reconciliar", () => {
    const items = [
      {
        key: "almendra-500g",
        productId: "almendra",
        name: "Almendra",
        presentation: "500g",
        unitPrice: 16000,
        listPrice: 16000,
        quantity: 1,
        image: "img.jpg",
      },
    ];
    const products = [
      {
        id: "almendra",
        name: "Almendra",
        image: "img.jpg",
        presentations: [{ label: "500g", price: 16000, discountPercent: 10 }],
      },
    ];

    const { items: nextItems, updatedCount } = reconcileCartItems(items, products);

    expect(updatedCount).toBe(1);
    expect(nextItems[0].unitPrice).toBe(14400);
    expect(nextItems[0].listPrice).toBe(16000);
    expect(nextItems[0].discountPercent).toBe(10);
  });

  it("quita descuento si ya no aplica en el catálogo", () => {
    const items = [
      {
        key: "almendra-500g",
        productId: "almendra",
        name: "Almendra",
        presentation: "500g",
        unitPrice: 14400,
        listPrice: 16000,
        discountPercent: 10,
        quantity: 1,
        image: "img.jpg",
      },
    ];
    const products = [
      {
        id: "almendra",
        name: "Almendra",
        image: "img.jpg",
        presentations: [{ label: "500g", price: 16000 }],
      },
    ];

    const { items: nextItems, updatedCount } = reconcileCartItems(items, products);

    expect(updatedCount).toBe(1);
    expect(nextItems[0].unitPrice).toBe(16000);
    expect(nextItems[0].listPrice).toBe(16000);
    expect(nextItems[0].discountPercent).toBeUndefined();
  });
});
