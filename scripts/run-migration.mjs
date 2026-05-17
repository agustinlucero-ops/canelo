import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getSql } from "../server/db.mjs";
const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsPath = join(__dirname, "..", "db", "migrations");

function splitStatements(sqlText) {
  return sqlText
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function ensureMigrationsTable(sql) {
  await sql.query(
    `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `,
    []
  );
}

async function isMigrationApplied(sql, migrationId) {
  try {
    const rows = await sql`
      SELECT id FROM schema_migrations WHERE id = ${migrationId}
    `;
    return rows.length > 0;
  } catch (err) {
    if (err?.code === "42P01") return false;
    throw err;
  }
}

async function listMigrationFiles() {
  const files = readdirSync(migrationsPath).filter((fileName) => fileName.toLowerCase().endsWith(".sql"));
  return files.sort((a, b) => a.localeCompare(b, "en"));
}

async function main() {
  const sql = getSql();
  await ensureMigrationsTable(sql);
  const migrationFiles = await listMigrationFiles();
  let appliedCount = 0;

  for (const fileName of migrationFiles) {
    const migrationId = fileName.replace(/\.sql$/i, "");
    if (await isMigrationApplied(sql, migrationId)) {
      console.log(`Migración ${migrationId} ya aplicada.`);
      continue;
    }

    const migrationPath = join(migrationsPath, fileName);
    const migrationSql = readFileSync(migrationPath, "utf8");
    const statements = splitStatements(migrationSql);

    for (const statement of statements) {
      await sql.query(statement, []);
    }

    await sql`
      INSERT INTO schema_migrations (id) VALUES (${migrationId})
      ON CONFLICT (id) DO NOTHING
    `;

    appliedCount += 1;
    console.log(`Migración ${migrationId} aplicada (${statements.length} sentencias).`);
  }
  if (!appliedCount) {
    console.log("No hay migraciones pendientes.");
  }
}

main().catch((err) => {
  console.error("[db:migrate]", err);
  process.exit(1);
});
