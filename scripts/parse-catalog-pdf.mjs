/**
 * Fase 2: reconciliación del catálogo con el PDF.
 *
 * Uso previsto:
 *   1. Colocar el PDF en docs/catalogo-canelo.pdf
 *   2. npm install pdf-parse (devDependency)
 *   3. node scripts/parse-catalog-pdf.mjs
 *
 * Generará scripts/catalog-diff-report.json comparando PDF vs products.json vs Neon.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfPath = join(__dirname, "..", "docs", "catalogo-canelo.pdf");
const reportPath = join(__dirname, "catalog-diff-report.json");

function main() {
  if (!existsSync(pdfPath)) {
    console.error(
      `No se encontró el PDF en ${pdfPath}.\n` +
        "Copiá 'Catálogo - CANELO.pdf' a docs/catalogo-canelo.pdf y volvé a ejecutar."
    );
    process.exit(1);
  }

  console.log(
    "Parser de PDF pendiente de implementación.\n" +
      `PDF detectado: ${pdfPath}\n` +
      `Reporte previsto: ${reportPath}\n` +
      "Instalá pdf-parse y completá la extracción en una segunda pasada."
  );
  process.exit(0);
}

main();
