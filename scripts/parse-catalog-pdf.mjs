import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractProductsFromPdfText,
  normalizeProductNameForMatch,
} from "../server/catalogImport.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfPath = join(__dirname, "..", "docs", "catalogo-canelo.pdf");
const productsPath = join(__dirname, "..", "src", "data", "products.json");
const reportPath = join(__dirname, "catalog-diff-report.json");

const isStrict = process.argv.includes("--strict");

function buildDiff(pdfProducts, jsonProducts) {
  const pdfByName = new Map(pdfProducts.map((p) => [normalizeProductNameForMatch(p.name), p]));
  const jsonByName = new Map(jsonProducts.map((p) => [normalizeProductNameForMatch(p.name), p]));

  const onlyInPdf = [];
  const onlyInJson = [];
  const priceMismatches = [];
  const categoryMismatches = [];

  for (const [name, pdfProduct] of pdfByName.entries()) {
    const jsonProduct = jsonByName.get(name);
    if (!jsonProduct) {
      onlyInPdf.push({ name: pdfProduct.name, category: pdfProduct.category });
      continue;
    }

    const pdfPrice = pdfProduct.presentations[0]?.price;
    const jsonPrice = jsonProduct.presentations?.[0]?.price;
    if (pdfPrice && jsonPrice && pdfPrice !== jsonPrice) {
      priceMismatches.push({
        name: pdfProduct.name,
        pdfPrice,
        jsonPrice,
      });
    }

    if (normalizeProductNameForMatch(pdfProduct.category) !== normalizeProductNameForMatch(jsonProduct.category)) {
      categoryMismatches.push({
        name: pdfProduct.name,
        pdfCategory: pdfProduct.category,
        jsonCategory: jsonProduct.category,
      });
    }
  }

  for (const [name, jsonProduct] of jsonByName.entries()) {
    if (!pdfByName.has(name)) {
      onlyInJson.push({ name: jsonProduct.name, category: jsonProduct.category });
    }
  }

  return { onlyInPdf, onlyInJson, priceMismatches, categoryMismatches };
}

async function main() {
  if (!existsSync(pdfPath)) {
    console.error(
      `No se encontró el PDF en ${pdfPath}.\n` +
        "Copiá el catálogo a docs/catalogo-canelo.pdf y volvé a ejecutar."
    );
    process.exit(1);
  }

  let pdfParse;
  try {
    pdfParse = (await import("pdf-parse")).default;
  } catch {
    console.error("Instalá la dependencia: npm install pdf-parse --save-dev");
    process.exit(1);
  }

  const pdfBuffer = readFileSync(pdfPath);
  const parsed = await pdfParse(pdfBuffer);
  const pdfProducts = extractProductsFromPdfText(parsed.text || "");
  const jsonProducts = JSON.parse(readFileSync(productsPath, "utf8"));

  const report = {
    generatedAt: new Date().toISOString(),
    pdfPath,
    productsPath,
    pdfProductCount: pdfProducts.length,
    jsonProductCount: jsonProducts.length,
    ...buildDiff(pdfProducts, jsonProducts),
  };

  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`Reporte generado: ${reportPath}`);
  console.log(`Productos en PDF: ${report.pdfProductCount}`);
  console.log(`Productos en JSON: ${report.jsonProductCount}`);
  console.log(`Solo en PDF: ${report.onlyInPdf.length}`);
  console.log(`Solo en JSON: ${report.onlyInJson.length}`);
  console.log(`Diferencias de precio: ${report.priceMismatches.length}`);
  console.log(`Diferencias de categoría: ${report.categoryMismatches.length}`);

  if (
    isStrict &&
    (report.onlyInPdf.length ||
      report.onlyInJson.length ||
      report.priceMismatches.length ||
      report.categoryMismatches.length)
  ) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
