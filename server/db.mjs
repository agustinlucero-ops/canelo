import { neon } from "@neondatabase/serverless";

let sql;

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    throw new Error("DATABASE_URL no está definida");
  }
  if (!sql) sql = neon(url.trim());
  return sql;
}
