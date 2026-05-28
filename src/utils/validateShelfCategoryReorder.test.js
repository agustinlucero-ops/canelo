import { describe, expect, it } from "vitest";
import {
  validateShelfCategoryReorder,
  ValidationError,
} from "./validateShelfCategoryReorder.js";

describe("validateShelfCategoryReorder", () => {
  const shelfNames = ["Granolas", "Frutos secos", "Semillas"];

  it("acepta una permutación completa de estantes", () => {
    expect(() =>
      validateShelfCategoryReorder(["Semillas", "Granolas", "Frutos secos"], shelfNames)
    ).not.toThrow();
  });

  it("rechaza si falta un estante", () => {
    expect(() => validateShelfCategoryReorder(["Granolas"], shelfNames)).toThrow(ValidationError);
  });

  it("rechaza si incluye un filtro de tienda", () => {
    expect(() =>
      validateShelfCategoryReorder(["Keto", "Granolas", "Frutos secos", "Semillas"], shelfNames)
    ).toThrow(ValidationError);
  });
});
