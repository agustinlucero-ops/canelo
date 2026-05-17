import { describe, expect, it } from "vitest";
import { reconcileCartItems } from "./reconcileCart";

describe("reconcileCartItems", () => {
  const products = [
    {
      id: "almendra",
      name: "Almendra actualizada",
      image: "/images/products/almendra.svg",
      outOfStock: false,
      presentations: [
        { label: "1kg", price: 12000 },
        { label: "500g", price: 7000 },
      ],
    },
  ];

  it("updates price and name when product still exists", () => {
    const { items, removedCount } = reconcileCartItems(
      [
        {
          key: "almendra-1kg",
          productId: "almendra",
          name: "Almendra vieja",
          image: "/old.svg",
          presentation: "1kg",
          unitPrice: 10000,
          quantity: 1,
        },
      ],
      products
    );

    expect(removedCount).toBe(0);
    expect(items[0].name).toBe("Almendra actualizada");
    expect(items[0].unitPrice).toBe(12000);
  });

  it("removes items when product is missing or out of stock", () => {
    const { items, removedCount } = reconcileCartItems(
      [
        {
          key: "missing-1kg",
          productId: "missing",
          name: "X",
          image: "/x.svg",
          presentation: "1kg",
          unitPrice: 100,
          quantity: 1,
        },
      ],
      products
    );

    expect(removedCount).toBe(1);
    expect(items).toHaveLength(0);
  });
});
