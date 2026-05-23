import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseCatalogSpreadsheet } from "./parseCatalogSpreadsheet";

function buildSpreadsheetBuffer(rows) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Catalogo");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

describe("parseCatalogSpreadsheet", () => {
  it("lee filas con la plantilla fija categoria, nombre y precio", () => {
    const buffer = buildSpreadsheetBuffer([
      {
        categoria: "Frutos secos",
        nombre: "Nuez pecan",
        precio: 8500,
        presentacion: "500g",
      },
      {
        categoria: "Varios",
        nombre: "Stevia",
        precio: 3200,
      },
    ]);

    const rows = parseCatalogSpreadsheet(buffer);

    expect(rows).toEqual([
      {
        categoria: "Frutos secos",
        nombre: "Nuez pecan",
        precio: 8500,
        presentacion: "500g",
      },
      {
        categoria: "Varios",
        nombre: "Stevia",
        precio: 3200,
      },
    ]);
  });

  it("rechaza planillas sin columnas obligatorias", () => {
    const buffer = buildSpreadsheetBuffer([
      {
        producto: "Nuez pecan",
        precio: 8500,
      },
    ]);

    expect(() => parseCatalogSpreadsheet(buffer)).toThrow(/categoria|nombre|plantilla/i);
  });
});
