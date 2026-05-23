import * as XLSX from "xlsx";

const REQUIRED_COLUMNS = ["categoria", "nombre", "precio"];

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeRow(rawRow) {
  const row = {};
  for (const [key, value] of Object.entries(rawRow ?? {})) {
    row[normalizeHeader(key)] = value;
  }
  return row;
}

function assertRequiredColumns(sampleRow) {
  const missing = REQUIRED_COLUMNS.filter(
    (column) => sampleRow[column] === undefined || sampleRow[column] === ""
  );
  if (missing.length) {
    throw new Error(
      `Plantilla inválida: faltan columnas obligatorias (${REQUIRED_COLUMNS.join(", ")}).`
    );
  }
}

export function parseCatalogSpreadsheet(buffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("La planilla no tiene hojas.");
  }

  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
  if (!rawRows.length) {
    throw new Error("La planilla no tiene filas de productos.");
  }

  const normalizedRows = rawRows.map(normalizeRow);
  assertRequiredColumns(normalizedRows[0]);

  return normalizedRows
    .map((row) => {
      const categoria = String(row.categoria ?? "").trim();
      const nombre = String(row.nombre ?? "").trim();
      const precio = Number(String(row.precio ?? "").replace(",", "."));
      if (!categoria || !nombre || Number.isNaN(precio) || precio <= 0) {
        return null;
      }

      const parsedRow = {
        categoria,
        nombre,
        precio: Math.round(precio),
      };

      const presentacion = String(row.presentacion ?? "").trim();
      if (presentacion) {
        parsedRow.presentacion = presentacion;
      }

      return parsedRow;
    })
    .filter(Boolean);
}
