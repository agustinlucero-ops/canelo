import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { readCatalogImportFile } from "./readCatalogImportFile";

function buildSpreadsheetBuffer(rows) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Catalogo");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

describe("readCatalogImportFile", () => {
  it("prepara filas cuando el archivo de catálogo es Excel", async () => {
    const buffer = buildSpreadsheetBuffer([
      { categoria: "Varios", nombre: "Stevia", precio: 3200 },
    ]);

    const payload = await readCatalogImportFile({
      name: "marzo.xlsx",
      arrayBuffer: async () => buffer,
    });

    expect(payload.type).toBe("rows");
    expect(payload.rows).toHaveLength(1);
    expect(payload.sourceFilename).toBe("marzo.xlsx");
  });

  it("prepara base64 cuando el archivo de catálogo es PDF", async () => {
    const pdfBytes = new TextEncoder().encode("%PDF-1.4 prueba");

    const payload = await readCatalogImportFile({
      name: "marzo.pdf",
      arrayBuffer: async () => pdfBytes.buffer,
    });

    expect(payload.type).toBe("pdf");
    expect(payload.pdfBase64.length).toBeGreaterThan(10);
  });
});
