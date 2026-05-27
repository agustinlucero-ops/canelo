import "dotenv/config";
import { getSql } from "../server/db.mjs";

const LEGACY_GRANOLA_IDS = [
  "cuca-tradicional",
  "cuca-cacao-coco",
  "cuca-vegana-stevia",
  "tutti-grani-almendra",
  "tutti-grani-tradicional",
  "tutti-grani-stevia-vegana",
];

async function main() {
  const sql = getSql();
  for (const id of LEGACY_GRANOLA_IDS) {
    const rows = await sql`DELETE FROM products WHERE id = ${id} RETURNING id`;
    if (rows.length) console.log(`Eliminado: ${id}`);
  }
  console.log("Limpieza de granolas legacy completada.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
