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

  it("updates flavor-line cart items from line presentations and variant stock", () => {
    const flavorLineProducts = [
      {
        id: "granola-cuca",
        name: "Granola CUCA",
        productType: "flavor-line",
        image: "/images/products/granola.svg",
        outOfStock: false,
        presentations: [{ label: "1kg", price: 11000 }],
        variants: [
          {
            id: "cuca-tradicional",
            label: "Tradicional",
            image: "/images/products/granola.svg",
            outOfStock: false,
          },
        ],
      },
    ];

    const { items, removedCount } = reconcileCartItems(
      [
        {
          key: "cuca-tradicional-1kg",
          productId: "cuca-tradicional",
          lineId: "granola-cuca",
          flavorLabel: "Tradicional",
          name: "Granola CUCA — Tradicional",
          image: "/images/products/granola.svg",
          presentation: "1kg",
          unitPrice: 10300,
          quantity: 1,
        },
      ],
      flavorLineProducts
    );

    expect(removedCount).toBe(0);
    expect(items[0].unitPrice).toBe(11000);
    expect(items[0].name).toBe("Granola CUCA — Tradicional");
  });

  it("removes flavor-line cart items when the variant is out of stock", () => {
    const flavorLineProducts = [
      {
        id: "granola-cuca",
        productType: "flavor-line",
        presentations: [{ label: "1kg", price: 10300 }],
        variants: [
          {
            id: "cuca-tradicional",
            label: "Tradicional",
            image: "/images/products/granola.svg",
            outOfStock: true,
          },
        ],
      },
    ];

    const { items, removedCount } = reconcileCartItems(
      [
        {
          key: "cuca-tradicional-1kg",
          productId: "cuca-tradicional",
          lineId: "granola-cuca",
          name: "Granola CUCA — Tradicional",
          image: "/images/products/granola.svg",
          presentation: "1kg",
          unitPrice: 10300,
          quantity: 1,
        },
      ],
      flavorLineProducts
    );

    expect(removedCount).toBe(1);
    expect(items).toHaveLength(0);
  });
});
