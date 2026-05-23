import { parseCatalogSpreadsheet } from "./parseCatalogSpreadsheet";

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export async function readCatalogImportFile(file) {
  const fileName = String(file?.name ?? "").trim().toLowerCase();
  if (!fileName) {
    throw new Error("No se recibió un archivo de catálogo.");
  }

  const buffer = await file.arrayBuffer();

  if (fileName.endsWith(".pdf")) {
    return {
      type: "pdf",
      sourceFilename: file.name,
      pdfBase64: arrayBufferToBase64(buffer),
    };
  }

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
    return {
      type: "rows",
      sourceFilename: file.name,
      rows: parseCatalogSpreadsheet(buffer),
    };
  }

  throw new Error("Formato no soportado. Usá PDF o Excel (.xlsx, .xls, .csv).");
}
