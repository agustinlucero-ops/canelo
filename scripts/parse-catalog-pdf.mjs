import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfPath = join(__dirname, "..", "docs", "catalogo-canelo.pdf");
const productsPath = join(__dirname, "..", "src", "data", "products.json");
const reportPath = join(__dirname, "catalog-diff-report.json");

const isStrict = process.argv.includes("--strict");

function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePriceToken(token) {
  const digits = String(token).replace(/[^\d]/g, "");
  if (!digits) return null;
  return Number(digits);
}

function extractProductsFromText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const products = [];
  let currentCategory = "Sin tacc";

  for (const line of lines) {
    if (/^categor[ií]a\b/i.test(line)) {
      continue;
    }

    if (line.length <= 40 && line === line.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(line)) {
      currentCategory = line
        .replace(/^[^\wÁÉÍÓÚÑ]+/u, "")
        .replace(/[^\wÁÉÍÓÚÑ\s\/-]+$/u, "")
        .trim();
      continue;
    }

    const priceMatch = line.match(/(.+?)\s+[\$]?\s*([\d.]{2,})\s*$/);
    if (!priceMatch) continue;

    const name = priceMatch[1].trim();
    const price = parsePriceToken(priceMatch[2]);
    if (!name || !price || price <= 0) continue;

    products.push({
      name,
      category: currentCategory,
      presentations: [{ label: "1u", price }],
    });
  }

  return products;
}

function buildDiff(pdfProducts, jsonProducts) {
  const pdfByName = new Map(pdfProducts.map((p) => [normalizeName(p.name), p]));
  const jsonByName = new Map(jsonProducts.map((p) => [normalizeName(p.name), p]));

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

    if (normalizeName(pdfProduct.category) !== normalizeName(jsonProduct.category)) {
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
  const pdfProducts = extractProductsFromText(parsed.text || "");
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
