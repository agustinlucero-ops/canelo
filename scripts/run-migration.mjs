import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getSql } from "../server/db.mjs";

const MIGRATION_ID = "001_catalog";
const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(__dirname, "..", "db", "migrations", `${MIGRATION_ID}.sql`);

function splitStatements(sqlText) {
  return sqlText
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function isMigrationApplied(sql) {
  try {
    const rows = await sql`
      SELECT id FROM schema_migrations WHERE id = ${MIGRATION_ID}
    `;
    return rows.length > 0;
  } catch (err) {
    if (err?.code === "42P01") return false;
    throw err;
  }
}

async function main() {
  const sql = getSql();

  if (await isMigrationApplied(sql)) {
    console.log(`Migración ${MIGRATION_ID} ya aplicada.`);
    return;
  }

  const migrationSql = readFileSync(migrationPath, "utf8");
  const statements = splitStatements(migrationSql);

  for (const statement of statements) {
    await sql.query(statement, []);
  }

  await sql`
    INSERT INTO schema_migrations (id) VALUES (${MIGRATION_ID})
    ON CONFLICT (id) DO NOTHING
  `;

  console.log(`Migración ${MIGRATION_ID} aplicada (${statements.length} sentencias).`);
}

main().catch((err) => {
  console.error("[db:migrate]", err);
  process.exit(1);
});
