import { describe, expect, it } from "vitest";
import { groupDraftItemsByCategory } from "./groupDraftItemsByCategory";

describe("groupDraftItemsByCategory", () => {
  it("agrupa ítems del borrador por categoría para la revisión visual", () => {
    const groups = groupDraftItemsByCategory([
      { id: "1", payload: { category: "Varios", name: "Stevia" } },
      { id: "2", payload: { category: "Frutos secos", name: "Nuez" } },
      { id: "3", payload: { category: "Frutos secos", name: "Almendra" } },
    ]);

    expect(groups).toEqual([
      ["Frutos secos", expect.any(Array)],
      ["Varios", expect.any(Array)],
    ]);
    expect(groups[0][1]).toHaveLength(2);
  });
});
