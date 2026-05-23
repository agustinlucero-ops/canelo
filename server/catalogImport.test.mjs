import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildImportPlan,
  extractProductsFromPdfText,
  parseStrictCatalogRows,
} from "./catalogImport.mjs";

describe("buildImportPlan", () => {
  it("solo productos nuevos agrega desconocidos al borrador y omite existentes en línea", () => {
    const plan = buildImportPlan({
      parsedProducts: [
        {
          name: "Nuez pecan",
          category: "Frutos secos",
          presentations: [{ label: "500g", price: 8500 }],
        },
        {
          name: "Almendra non pareil",
          category: "Frutos secos",
          presentations: [{ label: "100g", price: 4200 }],
        },
      ],
      liveProducts: [
        {
          id: "almendra-non-pareil",
          name: "Almendra non pareil",
          category: "Frutos secos",
          presentations: [{ label: "100g", price: 4200 }],
        },
      ],
      importMode: "new_products_only",
      updateExisting: false,
    });

    assert.equal(plan.toCreate.length, 1);
    assert.equal(plan.toCreate[0].name, "Nuez pecan");
    assert.equal(plan.skipped.length, 1);
    assert.equal(plan.skipped[0].name, "Almendra non pareil");
    assert.match(plan.skipped[0].reason, /exist/i);
  });

  it("catálogo completo con actualizar existentes prepara updates con id y datos del archivo", () => {
    const plan = buildImportPlan({
      parsedProducts: [
        {
          name: "Almendra non pareil",
          category: "Semillas",
          presentations: [{ label: "1kg", price: 26000 }],
        },
      ],
      liveProducts: [
        {
          id: "almendra-non-pareil",
          name: "Almendra non pareil",
          category: "Frutos secos",
          presentations: [{ label: "100g", price: 4200 }],
        },
      ],
      importMode: "full_catalog",
      updateExisting: true,
    });

    assert.equal(plan.toCreate.length, 0);
    assert.equal(plan.skipped.length, 0);
    assert.equal(plan.toUpdate.length, 1);
    assert.equal(plan.toUpdate[0].existingId, "almendra-non-pareil");
    assert.equal(plan.toUpdate[0].category, "Semillas");
    assert.deepEqual(plan.toUpdate[0].presentations, [{ label: "1kg", price: 26000 }]);
  });

  it("detecta categorías nuevas que no están en el catálogo en línea", () => {
    const plan = buildImportPlan({
      parsedProducts: [
        {
          name: "Matcha en polvo",
          category: "Superfoods",
          presentations: [{ label: "100g", price: 5200 }],
        },
      ],
      liveProducts: [],
      liveCategories: ["Frutos secos", "Sin tacc"],
      importMode: "new_products_only",
      updateExisting: false,
    });

    assert.deepEqual(plan.newCategories, ["Superfoods"]);
  });
});

describe("extractProductsFromPdfText", () => {
  it("lee categorías en mayúsculas y líneas nombre + precio", () => {
    const text = [
      "FRUTOS SECOS",
      "Nuez pecan 8500",
      "KETO",
      "Harina de almendra 12000",
    ].join("\n");

    const products = extractProductsFromPdfText(text);

    assert.equal(products.length, 2);
    assert.equal(products[0].name, "Nuez pecan");
    assert.equal(products[0].category, "FRUTOS SECOS");
    assert.equal(products[0].presentations[0].price, 8500);
    assert.equal(products[1].name, "Harina de almendra");
    assert.equal(products[1].category, "KETO");
  });
});

describe("parseStrictCatalogRows", () => {
  it("rechaza filas que no usan la plantilla fija de columnas", () => {
    assert.throws(
      () =>
        parseStrictCatalogRows([
          { producto: "Nuez pecan", precio: 8500, categoria: "Frutos secos" },
        ]),
      (error) => /nombre|plantilla/i.test(error.message)
    );
  });

  it("normaliza filas con categoria, nombre, precio y presentacion opcional", () => {
    const products = parseStrictCatalogRows([
      {
        categoria: "Frutos secos",
        nombre: "Nuez pecan",
        precio: "8500",
        presentacion: "500g",
      },
      {
        categoria: "Frutos secos",
        nombre: "Nuez pecan",
        precio: 16000,
        presentacion: "1kg",
      },
      {
        categoria: "Varios",
        nombre: "Stevia",
        precio: 3200,
      },
    ]);

    assert.equal(products.length, 2);
    assert.deepEqual(products[0].presentations, [
      { label: "500g", price: 8500 },
      { label: "1kg", price: 16000 },
    ]);
    assert.deepEqual(products[1].presentations, [{ label: "1u", price: 3200 }]);
  });
});
